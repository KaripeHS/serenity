# Serenity ERP - Terraform Outputs

# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = module.vpc.vpc_cidr_block
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.vpc.private_subnet_ids
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.vpc.public_subnet_ids
}

output "db_subnet_ids" {
  description = "IDs of the database subnets"
  value       = module.vpc.db_subnet_ids
}

# Database Outputs
output "db_endpoint" {
  description = "RDS instance endpoint"
  value       = module.rds.db_endpoint
  sensitive   = true
}

output "db_port" {
  description = "RDS instance port"
  value       = module.rds.db_port
}

output "db_name" {
  description = "Database name"
  value       = var.db_name
}

output "db_username" {
  description = "Database username"
  value       = var.db_username
  sensitive   = true
}

output "db_password" {
  description = "Database password"
  value       = random_password.rds_password.result
  sensitive   = true
}

# ECS Outputs
output "ecs_cluster_id" {
  description = "ID of the ECS cluster"
  value       = module.ecs.cluster_id
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = module.ecs.cluster_arn
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = module.ecs.service_name
}

output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = module.ecs.alb_dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the load balancer"
  value       = module.ecs.alb_zone_id
}

# CloudFront Outputs
output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = module.cloudfront.distribution_id
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = module.cloudfront.domain_name
}

output "application_url" {
  description = "URL of the application"
  value       = module.cloudfront.domain_name
}

# Security Outputs
output "kms_key_id" {
  description = "KMS key ID for encryption"
  value       = aws_kms_key.serenity_key.key_id
}

output "kms_key_arn" {
  description = "KMS key ARN for encryption"
  value       = aws_kms_key.serenity_key.arn
}

# S3 Outputs
output "assets_bucket_name" {
  description = "Name of the S3 bucket for assets"
  value       = aws_s3_bucket.app_assets.bucket
}

output "assets_bucket_arn" {
  description = "ARN of the S3 bucket for assets"
  value       = aws_s3_bucket.app_assets.arn
}

# Monitoring Outputs
output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = module.monitoring.log_group_name
}

# Security Group Outputs
output "ecs_security_group_id" {
  description = "ID of the ECS security group"
  value       = module.security_groups.ecs_security_group_id
}

output "rds_security_group_id" {
  description = "ID of the RDS security group"
  value       = module.security_groups.rds_security_group_id
}

output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = module.security_groups.alb_security_group_id
}

# Environment Information
output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "aws_region" {
  description = "AWS region"
  value       = var.aws_region
}

output "project_name" {
  description = "Project name"
  value       = var.project_name
}

# Connection Information
output "connection_details" {
  description = "Application connection details"
  value = {
    application_url = module.cloudfront.domain_name
    database_endpoint = module.rds.db_endpoint
    database_port = module.rds.db_port
    load_balancer_dns = module.ecs.alb_dns_name
    cloudfront_distribution = module.cloudfront.distribution_id
  }
  sensitive = true
}

# Compliance Information
output "hipaa_compliance_status" {
  description = "HIPAA compliance features enabled"
  value = {
    encryption_at_rest = true
    encryption_in_transit = true
    audit_logging = var.enable_audit_logging
    vpc_flow_logs = var.enable_vpc_flow_logs
    cloudtrail = var.enable_cloudtrail
    config = var.enable_config
    multi_az = var.enable_multi_az
    backup_retention_days = var.backup_retention_days
  }
}

# Resource ARNs for IAM policies
output "resource_arns" {
  description = "ARNs of created resources for IAM policy creation"
  value = {
    kms_key_arn = aws_kms_key.serenity_key.arn
    s3_bucket_arn = aws_s3_bucket.app_assets.arn
    sns_topic_arn = aws_sns_topic.alerts.arn
    ecs_cluster_arn = module.ecs.cluster_arn
    rds_instance_arn = module.rds.db_instance_arn
  }
}

# Cost Estimation Information
output "estimated_monthly_cost" {
  description = "Estimated monthly cost breakdown"
  value = {
    note = "Costs are estimates based on us-east-1 pricing and may vary"
    ec2_fargate = "~$${var.app_count * var.fargate_cpu * 0.04048 * 24 * 30} per month"
    rds = "~$${var.db_instance_class == "db.t3.micro" ? 13 : var.db_instance_class == "db.t3.small" ? 25 : var.db_instance_class == "db.t3.medium" ? 50 : 100} per month"
    alb = "~$22.50 per month"
    nat_gateway = "~$32.85 per month per AZ"
    cloudfront = "~$1-10 per month depending on usage"
    s3 = "~$1-5 per month depending on storage"
  }
}