# RDS Module - PostgreSQL Database for Serenity ERP

# Parameter group for PostgreSQL optimization
resource "aws_db_parameter_group" "main" {
  family = "postgres15"
  name   = "${var.project_name}-pg-params-${var.environment}"

  # HIPAA-compliant parameters
  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "log_line_prefix"
    value = "%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h "
  }

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  parameter {
    name  = "row_security"
    value = "1"
  }

  # Performance optimizations
  parameter {
    name  = "effective_cache_size"
    value = "3GB"
  }

  parameter {
    name  = "maintenance_work_mem"
    value = "256MB"
  }

  parameter {
    name  = "work_mem"
    value = "32MB"
  }

  parameter {
    name  = "checkpoint_completion_target"
    value = "0.7"
  }

  parameter {
    name  = "wal_buffers"
    value = "16MB"
  }

  parameter {
    name  = "default_statistics_target"
    value = "100"
  }

  parameter {
    name  = "random_page_cost"
    value = "1.1"
  }

  # Connection settings
  parameter {
    name  = "max_connections"
    value = "200"
  }

  parameter {
    name  = "idle_in_transaction_session_timeout"
    value = "300000"
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-pg-params-${var.environment}"
    Type = "db-parameter-group"
  })
}

# Option group (not needed for PostgreSQL but keeping for completeness)
resource "aws_db_option_group" "main" {
  name                     = "${var.project_name}-pg-options-${var.environment}"
  option_group_description = "Option group for ${var.project_name} PostgreSQL"
  engine_name              = var.db_engine
  major_engine_version     = split(".", var.db_engine_version)[0]

  tags = merge(var.tags, {
    Name = "${var.project_name}-pg-options-${var.environment}"
    Type = "db-option-group"
  })
}

# RDS instance
resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-db-${var.environment}"

  # Engine configuration
  engine         = var.db_engine
  engine_version = var.db_engine_version
  instance_class = var.db_instance_class

  # Database configuration
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password
  port     = 5432

  # Storage configuration
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = var.storage_type
  storage_encrypted     = var.storage_encrypted
  kms_key_id           = var.kms_key_id

  # Network configuration
  db_subnet_group_name   = var.db_subnet_group_name
  vpc_security_group_ids = var.db_security_group_ids
  publicly_accessible    = false

  # High availability
  multi_az               = var.multi_az
  availability_zone      = var.multi_az ? null : data.aws_availability_zones.available.names[0]

  # Backup configuration
  backup_retention_period   = var.backup_retention_period
  backup_window            = var.backup_window
  maintenance_window       = var.maintenance_window
  delete_automated_backups = var.delete_automated_backups
  deletion_protection      = var.deletion_protection
  skip_final_snapshot      = var.environment == "dev" ? true : false
  final_snapshot_identifier = var.environment == "dev" ? null : "${var.project_name}-final-snapshot-${var.environment}-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  # Parameter and option groups
  parameter_group_name = aws_db_parameter_group.main.name
  option_group_name    = aws_db_option_group.main.name

  # Monitoring
  monitoring_interval                   = var.monitoring_interval
  monitoring_role_arn                  = var.monitoring_interval > 0 ? aws_iam_role.rds_monitoring[0].arn : null
  performance_insights_enabled          = var.performance_insights_enabled
  performance_insights_retention_period = var.performance_insights_enabled ? 7 : null
  performance_insights_kms_key_id      = var.performance_insights_enabled ? var.kms_key_id : null
  enabled_cloudwatch_logs_exports      = ["postgresql"]

  # Security
  ca_cert_identifier = "rds-ca-2019"

  # Maintenance
  allow_major_version_upgrade = false
  auto_minor_version_upgrade  = true
  apply_immediately          = var.environment == "dev"

  # Snapshot configuration
  copy_tags_to_snapshot = true

  tags = merge(var.tags, {
    Name             = "${var.project_name}-db-${var.environment}"
    Type             = "rds-instance"
    HIPAACompliant   = "true"
    BackupRequired   = "true"
    Encrypted        = "true"
  })

  depends_on = [
    aws_db_parameter_group.main,
    aws_db_option_group.main
  ]
}

# Data source for AZs
data "aws_availability_zones" "available" {
  state = "available"
}

# IAM role for RDS monitoring
resource "aws_iam_role" "rds_monitoring" {
  count = var.monitoring_interval > 0 ? 1 : 0
  name  = "${var.project_name}-rds-monitoring-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.tags, {
    Name = "${var.project_name}-rds-monitoring-role-${var.environment}"
    Type = "iam-role"
  })
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  count      = var.monitoring_interval > 0 ? 1 : 0
  role       = aws_iam_role.rds_monitoring[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# CloudWatch alarm for high CPU utilization
resource "aws_cloudwatch_metric_alarm" "database_cpu" {
  alarm_name          = "${var.project_name}-db-cpu-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors rds cpu utilization"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-db-cpu-alarm-${var.environment}"
    Type = "cloudwatch-alarm"
  })
}

# CloudWatch alarm for high database connections
resource "aws_cloudwatch_metric_alarm" "database_connections" {
  alarm_name          = "${var.project_name}-db-connections-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "120"
  statistic           = "Average"
  threshold           = "150"
  alarm_description   = "This metric monitors rds connection count"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-db-connections-alarm-${var.environment}"
    Type = "cloudwatch-alarm"
  })
}

# CloudWatch alarm for low free storage space
resource "aws_cloudwatch_metric_alarm" "database_free_storage_space" {
  alarm_name          = "${var.project_name}-db-storage-${var.environment}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "5368709120" # 5GB in bytes
  alarm_description   = "This metric monitors rds free storage space"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-db-storage-alarm-${var.environment}"
    Type = "cloudwatch-alarm"
  })
}

# CloudWatch alarm for replica lag (if Multi-AZ or read replicas)
resource "aws_cloudwatch_metric_alarm" "database_replica_lag" {
  count               = var.multi_az ? 1 : 0
  alarm_name          = "${var.project_name}-db-replica-lag-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ReplicaLag"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "30"
  alarm_description   = "This metric monitors rds replica lag"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-db-replica-lag-alarm-${var.environment}"
    Type = "cloudwatch-alarm"
  })
}

# DB subnet group for multi-AZ deployment (handled in vpc module but referenced here)
# Read replica for disaster recovery (optional for production)
resource "aws_db_instance" "replica" {
  count = var.environment == "production" && var.create_read_replica ? 1 : 0
  
  identifier = "${var.project_name}-db-replica-${var.environment}"
  
  replicate_source_db = aws_db_instance.main.identifier
  
  instance_class = var.replica_instance_class
  
  # Network configuration
  publicly_accessible    = false
  vpc_security_group_ids = var.db_security_group_ids
  
  # Storage configuration
  storage_encrypted = true
  kms_key_id       = var.kms_key_id
  
  # Monitoring
  monitoring_interval = var.monitoring_interval
  monitoring_role_arn = var.monitoring_interval > 0 ? aws_iam_role.rds_monitoring[0].arn : null
  
  # Skip final snapshot for replica
  skip_final_snapshot = true
  
  tags = merge(var.tags, {
    Name = "${var.project_name}-db-replica-${var.environment}"
    Type = "rds-read-replica"
  })
}

# Database secret in AWS Secrets Manager for secure credential management
resource "aws_secretsmanager_secret" "db_credentials" {
  name        = "${var.project_name}-db-credentials-${var.environment}"
  description = "Database credentials for ${var.project_name}"
  
  kms_key_id = var.kms_key_id
  
  tags = merge(var.tags, {
    Name = "${var.project_name}-db-credentials-${var.environment}"
    Type = "secret"
  })
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = var.db_username
    password = var.db_password
    engine   = var.db_engine
    host     = aws_db_instance.main.endpoint
    port     = aws_db_instance.main.port
    dbname   = var.db_name
  })
}