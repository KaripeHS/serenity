# CloudFront Module Outputs

output "distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.id
}

output "distribution_arn" {
  description = "ARN of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.arn
}

output "domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "hosted_zone_id" {
  description = "CloudFront hosted zone ID"
  value       = aws_cloudfront_distribution.main.hosted_zone_id
}

output "status" {
  description = "Status of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.status
}

output "etag" {
  description = "ETag of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.etag
}

output "waf_web_acl_id" {
  description = "ID of the WAF Web ACL"
  value       = var.enable_waf ? aws_wafv2_web_acl.main[0].id : null
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = var.enable_waf ? aws_wafv2_web_acl.main[0].arn : null
}

output "cloudfront_logs_bucket_name" {
  description = "Name of the CloudFront logs S3 bucket"
  value       = aws_s3_bucket.cloudfront_logs.bucket
}

output "cloudfront_logs_bucket_arn" {
  description = "ARN of the CloudFront logs S3 bucket"
  value       = aws_s3_bucket.cloudfront_logs.arn
}

output "cache_policy_dynamic_id" {
  description = "ID of the dynamic cache policy"
  value       = aws_cloudfront_cache_policy.dynamic.id
}

output "cache_policy_api_id" {
  description = "ID of the API cache policy"
  value       = aws_cloudfront_cache_policy.api.id
}

output "cache_policy_static_id" {
  description = "ID of the static cache policy"
  value       = aws_cloudfront_cache_policy.static.id
}

output "origin_request_policy_id" {
  description = "ID of the origin request policy"
  value       = aws_cloudfront_origin_request_policy.main.id
}

output "response_headers_policy_id" {
  description = "ID of the response headers policy"
  value       = aws_cloudfront_response_headers_policy.security.id
}

output "function_arn" {
  description = "ARN of the CloudFront function"
  value       = aws_cloudfront_function.security_headers.arn
}

output "route53_record_name" {
  description = "Name of the Route53 record"
  value       = var.route53_zone_id != "" && var.domain_name != "" ? aws_route53_record.main[0].name : null
}

output "application_url" {
  description = "URL to access the application"
  value       = var.domain_name != "" ? "https://${var.domain_name}" : "https://${aws_cloudfront_distribution.main.domain_name}"
}