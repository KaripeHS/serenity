#!/bin/bash

###############################################################################
# Serenity ERP Rollback Script
#
# Quick rollback to previous deployment or specific version:
# - Rollback application code to previous release
# - Rollback database migrations
# - Rollback to specific backup
# - Health check verification after rollback
# - Automatic PM2 process restart
#
# Usage:
#   ./scripts/rollback.sh <environment> [options]
#
# Environments:
#   staging     - Rollback staging server
#   production  - Rollback production server
#
# Options:
#   --to-release <timestamp>    Rollback to specific release (default: previous)
#   --to-backup <file>          Restore from specific database backup
#   --skip-database             Skip database rollback
#   --force                     Force rollback without confirmations
#
# Examples:
#   ./scripts/rollback.sh production
#   ./scripts/rollback.sh staging --to-release 20240115_143022
#   ./scripts/rollback.sh production --to-backup backups/production_20240115_120000.sql.gz
#   ./scripts/rollback.sh staging --skip-database
#
# Prerequisites:
#   - SSH access to target server
#   - PM2 installed on server
#   - PostgreSQL database access
#   - Previous deployment releases exist
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
LOG_FILE="$PROJECT_ROOT/logs/rollback_$TIMESTAMP.log"

# Default options
ENVIRONMENT=""
TARGET_RELEASE="previous"
TARGET_BACKUP=""
SKIP_DATABASE=false
FORCE=false

###############################################################################
# Helper Functions
###############################################################################

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✓${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}✗${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1" | tee -a "$LOG_FILE"
}

confirm() {
    if [ "$FORCE" = true ]; then
        return 0
    fi

    read -p "$(echo -e ${YELLOW}$1${NC}) (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        error "Rollback cancelled by user"
        exit 1
    fi
}

###############################################################################
# Parse Arguments
###############################################################################

while [[ $# -gt 0 ]]; do
    case $1 in
        staging|production)
            ENVIRONMENT="$1"
            shift
            ;;
        --to-release)
            TARGET_RELEASE="$2"
            shift 2
            ;;
        --to-backup)
            TARGET_BACKUP="$2"
            shift 2
            ;;
        --skip-database)
            SKIP_DATABASE=true
            shift
            ;;
        --force)
            FORCE=true
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
# Pre-Rollback Checks
###############################################################################

warning "========================================="
warning "ROLLBACK TO PREVIOUS DEPLOYMENT"
warning "========================================="
log ""
log "Environment: $ENVIRONMENT"
log "Target release: $TARGET_RELEASE"
log "Skip database: $SKIP_DATABASE"
log ""

# Create logs directory
mkdir -p "$PROJECT_ROOT/logs"

# Get current release
log "Checking current deployment..."
CURRENT_RELEASE=$(ssh "$DEPLOY_USER@$DEPLOY_HOST" "readlink $DEPLOY_PATH/current" || echo "unknown")
if [ "$CURRENT_RELEASE" = "unknown" ]; then
    error "Cannot determine current release"
    exit 1
fi
log "Current release: $(basename $CURRENT_RELEASE)"

# Determine target release
if [ "$TARGET_RELEASE" = "previous" ]; then
    log "Finding previous release..."
    TARGET_RELEASE=$(ssh "$DEPLOY_USER@$DEPLOY_HOST" "cd $DEPLOY_PATH/releases && ls -t | head -n 2 | tail -n 1" || echo "")
    if [ -z "$TARGET_RELEASE" ]; then
        error "No previous release found"
        exit 1
    fi
    log "Previous release: $TARGET_RELEASE"
else
    log "Checking if release exists: $TARGET_RELEASE"
    if ! ssh "$DEPLOY_USER@$DEPLOY_HOST" "[ -d $DEPLOY_PATH/releases/$TARGET_RELEASE ]"; then
        error "Release not found: $TARGET_RELEASE"
        exit 1
    fi
    success "Release found: $TARGET_RELEASE"
fi

# Confirm rollback
confirm "Rollback from $(basename $CURRENT_RELEASE) to $TARGET_RELEASE?"

###############################################################################
# Create Pre-Rollback Backup
###############################################################################

log "Creating pre-rollback backup..."

# Create backup using backup script
if "$SCRIPT_DIR/backup.sh" --environment "$ENVIRONMENT" --verify >> "$LOG_FILE" 2>&1; then
    success "Pre-rollback backup created"
else
    warning "Pre-rollback backup failed (continuing anyway)"
fi

###############################################################################
# Rollback Database
###############################################################################

if [ "$SKIP_DATABASE" = false ]; then
    warning "Rolling back database..."

    # If specific backup is provided, use it
    if [ -n "$TARGET_BACKUP" ]; then
        log "Restoring from backup: $TARGET_BACKUP"

        if [ ! -f "$TARGET_BACKUP" ]; then
            error "Backup file not found: $TARGET_BACKUP"
            exit 1
        fi

        # Restore database from backup
        log "Dropping and recreating database..."
        psql "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" || {
            error "Failed to reset database"
            exit 1
        }

        log "Restoring database from backup..."
        if [[ "$TARGET_BACKUP" == *.gz ]]; then
            gunzip -c "$TARGET_BACKUP" | psql "$DATABASE_URL" || {
                error "Database restore failed"
                exit 1
            }
        else
            psql "$DATABASE_URL" < "$TARGET_BACKUP" || {
                error "Database restore failed"
                exit 1
            }
        fi

        success "Database restored from backup"
    else
        # Rollback migrations
        log "Rolling back database migrations..."
        cd "$PROJECT_ROOT/backend"

        # Determine how many migrations to rollback
        # This is a simplified approach - in production you'd want more sophisticated logic
        log "Rolling back one migration step..."
        if npm run migrate:rollback; then
            success "Database migration rolled back"
        else
            error "Database rollback failed"
            warning "You may need to manually restore from backup"
            exit 1
        fi
    fi
else
    warning "Skipping database rollback (--skip-database flag set)"
fi

###############################################################################
# Rollback Application Code
###############################################################################

log "Rolling back application code..."

# Update symlink to target release
log "Switching to release: $TARGET_RELEASE"
ssh "$DEPLOY_USER@$DEPLOY_HOST" "cd $DEPLOY_PATH && ln -sfn releases/$TARGET_RELEASE current" || {
    error "Failed to update release symlink"
    exit 1
}
success "Release symlink updated"

# Restart backend with PM2
log "Restarting backend service..."
ssh "$DEPLOY_USER@$DEPLOY_HOST" "cd $DEPLOY_PATH/current/backend && pm2 reload serenity-backend" || {
    error "Failed to restart backend service"
    exit 1
}
success "Backend service restarted"

###############################################################################
# Post-Rollback Verification
###############################################################################

log "Running post-rollback health checks..."

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
    warning "Service may not be running correctly after rollback"
    exit 1
fi

# Check frontend
log "Checking frontend..."
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")

if [ "$FRONTEND_RESPONSE" = "200" ]; then
    success "Frontend health check passed"
else
    error "Frontend health check failed (HTTP $FRONTEND_RESPONSE)"
    warning "Frontend may not be accessible"
fi

###############################################################################
# Rollback Complete
###############################################################################

success "========================================="
success "Rollback completed successfully!"
success "========================================="
log ""
log "Rollback Summary:"
log "  Environment: $ENVIRONMENT"
log "  Rolled back from: $(basename $CURRENT_RELEASE)"
log "  Rolled back to: $TARGET_RELEASE"
log "  Database rollback: $([ "$SKIP_DATABASE" = false ] && echo "Yes" || echo "No")"
log "  Backend URL: $API_URL"
log "  Frontend URL: $FRONTEND_URL"
log ""
log "Rollback log: $LOG_FILE"
log ""
log "To roll forward (deploy again):"
log "  ./scripts/deploy.sh $ENVIRONMENT"
log ""
