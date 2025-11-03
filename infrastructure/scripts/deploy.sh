#!/bin/bash

# Serenity ERP - Infrastructure Deployment Script
# This script deploys the complete HIPAA-compliant infrastructure for Serenity ERP

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TERRAFORM_DIR="$PROJECT_ROOT/terraform"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="dev"
AWS_REGION="us-east-1"
DESTROY_MODE=false
PLAN_ONLY=false
AUTO_APPROVE=false
SKIP_TESTS=false

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_usage() {
    cat << EOF
Serenity ERP Infrastructure Deployment Script

Usage: $0 [OPTIONS]

OPTIONS:
    -e, --environment    Environment (dev, staging, production) [default: dev]
    -r, --region        AWS region [default: us-east-1]
    -d, --destroy       Destroy infrastructure instead of creating
    -p, --plan-only     Only run terraform plan, don't apply
    -y, --yes           Auto-approve terraform apply
    -s, --skip-tests    Skip infrastructure tests
    -h, --help          Show this help message

EXAMPLES:
    # Deploy development environment
    $0 -e dev

    # Deploy production environment with auto-approval
    $0 -e production -y

    # Plan only for staging environment
    $0 -e staging -p

    # Destroy development environment
    $0 -e dev -d

    # Deploy to different region
    $0 -e production -r us-west-2

EOF
}

check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check required tools
    local missing_tools=()
    
    if ! command -v terraform &> /dev/null; then
        missing_tools+=("terraform")
    fi
    
    if ! command -v aws &> /dev/null; then
        missing_tools+=("aws-cli")
    fi
    
    if ! command -v jq &> /dev/null; then
        missing_tools+=("jq")
    fi
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_error "Please install the missing tools and try again."
        exit 1
    fi

    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured or invalid."
        log_error "Please run 'aws configure' or set AWS environment variables."
        exit 1
    fi

    # Check Terraform version
    local tf_version=$(terraform version -json | jq -r '.terraform_version')
    local min_version="1.5.0"
    
    if ! printf '%s\n%s\n' "$min_version" "$tf_version" | sort -V -C; then
        log_warning "Terraform version $tf_version detected. Minimum recommended version is $min_version."
    fi

    log_success "Prerequisites check completed"
}

validate_environment() {
    case $ENVIRONMENT in
        dev|staging|production)
            log_info "Environment: $ENVIRONMENT"
            ;;
        *)
            log_error "Invalid environment: $ENVIRONMENT"
            log_error "Must be one of: dev, staging, production"
            exit 1
            ;;
    esac
}

setup_backend() {
    log_info "Setting up Terraform backend..."
    
    local state_bucket="serenity-erp-terraform-state-$ENVIRONMENT"
    local lock_table="serenity-erp-terraform-locks"
    
    # Check if S3 bucket exists
    if aws s3api head-bucket --bucket "$state_bucket" 2>/dev/null; then
        log_info "State bucket $state_bucket already exists"
    else
        log_info "Creating state bucket: $state_bucket"
        aws s3api create-bucket \
            --bucket "$state_bucket" \
            --region "$AWS_REGION" \
            --create-bucket-configuration LocationConstraint="$AWS_REGION" 2>/dev/null || true
        
        # Enable versioning
        aws s3api put-bucket-versioning \
            --bucket "$state_bucket" \
            --versioning-configuration Status=Enabled
        
        # Enable server-side encryption
        aws s3api put-bucket-encryption \
            --bucket "$state_bucket" \
            --server-side-encryption-configuration '{
                "Rules": [{
                    "ApplyServerSideEncryptionByDefault": {
                        "SSEAlgorithm": "AES256"
                    }
                }]
            }'
        
        # Block public access
        aws s3api put-public-access-block \
            --bucket "$state_bucket" \
            --public-access-block-configuration \
            "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
    fi
    
    # Check if DynamoDB table exists
    if aws dynamodb describe-table --table-name "$lock_table" &>/dev/null; then
        log_info "Lock table $lock_table already exists"
    else
        log_info "Creating lock table: $lock_table"
        aws dynamodb create-table \
            --table-name "$lock_table" \
            --attribute-definitions AttributeName=LockID,AttributeType=S \
            --key-schema AttributeName=LockID,KeyType=HASH \
            --billing-mode PAY_PER_REQUEST \
            --tags Key=Project,Value=serenity-erp Key=Environment,Value="$ENVIRONMENT"
        
        # Wait for table to be active
        aws dynamodb wait table-exists --table-name "$lock_table"
    fi
    
    log_success "Backend setup completed"
}

init_terraform() {
    log_info "Initializing Terraform..."
    
    cd "$TERRAFORM_DIR"
    
    # Create backend configuration
    cat > backend.tf << EOF
terraform {
  backend "s3" {
    bucket         = "serenity-erp-terraform-state-$ENVIRONMENT"
    key            = "infrastructure/terraform.tfstate"
    region         = "$AWS_REGION"
    encrypt        = true
    dynamodb_table = "serenity-erp-terraform-locks"
  }
}
EOF
    
    terraform init -upgrade
    
    log_success "Terraform initialized"
}

plan_terraform() {
    log_info "Planning Terraform deployment..."
    
    local plan_file="tfplan-$ENVIRONMENT"
    
    terraform plan \
        -var="environment=$ENVIRONMENT" \
        -var="aws_region=$AWS_REGION" \
        -out="$plan_file" \
        -detailed-exitcode
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        log_info "No changes detected"
        return 0
    elif [ $exit_code -eq 2 ]; then
        log_info "Changes detected - plan saved to $plan_file"
        return 2
    else
        log_error "Terraform plan failed"
        return 1
    fi
}

apply_terraform() {
    log_info "Applying Terraform configuration..."
    
    local plan_file="tfplan-$ENVIRONMENT"
    local apply_args=()
    
    if [ "$AUTO_APPROVE" = true ]; then
        apply_args+=("-auto-approve")
    fi
    
    if [ -f "$plan_file" ]; then
        terraform apply "${apply_args[@]}" "$plan_file"
    else
        terraform apply "${apply_args[@]}" \
            -var="environment=$ENVIRONMENT" \
            -var="aws_region=$AWS_REGION"
    fi
    
    log_success "Terraform apply completed"
}

destroy_terraform() {
    log_warning "This will destroy ALL infrastructure for environment: $ENVIRONMENT"
    
    if [ "$AUTO_APPROVE" = false ]; then
        read -p "Are you sure you want to continue? (yes/no): " confirmation
        if [ "$confirmation" != "yes" ]; then
            log_info "Destruction cancelled"
            exit 0
        fi
    fi
    
    log_info "Destroying Terraform infrastructure..."
    
    local destroy_args=()
    
    if [ "$AUTO_APPROVE" = true ]; then
        destroy_args+=("-auto-approve")
    fi
    
    terraform destroy "${destroy_args[@]}" \
        -var="environment=$ENVIRONMENT" \
        -var="aws_region=$AWS_REGION"
    
    log_success "Infrastructure destroyed"
}

run_tests() {
    if [ "$SKIP_TESTS" = true ]; then
        log_info "Skipping infrastructure tests"
        return 0
    fi
    
    log_info "Running infrastructure tests..."
    
    # Basic connectivity tests
    test_vpc_connectivity
    test_alb_health
    test_rds_connectivity
    
    log_success "Infrastructure tests completed"
}

test_vpc_connectivity() {
    log_info "Testing VPC connectivity..."
    
    local vpc_id=$(terraform output -raw vpc_id 2>/dev/null || echo "")
    
    if [ -n "$vpc_id" ]; then
        aws ec2 describe-vpcs --vpc-ids "$vpc_id" > /dev/null
        log_success "VPC connectivity test passed"
    else
        log_warning "Could not retrieve VPC ID for testing"
    fi
}

test_alb_health() {
    log_info "Testing ALB health..."
    
    local alb_dns=$(terraform output -raw alb_dns_name 2>/dev/null || echo "")
    
    if [ -n "$alb_dns" ]; then
        if curl -s --connect-timeout 10 "http://$alb_dns" > /dev/null; then
            log_success "ALB health test passed"
        else
            log_warning "ALB health test failed - this might be expected if application is not deployed yet"
        fi
    else
        log_warning "Could not retrieve ALB DNS for testing"
    fi
}

test_rds_connectivity() {
    log_info "Testing RDS connectivity..."
    
    local db_endpoint=$(terraform output -raw db_endpoint 2>/dev/null || echo "")
    
    if [ -n "$db_endpoint" ]; then
        # Test if RDS endpoint is resolvable
        if nslookup "$db_endpoint" > /dev/null 2>&1; then
            log_success "RDS connectivity test passed"
        else
            log_warning "RDS connectivity test failed"
        fi
    else
        log_warning "Could not retrieve RDS endpoint for testing"
    fi
}

save_outputs() {
    log_info "Saving Terraform outputs..."
    
    local output_file="$PROJECT_ROOT/outputs/terraform-outputs-$ENVIRONMENT.json"
    
    mkdir -p "$(dirname "$output_file")"
    
    terraform output -json > "$output_file"
    
    log_success "Outputs saved to $output_file"
}

cleanup() {
    log_info "Cleaning up temporary files..."
    
    cd "$TERRAFORM_DIR"
    
    # Remove plan files
    rm -f tfplan-*
    
    log_success "Cleanup completed"
}

main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -r|--region)
                AWS_REGION="$2"
                shift 2
                ;;
            -d|--destroy)
                DESTROY_MODE=true
                shift
                ;;
            -p|--plan-only)
                PLAN_ONLY=true
                shift
                ;;
            -y|--yes)
                AUTO_APPROVE=true
                shift
                ;;
            -s|--skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    log_info "Starting Serenity ERP infrastructure deployment"
    log_info "Environment: $ENVIRONMENT"
    log_info "Region: $AWS_REGION"
    
    # Run deployment steps
    check_prerequisites
    validate_environment
    setup_backend
    init_terraform
    
    if [ "$DESTROY_MODE" = true ]; then
        destroy_terraform
    else
        local plan_exit_code=0
        plan_terraform || plan_exit_code=$?
        
        if [ "$PLAN_ONLY" = true ]; then
            log_info "Plan-only mode - deployment complete"
            exit 0
        fi
        
        if [ $plan_exit_code -eq 2 ]; then
            apply_terraform
            save_outputs
            run_tests
        elif [ $plan_exit_code -eq 0 ]; then
            log_info "No changes to apply"
        else
            log_error "Planning failed"
            exit 1
        fi
    fi
    
    cleanup
    
    log_success "Deployment completed successfully!"
    
    if [ "$DESTROY_MODE" = false ]; then
        log_info "Infrastructure endpoints:"
        terraform output -raw application_url 2>/dev/null | sed 's/^/  Application: /' || true
        terraform output -raw alb_dns_name 2>/dev/null | sed 's/^/  Load Balancer: https:\/\//' || true
    fi
}

# Set trap to cleanup on exit
trap cleanup EXIT

# Run main function
main "$@"