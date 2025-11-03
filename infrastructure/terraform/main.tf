# Serenity ERP - Main Terraform Configuration
# HIPAA-compliant AWS infrastructure deployment

terraform {
  required_version = ">= 1.5"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }

  # Backend configuration for remote state (uncomment for production)
  # backend "s3" {
  #   bucket         = "serenity-erp-terraform-state"
  #   key            = "infrastructure/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "serenity-erp-terraform-locks"
  # }
}

# Provider configuration
provider "aws" {
  region = var.aws_region

  # Default tags applied to all resources
  default_tags {
    tags = {
      Environment     = var.environment
      Project         = "serenity-erp"
      Owner          = "serenity-care-partners"
      CostCenter     = "technology"
      Classification = "phi"
      Compliance     = "hipaa"
      BackupPolicy   = "required"
      Monitoring     = "enabled"
      CreatedBy      = "terraform"
      LastModified   = timestamp()
    }
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
data "aws_availability_zones" "available" {
  state = "available"
}

# Random password for RDS
resource "random_password" "rds_password" {
  length  = 32
  special = true
}

# KMS key for encryption
resource "aws_kms_key" "serenity_key" {
  description             = "Serenity ERP encryption key for PHI data"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${data.aws_region.current.name}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-kms-key-${var.environment}"
  }
}

resource "aws_kms_alias" "serenity_key_alias" {
  name          = "alias/${var.project_name}-${var.environment}"
  target_key_id = aws_kms_key.serenity_key.key_id
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"
  
  project_name = var.project_name
  environment  = var.environment
  vpc_cidr     = var.vpc_cidr
  
  availability_zones = data.aws_availability_zones.available.names
  
  # Network segmentation for HIPAA compliance
  private_subnet_cidrs = var.private_subnet_cidrs
  public_subnet_cidrs  = var.public_subnet_cidrs
  db_subnet_cidrs      = var.db_subnet_cidrs
  
  enable_nat_gateway = true
  enable_vpn_gateway = false
  
  # DNS settings for private hosted zones
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    HIPAACompliant = "true"
    DataFlow       = "phi"
  }
}

# Security Groups Module
module "security_groups" {
  source = "./modules/security"
  
  project_name = var.project_name
  environment  = var.environment
  vpc_id       = module.vpc.vpc_id
  vpc_cidr     = var.vpc_cidr
  
  # Allowed CIDR blocks for admin access
  allowed_cidr_blocks = var.allowed_cidr_blocks
}

# RDS Module
module "rds" {
  source = "./modules/rds"
  
  project_name = var.project_name
  environment  = var.environment
  
  # Network configuration
  vpc_id                = module.vpc.vpc_id
  db_subnet_group_name  = module.vpc.db_subnet_group_name
  db_security_group_ids = [module.security_groups.rds_security_group_id]
  
  # Database configuration
  db_engine         = "postgres"
  db_engine_version = "15.4"
  db_instance_class = var.db_instance_class
  db_name           = var.db_name
  db_username       = var.db_username
  db_password       = random_password.rds_password.result
  
  # Storage configuration
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id           = aws_kms_key.serenity_key.arn
  
  # Backup configuration
  backup_retention_period   = 30
  backup_window            = "03:00-04:00"
  maintenance_window       = "sun:04:00-sun:05:00"
  delete_automated_backups = false
  deletion_protection      = true
  
  # Monitoring
  performance_insights_enabled = true
  monitoring_interval         = 60
  
  # Multi-AZ for high availability
  multi_az = var.environment == "production"
  
  tags = {
    DataClassification = "phi"
    BackupRequired     = "true"
    HIPAACompliant     = "true"
  }
}

# ECS Cluster Module
module "ecs" {
  source = "./modules/ecs"
  
  project_name = var.project_name
  environment  = var.environment
  
  # Network configuration
  vpc_id               = module.vpc.vpc_id
  private_subnet_ids   = module.vpc.private_subnet_ids
  public_subnet_ids    = module.vpc.public_subnet_ids
  ecs_security_group_ids = [module.security_groups.ecs_security_group_id]
  alb_security_group_ids = [module.security_groups.alb_security_group_id]
  
  # Application configuration
  app_image         = var.app_image
  app_port          = var.app_port
  app_count         = var.app_count
  fargate_cpu       = var.fargate_cpu
  fargate_memory    = var.fargate_memory
  
  # Database connection
  db_host     = module.rds.db_endpoint
  db_name     = var.db_name
  db_username = var.db_username
  db_password = random_password.rds_password.result
  
  # Encryption
  kms_key_arn = aws_kms_key.serenity_key.arn
  
  # Auto Scaling
  enable_auto_scaling = true
  min_capacity       = var.min_capacity
  max_capacity       = var.max_capacity
  
  tags = {
    ServiceType    = "web-application"
    HIPAACompliant = "true"
  }
}

# CloudFront Distribution Module
module "cloudfront" {
  source = "./modules/cloudfront"
  
  project_name = var.project_name
  environment  = var.environment
  
  # ALB configuration
  alb_domain_name = module.ecs.alb_dns_name
  alb_zone_id     = module.ecs.alb_zone_id
  
  # SSL certificate
  domain_name    = var.domain_name
  route53_zone_id = var.route53_zone_id
  
  # WAF configuration
  enable_waf = true
  
  tags = {
    ServiceType = "cdn"
    Security   = "waf-enabled"
  }
}

# CloudWatch Module for monitoring
module "monitoring" {
  source = "./modules/monitoring"
  
  project_name = var.project_name
  environment  = var.environment
  
  # ECS configuration
  ecs_cluster_name  = module.ecs.cluster_name
  ecs_service_name  = module.ecs.service_name
  
  # RDS configuration
  db_instance_identifier = module.rds.db_instance_identifier
  
  # ALB configuration
  alb_arn_suffix = module.ecs.alb_arn_suffix
  target_group_arn_suffix = module.ecs.target_group_arn_suffix
  
  # Alerting
  sns_topic_arn = aws_sns_topic.alerts.arn
  
  # KMS encryption
  kms_key_arn = aws_kms_key.serenity_key.arn
}

# SNS topic for alerts
resource "aws_sns_topic" "alerts" {
  name            = "${var.project_name}-alerts-${var.environment}"
  kms_master_key_id = aws_kms_key.serenity_key.id

  tags = {
    Name = "${var.project_name}-alerts-${var.environment}"
  }
}

# S3 bucket for application assets and backups
resource "aws_s3_bucket" "app_assets" {
  bucket = "${var.project_name}-assets-${var.environment}-${random_id.bucket_suffix.hex}"

  tags = {
    Name           = "${var.project_name}-assets-${var.environment}"
    Purpose        = "application-assets"
    HIPAACompliant = "true"
  }
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket_versioning" "app_assets" {
  bucket = aws_s3_bucket.app_assets.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_encryption" "app_assets" {
  bucket = aws_s3_bucket.app_assets.id

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        kms_master_key_id = aws_kms_key.serenity_key.arn
        sse_algorithm     = "aws:kms"
      }
    }
  }
}

resource "aws_s3_bucket_public_access_block" "app_assets" {
  bucket = aws_s3_bucket.app_assets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# IAM roles and policies for HIPAA compliance
resource "aws_iam_role" "hipaa_compliance_role" {
  name = "${var.project_name}-hipaa-compliance-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name    = "${var.project_name}-hipaa-compliance-${var.environment}"
    Purpose = "hipaa-compliance"
  }
}

# AWS Config for compliance monitoring
resource "aws_config_configuration_recorder" "serenity_config" {
  name     = "${var.project_name}-config-${var.environment}"
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }

  depends_on = [aws_config_delivery_channel.serenity_config]
}

resource "aws_config_delivery_channel" "serenity_config" {
  name           = "${var.project_name}-config-${var.environment}"
  s3_bucket_name = aws_s3_bucket.config_bucket.bucket
}

resource "aws_s3_bucket" "config_bucket" {
  bucket = "${var.project_name}-aws-config-${var.environment}-${random_id.bucket_suffix.hex}"
  
  tags = {
    Name    = "${var.project_name}-aws-config-${var.environment}"
    Purpose = "aws-config-compliance"
  }
}

resource "aws_iam_role" "config_role" {
  name = "${var.project_name}-config-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "config_role_policy" {
  role       = aws_iam_role.config_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
}

# CloudTrail for audit logging
resource "aws_cloudtrail" "serenity_trail" {
  name                          = "${var.project_name}-cloudtrail-${var.environment}"
  s3_bucket_name                = aws_s3_bucket.cloudtrail_bucket.bucket
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging               = true
  kms_key_id                   = aws_kms_key.serenity_key.arn

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.app_assets.arn}/*"]
    }
  }

  tags = {
    Name           = "${var.project_name}-cloudtrail-${var.environment}"
    Purpose        = "audit-logging"
    HIPAACompliant = "true"
  }
}

resource "aws_s3_bucket" "cloudtrail_bucket" {
  bucket = "${var.project_name}-cloudtrail-${var.environment}-${random_id.bucket_suffix.hex}"
  
  tags = {
    Name    = "${var.project_name}-cloudtrail-${var.environment}"
    Purpose = "cloudtrail-logs"
  }
}