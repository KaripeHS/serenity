# RDS Module Outputs

output "db_instance_identifier" {
  description = "RDS instance identifier"
  value       = aws_db_instance.main.identifier
}

output "db_instance_arn" {
  description = "RDS instance ARN"
  value       = aws_db_instance.main.arn
}

output "db_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "db_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "db_name" {
  description = "Database name"
  value       = aws_db_instance.main.db_name
}

output "db_username" {
  description = "Database username"
  value       = aws_db_instance.main.username
  sensitive   = true
}

output "db_hosted_zone_id" {
  description = "RDS instance hosted zone ID"
  value       = aws_db_instance.main.hosted_zone_id
}

output "db_resource_id" {
  description = "RDS instance resource ID"
  value       = aws_db_instance.main.resource_id
}

output "db_replica_endpoint" {
  description = "RDS read replica endpoint"
  value       = var.create_read_replica && var.environment == "production" ? aws_db_instance.replica[0].endpoint : null
  sensitive   = true
}

output "db_replica_identifier" {
  description = "RDS read replica identifier"
  value       = var.create_read_replica && var.environment == "production" ? aws_db_instance.replica[0].identifier : null
}

output "db_parameter_group_name" {
  description = "Database parameter group name"
  value       = aws_db_parameter_group.main.name
}

output "db_option_group_name" {
  description = "Database option group name"
  value       = aws_db_option_group.main.name
}

output "db_secret_arn" {
  description = "ARN of the database credentials secret"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "db_secret_name" {
  description = "Name of the database credentials secret"
  value       = aws_secretsmanager_secret.db_credentials.name
}

output "monitoring_role_arn" {
  description = "ARN of the RDS monitoring role"
  value       = var.monitoring_interval > 0 ? aws_iam_role.rds_monitoring[0].arn : null
}

# Connection string for applications
output "db_connection_string" {
  description = "Database connection string"
  value       = "postgresql://${aws_db_instance.main.username}:${var.db_password}@${aws_db_instance.main.endpoint}:${aws_db_instance.main.port}/${aws_db_instance.main.db_name}"
  sensitive   = true
}