# Monitoring Module Variables

variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

# ECS configuration
variable "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  type        = string
}

variable "ecs_service_name" {
  description = "Name of the ECS service"
  type        = string
}

# RDS configuration
variable "db_instance_identifier" {
  description = "RDS instance identifier"
  type        = string
}

# ALB configuration
variable "alb_arn_suffix" {
  description = "ALB ARN suffix for CloudWatch metrics"
  type        = string
}

variable "target_group_arn_suffix" {
  description = "Target group ARN suffix for CloudWatch metrics"
  type        = string
}

# Alerting
variable "sns_topic_arn" {
  description = "SNS topic ARN for alerts"
  type        = string
}

# Encryption
variable "kms_key_arn" {
  description = "ARN of the KMS key for encryption"
  type        = string
}

# Log retention
variable "log_retention_days" {
  description = "Log retention period in days"
  type        = number
  default     = 30
}

variable "tags" {
  description = "A map of tags to assign to the resource"
  type        = map(string)
  default     = {}
}