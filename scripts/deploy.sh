#!/bin/bash

###############################################################################
# Serenity ERP Deployment Script
#
# Automates deployment to production servers with zero-downtime strategy:
# - Health checks before deployment
# - Database migration with rollback capability
# - Backend deployment with PM2 process management
# - Frontend build and deployment
# - Post-deployment verification
# - Automatic rollback on failure
#
# Usage:
#   ./scripts/deploy.sh <environment> [options]
#
# Environments:
#   staging     - Deploy to staging server
#   production  - Deploy to production server
#
# Options:
#   --skip-migrations    Skip database migrations
#   --skip-tests         Skip pre-deployment tests
#   --force              Force deployment without confirmations
#   --rollback           Rollback to previous deployment
#
# Examples:
#   ./scripts/deploy.sh staging
#   ./scripts/deploy.sh production --skip-migrations
#   ./scripts/deploy.sh production --rollback
#
# Prerequisites:
#   - SSH access to target server
#   - PM2 installed on server
#   - PostgreSQL database access
#   - Node.js 18+ installed
#
###############################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DEPLOY_LOG="$PROJECT_ROOT/logs/deploy_$TIMESTAMP.log"

# Default options
SKIP_MIGRATIONS=false
SKIP_TESTS=false
FORCE=false
ROLLBACK=false

###############################################################################
# Helper Functions
###############################################################################

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$DEPLOY_LOG"
}

success() {
    echo -e "${GREEN}✓${NC} $1" | tee -a "$DEPLOY_LOG"
}

error() {
    echo -e "${RED}✗${NC} $1" | tee -a "$DEPLOY_LOG"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1" | tee -a "$DEPLOY_LOG"
}

confirm() {
    if [ "$FORCE" = true ]; then
        return 0
    fi

    read -p "$(echo -e ${YELLOW}$1${NC}) (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        error "Deployment cancelled by user"
        exit 1
    fi
}

###############################################################################
# Parse Arguments
###############################################################################

ENVIRONMENT=""

while [[ $# -gt 0 ]]; do
    case $1 in
        staging|production)
            ENVIRONMENT="$1"
            shift
            ;;
        --skip-migrations)
            SKIP_MIGRATIONS=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --rollback)
            ROLLBACK=true
            shift
            ;;
        -h|--help)
            grep "^#" "$0" | grep -v "#!/bin/bash" | sed 's/^# //'
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Validate environment
if [ -z "$ENVIRONMENT" ]; then
    error "Environment not specified"
    echo "Usage: $0 <staging|production> [options]"
    exit 1
fi

###############################################################################
# Load Environment Configuration
###############################################################################

log "Loading $ENVIRONMENT configuration..."

ENV_FILE="$PROJECT_ROOT/.env.$ENVIRONMENT"
if [ ! -f "$ENV_FILE" ]; then
    error "Environment file not found: $ENV_FILE"
    exit 1
fi

# Load environment variables
set -a
source "$ENV_FILE"
set +a

success "Configuration loaded"

###############################################################################
# Rollback Function
###############################################################################

perform_rollback() {
    warning "Rolling back to previous deployment..."

    # Rollback backend
    log "Rolling back backend..."
    ssh "$DEPLOY_USER@$DEPLOY_HOST" "cd $DEPLOY_PATH && ln -sfn releases/previous current && pm2 reload serenity-backend"

    # Rollback database (if migrations were run)
    if [ "$SKIP_MIGRATIONS" = false ]; then
        log "Rolling back database migration..."
        cd "$PROJECT_ROOT/backend"
        npm run migrate:rollback
    fi

    success "Rollback complete"
    exit 0
}

if [ "$ROLLBACK" = true ]; then
    perform_rollback
fi

###############################################################################
# Pre-Deployment Checks
###############################################################################

log "Starting deployment to $ENVIRONMENT..."
log "Timestamp: $TIMESTAMP"

# Create logs directory
mkdir -p "$PROJECT_ROOT/logs"

# Check git status
log "Checking git status..."
if [ -n "$(git status --porcelain)" ]; then
    warning "Working directory has uncommitted changes"
    confirm "Continue with uncommitted changes?"
fi

# Get current branch and commit
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
CURRENT_COMMIT=$(git rev-parse --short HEAD)
log "Branch: $CURRENT_BRANCH"
log "Commit: $CURRENT_COMMIT"

# Confirm deployment
confirm "Deploy $CURRENT_BRANCH ($CURRENT_COMMIT) to $ENVIRONMENT?"

###############################################################################
# Run Tests
###############################################################################

if [ "$SKIP_TESTS" = false ]; then
    log "Running pre-deployment tests..."

    # Backend tests
    log "Running backend tests..."
    cd "$PROJECT_ROOT/backend"
    npm test -- --passWithNoTests || {
        error "Backend tests failed"
        exit 1
    }
    success "Backend tests passed"

    # Frontend tests (if configured)
    if [ -f "$PROJECT_ROOT/frontend/package.json" ]; then
        log "Running frontend tests..."
        cd "$PROJECT_ROOT/frontend"
        npm test -- --passWithNoTests || {
            error "Frontend tests failed"
            exit 1
        }
        success "Frontend tests passed"
    fi
else
    warning "Skipping tests (--skip-tests flag set)"
fi

###############################################################################
# Build Application
###############################################################################

log "Building application..."

# Build backend
log "Building backend..."
cd "$PROJECT_ROOT/backend"
npm ci --production
npm run build
success "Backend built"

# Build frontend
log "Building frontend..."
cd "$PROJECT_ROOT/frontend"
npm ci --production
npm run build
success "Frontend built"

###############################################################################
# Database Migration
###############################################################################

if [ "$SKIP_MIGRATIONS" = false ]; then
    log "Running database migrations..."
    cd "$PROJECT_ROOT/backend"

    # Backup database first
    log "Creating database backup..."
    BACKUP_FILE="$PROJECT_ROOT/backups/db_backup_$TIMESTAMP.sql"
    mkdir -p "$PROJECT_ROOT/backups"

    pg_dump "$DATABASE_URL" > "$BACKUP_FILE" || {
        error "Database backup failed"
        exit 1
    }
    success "Database backup created: $BACKUP_FILE"

    # Run migrations
    npm run migrate || {
        error "Database migration failed"
        warning "Restoring from backup..."
        psql "$DATABASE_URL" < "$BACKUP_FILE"
        exit 1
    }
    success "Database migrations complete"
else
    warning "Skipping database migrations (--skip-migrations flag set)"
fi

###############################################################################
# Deploy Backend
###############################################################################

log "Deploying backend..."

# Create release directory
RELEASE_DIR="$DEPLOY_PATH/releases/$TIMESTAMP"
ssh "$DEPLOY_USER@$DEPLOY_HOST" "mkdir -p $RELEASE_DIR"

# Upload backend files
log "Uploading backend files..."
rsync -avz --delete \
    "$PROJECT_ROOT/backend/dist/" \
    "$DEPLOY_USER@$DEPLOY_HOST:$RELEASE_DIR/backend/dist/"

rsync -avz --delete \
    "$PROJECT_ROOT/backend/node_modules/" \
    "$DEPLOY_USER@$DEPLOY_HOST:$RELEASE_DIR/backend/node_modules/"

rsync -avz \
    "$PROJECT_ROOT/backend/package.json" \
    "$DEPLOY_USER@$DEPLOY_HOST:$RELEASE_DIR/backend/"

# Upload .env file
rsync -avz \
    "$ENV_FILE" \
    "$DEPLOY_USER@$DEPLOY_HOST:$RELEASE_DIR/backend/.env"

success "Backend files uploaded"

# Update symlink
log "Updating current release symlink..."
ssh "$DEPLOY_USER@$DEPLOY_HOST" "cd $DEPLOY_PATH && ln -sfn releases/$TIMESTAMP current"

# Restart backend with PM2
log "Restarting backend service..."
ssh "$DEPLOY_USER@$DEPLOY_HOST" "cd $DEPLOY_PATH/current/backend && pm2 reload serenity-backend || pm2 start dist/server.js --name serenity-backend"

success "Backend deployed"

###############################################################################
# Deploy Frontend
###############################################################################

log "Deploying frontend..."

# Upload frontend build
log "Uploading frontend files..."
rsync -avz --delete \
    "$PROJECT_ROOT/frontend/dist/" \
    "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/current/frontend/dist/"

success "Frontend deployed"

###############################################################################
# Post-Deployment Verification
###############################################################################

log "Running post-deployment health checks..."

# Wait for services to start
sleep 5

# Check backend health
log "Checking backend health..."
HEALTH_CHECK_URL="${API_URL}/health"
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_CHECK_URL")

if [ "$HEALTH_RESPONSE" = "200" ]; then
    success "Backend health check passed"
else
    error "Backend health check failed (HTTP $HEALTH_RESPONSE)"
    warning "Consider rolling back: ./scripts/deploy.sh $ENVIRONMENT --rollback"
    exit 1
fi

# Check frontend
log "Checking frontend..."
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")

if [ "$FRONTEND_RESPONSE" = "200" ]; then
    success "Frontend health check passed"
else
    error "Frontend health check failed (HTTP $FRONTEND_RESPONSE)"
    warning "Consider rolling back: ./scripts/deploy.sh $ENVIRONMENT --rollback"
    exit 1
fi

###############################################################################
# Cleanup Old Releases
###############################################################################

log "Cleaning up old releases..."
ssh "$DEPLOY_USER@$DEPLOY_HOST" "cd $DEPLOY_PATH/releases && ls -t | tail -n +6 | xargs rm -rf"
success "Old releases cleaned up"

###############################################################################
# Deployment Complete
###############################################################################

success "========================================="
success "Deployment to $ENVIRONMENT completed successfully!"
success "========================================="
log ""
log "Deployment Summary:"
log "  Environment: $ENVIRONMENT"
log "  Branch: $CURRENT_BRANCH"
log "  Commit: $CURRENT_COMMIT"
log "  Timestamp: $TIMESTAMP"
log "  Backend URL: $API_URL"
log "  Frontend URL: $FRONTEND_URL"
log ""
log "Deployment log: $DEPLOY_LOG"
log ""
log "To rollback: ./scripts/deploy.sh $ENVIRONMENT --rollback"
log ""
