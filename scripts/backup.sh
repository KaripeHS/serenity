#!/bin/bash

###############################################################################
# Serenity ERP Database Backup Script
#
# Automates database backups with compression and retention management:
# - Full PostgreSQL database dump
# - Gzip compression to save space
# - Configurable retention policy (default: 30 days)
# - Support for both local and remote backup storage
# - Backup verification
# - Backup rotation (auto-delete old backups)
#
# Usage:
#   ./scripts/backup.sh [options]
#
# Options:
#   --environment <env>    Environment to backup (staging/production)
#   --retention <days>     Number of days to retain backups (default: 30)
#   --remote               Upload backup to remote storage (S3/rsync)
#   --verify               Verify backup integrity after creation
#
# Examples:
#   ./scripts/backup.sh --environment production
#   ./scripts/backup.sh --environment staging --retention 60 --verify
#   ./scripts/backup.sh --environment production --remote
#
# Prerequisites:
#   - PostgreSQL client (pg_dump, psql)
#   - Database credentials in .env file
#   - Write permissions to backup directory
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
BACKUP_DIR="$PROJECT_ROOT/backups"
LOG_FILE="$PROJECT_ROOT/logs/backup_$TIMESTAMP.log"

# Default options
ENVIRONMENT=""
RETENTION_DAYS=30
REMOTE_BACKUP=false
VERIFY_BACKUP=false

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

###############################################################################
# Parse Arguments
###############################################################################

while [[ $# -gt 0 ]]; do
    case $1 in
        --environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --retention)
            RETENTION_DAYS="$2"
            shift 2
            ;;
        --remote)
            REMOTE_BACKUP=true
            shift
            ;;
        --verify)
            VERIFY_BACKUP=true
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
    echo "Usage: $0 --environment <staging|production> [options]"
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
# Create Backup
###############################################################################

log "Starting database backup for $ENVIRONMENT..."
log "Timestamp: $TIMESTAMP"

# Create backup and log directories
mkdir -p "$BACKUP_DIR"
mkdir -p "$PROJECT_ROOT/logs"

# Generate backup filename
BACKUP_FILE="$BACKUP_DIR/${ENVIRONMENT}_${TIMESTAMP}.sql"
BACKUP_COMPRESSED="$BACKUP_FILE.gz"

# Check database connection
log "Testing database connection..."
if ! psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
    error "Cannot connect to database: $DATABASE_URL"
    exit 1
fi
success "Database connection successful"

# Get database size
DB_SIZE=$(psql "$DATABASE_URL" -t -c "SELECT pg_size_pretty(pg_database_size(current_database()));" | xargs)
log "Database size: $DB_SIZE"

# Perform backup
log "Creating database dump..."
if pg_dump "$DATABASE_URL" > "$BACKUP_FILE"; then
    success "Database dump created: $BACKUP_FILE"
else
    error "Database dump failed"
    exit 1
fi

# Get backup file size
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
log "Backup file size: $BACKUP_SIZE"

# Compress backup
log "Compressing backup..."
if gzip "$BACKUP_FILE"; then
    success "Backup compressed: $BACKUP_COMPRESSED"
else
    error "Backup compression failed"
    exit 1
fi

# Get compressed size
COMPRESSED_SIZE=$(du -h "$BACKUP_COMPRESSED" | cut -f1)
log "Compressed size: $COMPRESSED_SIZE"

###############################################################################
# Verify Backup
###############################################################################

if [ "$VERIFY_BACKUP" = true ]; then
    log "Verifying backup integrity..."

    # Test gzip integrity
    if gzip -t "$BACKUP_COMPRESSED"; then
        success "Backup compression integrity verified"
    else
        error "Backup file is corrupted"
        exit 1
    fi

    # Extract and check SQL syntax (first 1000 lines)
    log "Checking SQL syntax..."
    if gunzip -c "$BACKUP_COMPRESSED" | head -n 1000 | psql "$DATABASE_URL" --single-transaction --set ON_ERROR_STOP=on -f - > /dev/null 2>&1; then
        success "SQL syntax verified"
    else
        warning "SQL syntax check failed (this may be normal for partial dumps)"
    fi
fi

###############################################################################
# Remote Backup
###############################################################################

if [ "$REMOTE_BACKUP" = true ]; then
    log "Uploading backup to remote storage..."

    # Check if S3 bucket is configured
    if [ -n "${BACKUP_S3_BUCKET:-}" ]; then
        log "Uploading to S3 bucket: $BACKUP_S3_BUCKET"

        # Upload to S3 (requires AWS CLI)
        if command -v aws &> /dev/null; then
            aws s3 cp "$BACKUP_COMPRESSED" "s3://$BACKUP_S3_BUCKET/backups/$ENVIRONMENT/" || {
                error "S3 upload failed"
                exit 1
            }
            success "Backup uploaded to S3"
        else
            error "AWS CLI not found. Install with: pip install awscli"
            exit 1
        fi
    # Check if rsync remote is configured
    elif [ -n "${BACKUP_REMOTE_HOST:-}" ]; then
        log "Uploading to remote host: $BACKUP_REMOTE_HOST"

        rsync -avz "$BACKUP_COMPRESSED" "$BACKUP_REMOTE_USER@$BACKUP_REMOTE_HOST:$BACKUP_REMOTE_PATH/" || {
            error "rsync upload failed"
            exit 1
        }
        success "Backup uploaded via rsync"
    else
        warning "No remote backup configuration found (BACKUP_S3_BUCKET or BACKUP_REMOTE_HOST)"
    fi
fi

###############################################################################
# Cleanup Old Backups
###############################################################################

log "Cleaning up old backups (retention: $RETENTION_DAYS days)..."

# Find and delete backups older than retention period
DELETED_COUNT=0
while IFS= read -r old_backup; do
    if [ -n "$old_backup" ]; then
        log "Deleting old backup: $(basename "$old_backup")"
        rm -f "$old_backup"
        ((DELETED_COUNT++))
    fi
done < <(find "$BACKUP_DIR" -name "${ENVIRONMENT}_*.sql.gz" -type f -mtime +$RETENTION_DAYS)

if [ $DELETED_COUNT -gt 0 ]; then
    success "Deleted $DELETED_COUNT old backup(s)"
else
    log "No old backups to delete"
fi

# List remaining backups
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "${ENVIRONMENT}_*.sql.gz" -type f | wc -l)
log "Total backups for $ENVIRONMENT: $BACKUP_COUNT"

###############################################################################
# Backup Complete
###############################################################################

success "========================================="
success "Backup completed successfully!"
success "========================================="
log ""
log "Backup Summary:"
log "  Environment: $ENVIRONMENT"
log "  Timestamp: $TIMESTAMP"
log "  Database size: $DB_SIZE"
log "  Backup size: $BACKUP_SIZE"
log "  Compressed size: $COMPRESSED_SIZE"
log "  Backup file: $BACKUP_COMPRESSED"
log "  Retention: $RETENTION_DAYS days"
log "  Remote backup: $REMOTE_BACKUP"
log "  Verification: $VERIFY_BACKUP"
log ""
log "To restore this backup:"
log "  gunzip -c $BACKUP_COMPRESSED | psql \$DATABASE_URL"
log ""
log "Backup log: $LOG_FILE"
log ""
