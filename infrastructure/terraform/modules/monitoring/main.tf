# Monitoring Module - CloudWatch Logging, Monitoring, and Alerting for Serenity ERP

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/ecs/${var.project_name}-${var.environment}"
  retention_in_days = var.log_retention_days
  kms_key_id       = var.kms_key_arn

  tags = {
    Name = "${var.project_name}-app-logs-${var.environment}"
    Type = "cloudwatch-log-group"
    Application = "serenity-erp"
  }
}

resource "aws_cloudwatch_log_group" "alb" {
  name              = "/aws/alb/${var.project_name}-${var.environment}"
  retention_in_days = var.log_retention_days
  kms_key_id       = var.kms_key_arn

  tags = {
    Name = "${var.project_name}-alb-logs-${var.environment}"
    Type = "cloudwatch-log-group"
  }
}

resource "aws_cloudwatch_log_group" "rds" {
  name              = "/aws/rds/instance/${var.db_instance_identifier}/postgresql"
  retention_in_days = var.log_retention_days
  kms_key_id       = var.kms_key_arn

  tags = {
    Name = "${var.project_name}-rds-logs-${var.environment}"
    Type = "cloudwatch-log-group"
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-dashboard-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      # ECS Service Metrics
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ServiceName", var.ecs_service_name, "ClusterName", var.ecs_cluster_name],
            [".", "MemoryUtilization", ".", ".", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "ECS Service Resource Utilization"
          period  = 300
        }
      },

      # Application Load Balancer Metrics
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", var.alb_arn_suffix],
            [".", "TargetResponseTime", ".", "."],
            [".", "HTTPCode_Target_2XX_Count", ".", "."],
            [".", "HTTPCode_Target_4XX_Count", ".", "."],
            [".", "HTTPCode_Target_5XX_Count", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "Application Load Balancer Metrics"
          period  = 300
        }
      },

      # RDS Metrics
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", var.db_instance_identifier],
            [".", "DatabaseConnections", ".", "."],
            [".", "FreeStorageSpace", ".", "."],
            [".", "ReadLatency", ".", "."],
            [".", "WriteLatency", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "RDS Database Metrics"
          period  = 300
        }
      },

      # Custom Application Metrics
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["SerenityERP", "ActiveUsers", "Environment", var.environment],
            [".", "ActiveShifts", ".", "."],
            [".", "EVVCompliance", ".", "."],
            [".", "ClaimProcessingRate", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "Serenity ERP Business Metrics"
          period  = 300
        }
      },

      # Log Insights Query
      {
        type   = "log"
        x      = 12
        y      = 6
        width  = 12
        height = 6

        properties = {
          query   = "SOURCE '${aws_cloudwatch_log_group.application.name}'\n| fields @timestamp, level, message\n| filter level = \"ERROR\"\n| sort @timestamp desc\n| limit 50"
          region  = data.aws_region.current.name
          title   = "Recent Application Errors"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-dashboard-${var.environment}"
    Type = "cloudwatch-dashboard"
  }
}

# CloudWatch Alarms for ECS
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  alarm_name          = "${var.project_name}-ecs-cpu-high-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ECS CPU utilization"
  alarm_actions       = [var.sns_topic_arn]
  ok_actions          = [var.sns_topic_arn]

  dimensions = {
    ServiceName = var.ecs_service_name
    ClusterName = var.ecs_cluster_name
  }

  tags = {
    Name = "${var.project_name}-ecs-cpu-high-${var.environment}"
    Type = "cloudwatch-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "ecs_memory_high" {
  alarm_name          = "${var.project_name}-ecs-memory-high-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "85"
  alarm_description   = "This metric monitors ECS memory utilization"
  alarm_actions       = [var.sns_topic_arn]
  ok_actions          = [var.sns_topic_arn]

  dimensions = {
    ServiceName = var.ecs_service_name
    ClusterName = var.ecs_cluster_name
  }

  tags = {
    Name = "${var.project_name}-ecs-memory-high-${var.environment}"
    Type = "cloudwatch-alarm"
  }
}

# CloudWatch Alarms for ALB
resource "aws_cloudwatch_metric_alarm" "alb_response_time" {
  alarm_name          = "${var.project_name}-alb-response-time-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = "2"
  alarm_description   = "This metric monitors ALB response time"
  alarm_actions       = [var.sns_topic_arn]
  ok_actions          = [var.sns_topic_arn]

  dimensions = {
    LoadBalancer = var.alb_arn_suffix
  }

  tags = {
    Name = "${var.project_name}-alb-response-time-${var.environment}"
    Type = "cloudwatch-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "alb_5xx_errors" {
  alarm_name          = "${var.project_name}-alb-5xx-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors ALB 5xx errors"
  alarm_actions       = [var.sns_topic_arn]
  ok_actions          = [var.sns_topic_arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = var.alb_arn_suffix
  }

  tags = {
    Name = "${var.project_name}-alb-5xx-errors-${var.environment}"
    Type = "cloudwatch-alarm"
  }
}

# Custom CloudWatch Metrics for business logic
resource "aws_cloudwatch_log_metric_filter" "error_count" {
  name           = "${var.project_name}-error-count-${var.environment}"
  log_group_name = aws_cloudwatch_log_group.application.name
  pattern        = "[timestamp, request_id, level=\"ERROR\", ...]"

  metric_transformation {
    name      = "ErrorCount"
    namespace = "SerenityERP/Application"
    value     = "1"
    default_value = "0"
  }
}

resource "aws_cloudwatch_metric_alarm" "application_errors" {
  alarm_name          = "${var.project_name}-application-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ErrorCount"
  namespace           = "SerenityERP/Application"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors application errors"
  alarm_actions       = [var.sns_topic_arn]
  treat_missing_data  = "notBreaching"

  tags = {
    Name = "${var.project_name}-application-errors-${var.environment}"
    Type = "cloudwatch-alarm"
  }
}

# HIPAA-specific monitoring
resource "aws_cloudwatch_log_metric_filter" "phi_access" {
  name           = "${var.project_name}-phi-access-${var.environment}"
  log_group_name = aws_cloudwatch_log_group.application.name
  pattern        = "[timestamp, request_id, level, action=\"PHI_ACCESS\", ...]"

  metric_transformation {
    name      = "PHIAccessCount"
    namespace = "SerenityERP/HIPAA"
    value     = "1"
    default_value = "0"
  }
}

resource "aws_cloudwatch_log_metric_filter" "unauthorized_access" {
  name           = "${var.project_name}-unauthorized-access-${var.environment}"
  log_group_name = aws_cloudwatch_log_group.application.name
  pattern        = "[timestamp, request_id, level, action=\"UNAUTHORIZED_ACCESS\", ...]"

  metric_transformation {
    name      = "UnauthorizedAccessCount"
    namespace = "SerenityERP/Security"
    value     = "1"
    default_value = "0"
  }
}

resource "aws_cloudwatch_metric_alarm" "unauthorized_access" {
  alarm_name          = "${var.project_name}-unauthorized-access-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "UnauthorizedAccessCount"
  namespace           = "SerenityERP/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors unauthorized access attempts"
  alarm_actions       = [var.sns_topic_arn]
  treat_missing_data  = "notBreaching"

  tags = {
    Name = "${var.project_name}-unauthorized-access-${var.environment}"
    Type = "cloudwatch-alarm"
    Priority = "critical"
  }
}

# Business metrics for Serenity ERP
resource "aws_cloudwatch_log_metric_filter" "evv_compliance" {
  name           = "${var.project_name}-evv-compliance-${var.environment}"
  log_group_name = aws_cloudwatch_log_group.application.name
  pattern        = "[timestamp, request_id, level, action=\"EVV_VIOLATION\", ...]"

  metric_transformation {
    name      = "EVVViolationCount"
    namespace = "SerenityERP/Compliance"
    value     = "1"
    default_value = "0"
  }
}

resource "aws_cloudwatch_metric_alarm" "evv_compliance" {
  alarm_name          = "${var.project_name}-evv-compliance-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "EVVViolationCount"
  namespace           = "SerenityERP/Compliance"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors EVV compliance violations"
  alarm_actions       = [var.sns_topic_arn]
  treat_missing_data  = "notBreaching"

  tags = {
    Name = "${var.project_name}-evv-compliance-${var.environment}"
    Type = "cloudwatch-alarm"
    Priority = "high"
  }
}

# Lambda function for custom metrics collection
resource "aws_lambda_function" "metrics_collector" {
  filename         = data.archive_file.metrics_collector.output_path
  function_name    = "${var.project_name}-metrics-collector-${var.environment}"
  role            = aws_iam_role.metrics_collector_role.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.metrics_collector.output_base64sha256
  runtime         = "python3.9"
  timeout         = 60

  environment {
    variables = {
      ENVIRONMENT = var.environment
      PROJECT_NAME = var.project_name
    }
  }

  tags = {
    Name = "${var.project_name}-metrics-collector-${var.environment}"
    Type = "lambda-function"
  }
}

# Lambda function code
data "archive_file" "metrics_collector" {
  type        = "zip"
  output_path = "${path.module}/metrics_collector.zip"
  source {
    content = file("${path.module}/metrics_collector.py")
    filename = "index.py"
  }
}

# IAM role for Lambda function
resource "aws_iam_role" "metrics_collector_role" {
  name = "${var.project_name}-metrics-collector-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-metrics-collector-role-${var.environment}"
    Type = "iam-role"
  }
}

resource "aws_iam_role_policy_attachment" "metrics_collector_basic" {
  role       = aws_iam_role.metrics_collector_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "metrics_collector_policy" {
  name = "${var.project_name}-metrics-collector-policy-${var.environment}"
  role = aws_iam_role.metrics_collector_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "rds:DescribeDBInstances",
          "ecs:DescribeServices",
          "ecs:DescribeClusters"
        ]
        Resource = "*"
      }
    ]
  })
}

# EventBridge rule to trigger metrics collection
resource "aws_cloudwatch_event_rule" "metrics_collection" {
  name                = "${var.project_name}-metrics-collection-${var.environment}"
  description         = "Trigger metrics collection every 5 minutes"
  schedule_expression = "rate(5 minutes)"

  tags = {
    Name = "${var.project_name}-metrics-collection-${var.environment}"
    Type = "eventbridge-rule"
  }
}

resource "aws_cloudwatch_event_target" "metrics_collection" {
  rule      = aws_cloudwatch_event_rule.metrics_collection.name
  target_id = "MetricsCollectorTarget"
  arn       = aws_lambda_function.metrics_collector.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.metrics_collector.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.metrics_collection.arn
}

# X-Ray tracing for distributed tracing
resource "aws_xray_sampling_rule" "main" {
  rule_name      = "${var.project_name}-sampling-rule-${var.environment}"
  priority       = 9000
  version        = 1
  reservoir_size = 1
  fixed_rate     = 0.1
  url_path       = "*"
  host           = "*"
  http_method    = "*"
  service_type   = "*"
  service_name   = "*"
  resource_arn   = "*"

  tags = {
    Name = "${var.project_name}-xray-sampling-rule-${var.environment}"
    Type = "xray-sampling-rule"
  }
}

data "aws_region" "current" {}