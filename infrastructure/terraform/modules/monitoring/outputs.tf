# Monitoring Module Outputs

output "dashboard_url" {
  description = "URL of the CloudWatch dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${data.aws_region.current.name}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "log_group_name" {
  description = "Name of the main application log group"
  value       = aws_cloudwatch_log_group.application.name
}

output "log_group_arn" {
  description = "ARN of the main application log group"
  value       = aws_cloudwatch_log_group.application.arn
}

output "alb_log_group_name" {
  description = "Name of the ALB log group"
  value       = aws_cloudwatch_log_group.alb.name
}

output "rds_log_group_name" {
  description = "Name of the RDS log group"
  value       = aws_cloudwatch_log_group.rds.name
}

output "metrics_collector_function_name" {
  description = "Name of the metrics collector Lambda function"
  value       = aws_lambda_function.metrics_collector.function_name
}

output "metrics_collector_function_arn" {
  description = "ARN of the metrics collector Lambda function"
  value       = aws_lambda_function.metrics_collector.arn
}

output "xray_sampling_rule_name" {
  description = "Name of the X-Ray sampling rule"
  value       = aws_xray_sampling_rule.main.rule_name
}

# Alarm ARNs for reference
output "alarm_arns" {
  description = "ARNs of all CloudWatch alarms"
  value = {
    ecs_cpu_high           = aws_cloudwatch_metric_alarm.ecs_cpu_high.arn
    ecs_memory_high        = aws_cloudwatch_metric_alarm.ecs_memory_high.arn
    alb_response_time      = aws_cloudwatch_metric_alarm.alb_response_time.arn
    alb_5xx_errors         = aws_cloudwatch_metric_alarm.alb_5xx_errors.arn
    application_errors     = aws_cloudwatch_metric_alarm.application_errors.arn
    unauthorized_access    = aws_cloudwatch_metric_alarm.unauthorized_access.arn
    evv_compliance         = aws_cloudwatch_metric_alarm.evv_compliance.arn
  }
}

# Metric filter names
output "metric_filters" {
  description = "Names of CloudWatch log metric filters"
  value = {
    error_count          = aws_cloudwatch_log_metric_filter.error_count.name
    phi_access           = aws_cloudwatch_log_metric_filter.phi_access.name
    unauthorized_access  = aws_cloudwatch_log_metric_filter.unauthorized_access.name
    evv_compliance      = aws_cloudwatch_log_metric_filter.evv_compliance.name
  }
}