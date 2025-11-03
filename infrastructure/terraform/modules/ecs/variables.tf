# ECS Module Variables

variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs"
  type        = list(string)
}

variable "ecs_security_group_ids" {
  description = "List of security group IDs for ECS tasks"
  type        = list(string)
}

variable "alb_security_group_ids" {
  description = "List of security group IDs for ALB"
  type        = list(string)
}

# Application configuration
variable "app_image" {
  description = "Docker image for the application"
  type        = string
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

# Database connection
variable "db_host" {
  description = "Database host"
  type        = string
}

variable "db_name" {
  description = "Database name"
  type        = string
}

variable "db_username" {
  description = "Database username"
  type        = string
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

# Encryption
variable "kms_key_arn" {
  description = "ARN of the KMS key for encryption"
  type        = string
}

# Auto Scaling
variable "enable_auto_scaling" {
  description = "Enable auto scaling for ECS service"
  type        = bool
  default     = true
}

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

# Domain configuration
variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "localhost"
}

variable "tags" {
  description = "A map of tags to assign to the resource"
  type        = map(string)
  default     = {}
}