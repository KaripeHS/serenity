# Serenity ERP - Terraform Variables

# General Configuration
variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "serenity-erp"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

# Network Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

variable "db_subnet_cidrs" {
  description = "CIDR blocks for database subnets"
  type        = list(string)
  default     = ["10.0.201.0/24", "10.0.202.0/24", "10.0.203.0/24"]
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to access the application"
  type        = list(string)
  default     = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
}

# Database Configuration
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
  
  validation {
    condition = contains([
      "db.t3.micro", "db.t3.small", "db.t3.medium", "db.t3.large",
      "db.r5.large", "db.r5.xlarge", "db.r5.2xlarge", "db.r5.4xlarge"
    ], var.db_instance_class)
    error_message = "DB instance class must be a valid RDS instance type."
  }
}

variable "db_name" {
  description = "Name of the database"
  type        = string
  default     = "serenity_erp"
}

variable "db_username" {
  description = "Username for the database"
  type        = string
  default     = "serenity_admin"
}

variable "db_allocated_storage" {
  description = "Initial allocated storage for RDS (GB)"
  type        = number
  default     = 100
}

variable "db_max_allocated_storage" {
  description = "Maximum allocated storage for RDS auto-scaling (GB)"
  type        = number
  default     = 1000
}

# ECS Configuration
variable "app_image" {
  description = "Docker image for the application"
  type        = string
  default     = "nginx:latest"  # Replace with actual application image
}

variable "app_port" {
  description = "Port on which the application runs"
  type        = number
  default     = 3000
}

variable "app_count" {
  description = "Number of application instances to run"
  type        = number
  default     = 2
}

variable "fargate_cpu" {
  description = "Fargate instance CPU units to provision (1 vCPU = 1024 CPU units)"
  type        = number
  default     = 1024
}

variable "fargate_memory" {
  description = "Fargate instance memory to provision (in MiB)"
  type        = number
  default     = 2048
}

# Auto Scaling Configuration
variable "min_capacity" {
  description = "Minimum number of application instances"
  type        = number
  default     = 2
}

variable "max_capacity" {
  description = "Maximum number of application instances"
  type        = number
  default     = 10
}

# Domain Configuration
variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "app.serenitycare.example.com"
}

variable "route53_zone_id" {
  description = "Route53 hosted zone ID"
  type        = string
  default     = ""
}

# HIPAA Compliance Settings
variable "enable_encryption_in_transit" {
  description = "Enable encryption in transit for all services"
  type        = bool
  default     = true
}

variable "enable_encryption_at_rest" {
  description = "Enable encryption at rest for all storage services"
  type        = bool
  default     = true
}

variable "enable_audit_logging" {
  description = "Enable comprehensive audit logging"
  type        = bool
  default     = true
}

variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 30
}

variable "enable_multi_az" {
  description = "Enable Multi-AZ deployments for high availability"
  type        = bool
  default     = true
}

# Monitoring Configuration
variable "enable_detailed_monitoring" {
  description = "Enable detailed CloudWatch monitoring"
  type        = bool
  default     = true
}

variable "alert_email_addresses" {
  description = "Email addresses for alerts"
  type        = list(string)
  default     = ["admin@serenitycare.example.com"]
}

# Security Configuration
variable "enable_waf" {
  description = "Enable AWS WAF for web application firewall"
  type        = bool
  default     = true
}

variable "enable_shield_advanced" {
  description = "Enable AWS Shield Advanced for DDoS protection"
  type        = bool
  default     = false
}

variable "enable_guardduty" {
  description = "Enable AWS GuardDuty for threat detection"
  type        = bool
  default     = true
}

# Compliance Configuration
variable "enable_config" {
  description = "Enable AWS Config for compliance monitoring"
  type        = bool
  default     = true
}

variable "enable_cloudtrail" {
  description = "Enable CloudTrail for API audit logging"
  type        = bool
  default     = true
}

variable "enable_vpc_flow_logs" {
  description = "Enable VPC Flow Logs for network monitoring"
  type        = bool
  default     = true
}

# Cost Optimization
variable "enable_spot_instances" {
  description = "Enable Spot instances where applicable"
  type        = bool
  default     = false
}

variable "enable_auto_shutdown" {
  description = "Enable auto-shutdown for development environments"
  type        = bool
  default     = false
}

# Environment-specific Overrides
variable "environment_config" {
  description = "Environment-specific configuration overrides"
  type        = map(any)
  default = {
    dev = {
      db_instance_class = "db.t3.micro"
      app_count        = 1
      min_capacity     = 1
      max_capacity     = 3
      enable_multi_az  = false
    }
    staging = {
      db_instance_class = "db.t3.small"
      app_count        = 2
      min_capacity     = 2
      max_capacity     = 5
      enable_multi_az  = true
    }
    production = {
      db_instance_class = "db.r5.large"
      app_count        = 3
      min_capacity     = 3
      max_capacity     = 20
      enable_multi_az  = true
    }
  }
}

# Tags
variable "additional_tags" {
  description = "Additional tags to apply to resources"
  type        = map(string)
  default     = {}
}