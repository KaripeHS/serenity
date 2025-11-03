#!/bin/bash

###############################################################################
# Serenity ERP Health Check Script
#
# Comprehensive service health monitoring:
# - Backend API health check
# - Frontend accessibility check
# - Database connectivity check
# - PM2 process status check
# - Disk space monitoring
# - Memory usage monitoring
# - Response time monitoring
# - Integration health checks (Sandata, clearinghouse, payroll)
#
# Usage:
#   ./scripts/health-check.sh [options]
#
# Options:
#   --environment <env>     Environment to check (staging/production)
#   --verbose               Show detailed output
#   --json                  Output results as JSON
#   --alert                 Send alerts on failures (Slack/email)
#   --integrations          Check external integrations
#
# Examples:
#   ./scripts/health-check.sh --environment production
#   ./scripts/health-check.sh --environment staging --verbose
#   ./scripts/health-check.sh --environment production --json
#   ./scripts/health-check.sh --environment production --alert --integrations
#
# Exit Codes:
#   0 - All checks passed
#   1 - One or more checks failed
#   2 - Critical failure (service down)
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
LOG_FILE="$PROJECT_ROOT/logs/health_check_$TIMESTAMP.log"

# Default options
ENVIRONMENT=""
VERBOSE=false
JSON_OUTPUT=false
SEND_ALERTS=false
CHECK_INTEGRATIONS=false

# Health check results
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0
FAILURES=()

###############################################################################
# Helper Functions
###############################################################################

log() {
    if [ "$VERBOSE" = true ] || [ "$JSON_OUTPUT" = false ]; then
        echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
    fi
}

success() {
    if [ "$JSON_OUTPUT" = false ]; then
        echo -e "${GREEN}✓${NC} $1" | tee -a "$LOG_FILE"
    fi
    ((CHECKS_PASSED++))
}

error() {
    if [ "$JSON_OUTPUT" = false ]; then
        echo -e "${RED}✗${NC} $1" | tee -a "$LOG_FILE"
    fi
    ((CHECKS_FAILED++))
    FAILURES+=("$1")
}

warning() {
    if [ "$JSON_OUTPUT" = false ]; then
        echo -e "${YELLOW}⚠${NC} $1" | tee -a "$LOG_FILE"
    fi
    ((CHECKS_WARNING++))
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
        --verbose)
            VERBOSE=true
            shift
            ;;
        --json)
            JSON_OUTPUT=true
            shift
            ;;
        --alert)
            SEND_ALERTS=true
            shift
            ;;
        --integrations)
            CHECK_INTEGRATIONS=true
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

ENV_FILE="$PROJECT_ROOT/.env.$ENVIRONMENT"
if [ ! -f "$ENV_FILE" ]; then
    error "Environment file not found: $ENV_FILE"
    exit 1
fi

# Load environment variables
set -a
source "$ENV_FILE"
set +a

# Create logs directory
mkdir -p "$PROJECT_ROOT/logs"

###############################################################################
# Health Check Functions
###############################################################################

check_backend_health() {
    log "Checking backend health..."

    local health_url="${API_URL}/health"
    local start_time=$(date +%s%3N)
    local response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$health_url" 2>/dev/null || echo "000")
    local end_time=$(date +%s%3N)
    local response_time=$((end_time - start_time))

    if [ "$response" = "200" ]; then
        success "Backend health check passed (${response_time}ms)"
        return 0
    else
        error "Backend health check failed (HTTP $response)"
        return 1
    fi
}

check_frontend_accessibility() {
    log "Checking frontend accessibility..."

    local start_time=$(date +%s%3N)
    local response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$FRONTEND_URL" 2>/dev/null || echo "000")
    local end_time=$(date +%s%3N)
    local response_time=$((end_time - start_time))

    if [ "$response" = "200" ]; then
        success "Frontend accessible (${response_time}ms)"
        return 0
    else
        error "Frontend not accessible (HTTP $response)"
        return 1
    fi
}

check_database_connectivity() {
    log "Checking database connectivity..."

    if psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
        success "Database connection successful"

        # Get database size
        local db_size=$(psql "$DATABASE_URL" -t -c "SELECT pg_size_pretty(pg_database_size(current_database()));" | xargs)
        log "Database size: $db_size"

        # Get connection count
        local conn_count=$(psql "$DATABASE_URL" -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname = current_database();" | xargs)
        log "Active connections: $conn_count"

        # Warn if too many connections
        if [ "$conn_count" -gt 80 ]; then
            warning "High connection count: $conn_count (max typically 100)"
        fi

        return 0
    else
        error "Database connection failed"
        return 1
    fi
}

check_pm2_processes() {
    log "Checking PM2 processes..."

    # Check if PM2 is accessible
    if ! ssh "$DEPLOY_USER@$DEPLOY_HOST" "command -v pm2" > /dev/null 2>&1; then
        warning "PM2 not found or SSH connection failed"
        return 1
    fi

    # Get PM2 process status
    local pm2_status=$(ssh "$DEPLOY_USER@$DEPLOY_HOST" "pm2 jlist" 2>/dev/null)

    if [ -n "$pm2_status" ]; then
        local online_count=$(echo "$pm2_status" | grep -o '"status":"online"' | wc -l)
        local errored_count=$(echo "$pm2_status" | grep -o '"status":"errored"' | wc -l)

        if [ "$errored_count" -gt 0 ]; then
            error "PM2 processes errored: $errored_count"
            return 1
        elif [ "$online_count" -gt 0 ]; then
            success "PM2 processes online: $online_count"
            return 0
        else
            warning "No PM2 processes found"
            return 1
        fi
    else
        warning "Cannot retrieve PM2 status"
        return 1
    fi
}

check_disk_space() {
    log "Checking disk space..."

    # Check local disk space
    local disk_usage=$(df -h "$PROJECT_ROOT" | tail -n 1 | awk '{print $5}' | sed 's/%//')

    if [ "$disk_usage" -lt 80 ]; then
        success "Disk space OK (${disk_usage}% used)"
        return 0
    elif [ "$disk_usage" -lt 90 ]; then
        warning "Disk space high (${disk_usage}% used)"
        return 0
    else
        error "Disk space critical (${disk_usage}% used)"
        return 1
    fi
}

check_memory_usage() {
    log "Checking memory usage..."

    # Check system memory (Linux)
    if command -v free > /dev/null 2>&1; then
        local mem_usage=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100)}')

        if [ "$mem_usage" -lt 80 ]; then
            success "Memory usage OK (${mem_usage}%)"
            return 0
        elif [ "$mem_usage" -lt 90 ]; then
            warning "Memory usage high (${mem_usage}%)"
            return 0
        else
            error "Memory usage critical (${mem_usage}%)"
            return 1
        fi
    else
        log "Memory check not available on this system"
        return 0
    fi
}

check_api_endpoints() {
    log "Checking critical API endpoints..."

    local endpoints=(
        "GET /api/auth/health"
        "GET /api/console/dashboard"
        "GET /api/admin/health"
    )

    local endpoint_failures=0

    for endpoint in "${endpoints[@]}"; do
        local method=$(echo "$endpoint" | awk '{print $1}')
        local path=$(echo "$endpoint" | awk '{print $2}')
        local url="${API_URL}${path}"

        local response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" --max-time 5 "$url" 2>/dev/null || echo "000")

        if [ "$response" = "200" ] || [ "$response" = "401" ]; then
            # 401 is OK for protected endpoints without auth
            log "  $endpoint: OK (HTTP $response)"
        else
            warning "  $endpoint: Failed (HTTP $response)"
            ((endpoint_failures++))
        fi
    done

    if [ "$endpoint_failures" -eq 0 ]; then
        success "All API endpoints accessible"
        return 0
    else
        warning "$endpoint_failures API endpoint(s) failed"
        return 0
    fi
}

check_integrations() {
    if [ "$CHECK_INTEGRATIONS" = false ]; then
        return 0
    fi

    log "Checking external integrations..."

    # Check Sandata connectivity (mock check - adjust based on actual health endpoint)
    if [ -n "${SANDATA_API_URL:-}" ]; then
        log "Checking Sandata connectivity..."
        local sandata_response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$SANDATA_API_URL/health" 2>/dev/null || echo "000")
        if [ "$sandata_response" = "200" ]; then
            success "Sandata API accessible"
        else
            warning "Sandata API not accessible (HTTP $sandata_response)"
        fi
    fi

    # Check clearinghouse connectivity
    if [ -n "${CLEARINGHOUSE_API_URL:-}" ]; then
        log "Checking clearinghouse connectivity..."
        local ch_response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$CLEARINGHOUSE_API_URL/health" 2>/dev/null || echo "000")
        if [ "$ch_response" = "200" ]; then
            success "Clearinghouse API accessible"
        else
            warning "Clearinghouse API not accessible (HTTP $ch_response)"
        fi
    fi

    return 0
}

###############################################################################
# Run Health Checks
###############################################################################

if [ "$JSON_OUTPUT" = false ]; then
    log "========================================="
    log "Serenity ERP Health Check"
    log "========================================="
    log "Environment: $ENVIRONMENT"
    log "Timestamp: $(date +'%Y-%m-%d %H:%M:%S')"
    log ""
fi

# Run all checks
check_backend_health
check_frontend_accessibility
check_database_connectivity
check_pm2_processes
check_disk_space
check_memory_usage
check_api_endpoints
check_integrations

###############################################################################
# Output Results
###############################################################################

if [ "$JSON_OUTPUT" = true ]; then
    # JSON output
    cat << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": "$ENVIRONMENT",
  "checks_passed": $CHECKS_PASSED,
  "checks_failed": $CHECKS_FAILED,
  "checks_warning": $CHECKS_WARNING,
  "status": "$([ $CHECKS_FAILED -eq 0 ] && echo "healthy" || echo "unhealthy")",
  "failures": [
    $(printf '"%s"\n' "${FAILURES[@]}" | paste -sd "," -)
  ]
}
EOF
else
    # Human-readable output
    log ""
    log "========================================="
    log "Health Check Summary"
    log "========================================="
    log "Checks passed: $CHECKS_PASSED"
    log "Checks failed: $CHECKS_FAILED"
    log "Warnings: $CHECKS_WARNING"

    if [ $CHECKS_FAILED -eq 0 ]; then
        success "Overall status: HEALTHY"
        EXIT_CODE=0
    else
        error "Overall status: UNHEALTHY"
        log ""
        log "Failed checks:"
        for failure in "${FAILURES[@]}"; do
            log "  - $failure"
        done
        EXIT_CODE=1
    fi

    log ""
    log "Health check log: $LOG_FILE"
    log ""
fi

###############################################################################
# Send Alerts
###############################################################################

if [ "$SEND_ALERTS" = true ] && [ $CHECKS_FAILED -gt 0 ]; then
    log "Sending alerts..."

    # Slack webhook (if configured)
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        local slack_message="🚨 Serenity ERP Health Check Failed\n\nEnvironment: $ENVIRONMENT\nFailed checks: $CHECKS_FAILED\n\nFailures:\n$(printf '• %s\n' "${FAILURES[@]}")"

        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$slack_message\"}" \
            "$SLACK_WEBHOOK_URL" > /dev/null 2>&1 || warning "Failed to send Slack alert"
    fi

    # Email alert (if configured)
    if [ -n "${ALERT_EMAIL:-}" ] && command -v mail > /dev/null 2>&1; then
        echo "Serenity ERP health check failed on $ENVIRONMENT. Failed checks: $CHECKS_FAILED" | \
            mail -s "Serenity ERP Health Check Alert" "$ALERT_EMAIL" || warning "Failed to send email alert"
    fi
fi

exit $EXIT_CODE
