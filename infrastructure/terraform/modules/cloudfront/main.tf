# CloudFront Module - CDN and Global Distribution for Serenity ERP

# Origin Access Control for ALB
resource "aws_cloudfront_origin_access_control" "main" {
  name                              = "${var.project_name}-oac-${var.environment}"
  description                       = "OAC for ${var.project_name} ALB"
  origin_access_control_origin_type = "lambda"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# WAF Web ACL for CloudFront
resource "aws_wafv2_web_acl" "main" {
  count = var.enable_waf ? 1 : 0
  
  name  = "${var.project_name}-waf-${var.environment}"
  scope = "CLOUDFRONT"

  default_action {
    allow {}
  }

  # Rate limiting rule
  rule {
    name     = "RateLimitRule"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }

  # AWS Core Rule Set
  rule {
    name     = "AWSCoreRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSCoreRuleSet"
      sampled_requests_enabled   = true
    }
  }

  # Known Bad Inputs Rule Set
  rule {
    name     = "AWSKnownBadInputsRuleSet"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSKnownBadInputsRuleSet"
      sampled_requests_enabled   = true
    }
  }

  # SQL Injection Rule Set
  rule {
    name     = "AWSSQLiRuleSet"
    priority = 4

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSSQLiRuleSet"
      sampled_requests_enabled   = true
    }
  }

  tags = {
    Name = "${var.project_name}-waf-${var.environment}"
    Type = "waf-web-acl"
  }
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  origin {
    domain_name = var.alb_domain_name
    origin_id   = "ALB-${var.project_name}-${var.environment}"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }

    # Custom headers for origin requests
    custom_header {
      name  = "X-Forwarded-Host"
      value = var.domain_name
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CloudFront distribution for ${var.project_name}"
  default_root_object = "index.html"
  
  # Alternate domain names
  aliases = var.domain_name != "" ? [var.domain_name] : []

  # Logging configuration
  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.cloudfront_logs.bucket_domain_name
    prefix          = "cloudfront-logs/"
  }

  # Default cache behavior
  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "ALB-${var.project_name}-${var.environment}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    # Cache policy for dynamic content
    cache_policy_id = aws_cloudfront_cache_policy.dynamic.id
    
    # Origin request policy
    origin_request_policy_id = aws_cloudfront_origin_request_policy.main.id
    
    # Response headers policy for security
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security.id

    # Function associations for edge computing
    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.security_headers.arn
    }
  }

  # Cache behavior for API endpoints
  ordered_cache_behavior {
    path_pattern           = "/api/*"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    target_origin_id       = "ALB-${var.project_name}-${var.environment}"
    compress               = true
    viewer_protocol_policy = "https-only"

    cache_policy_id          = aws_cloudfront_cache_policy.api.id
    origin_request_policy_id = aws_cloudfront_origin_request_policy.main.id
  }

  # Cache behavior for static assets
  ordered_cache_behavior {
    path_pattern           = "/static/*"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "ALB-${var.project_name}-${var.environment}"
    compress               = true
    viewer_protocol_policy = "https-only"

    cache_policy_id = aws_cloudfront_cache_policy.static.id
  }

  # Price class
  price_class = var.environment == "production" ? "PriceClass_All" : "PriceClass_100"

  # Geo restrictions
  restrictions {
    geo_restriction {
      restriction_type = "whitelist"
      locations        = ["US", "CA"]  # Allow only US and Canada for HIPAA compliance
    }
  }

  # SSL certificate
  viewer_certificate {
    acm_certificate_arn            = var.certificate_arn
    ssl_support_method             = "sni-only"
    minimum_protocol_version       = "TLSv1.2_2021"
    cloudfront_default_certificate = var.certificate_arn == "" ? true : false
  }

  # WAF
  web_acl_id = var.enable_waf ? aws_wafv2_web_acl.main[0].arn : null

  # Custom error responses
  custom_error_response {
    error_code            = 404
    error_caching_min_ttl = 300
    response_code         = 404
    response_page_path    = "/404.html"
  }

  custom_error_response {
    error_code            = 403
    error_caching_min_ttl = 300
    response_code         = 403
    response_page_path    = "/403.html"
  }

  custom_error_response {
    error_code            = 500
    error_caching_min_ttl = 0
    response_code         = 500
    response_page_path    = "/500.html"
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-cloudfront-${var.environment}"
    Type = "cloudfront-distribution"
  })
}

# Cache policies
resource "aws_cloudfront_cache_policy" "dynamic" {
  name        = "${var.project_name}-dynamic-cache-${var.environment}"
  comment     = "Cache policy for dynamic content"
  default_ttl = 0
  max_ttl     = 31536000
  min_ttl     = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    enable_accept_encoding_brotli = true
    enable_accept_encoding_gzip   = true

    headers_config {
      header_behavior = "whitelist"
      headers {
        items = ["Authorization", "CloudFront-Forwarded-Proto", "Host"]
      }
    }

    query_strings_config {
      query_string_behavior = "all"
    }

    cookies_config {
      cookie_behavior = "all"
    }
  }
}

resource "aws_cloudfront_cache_policy" "api" {
  name        = "${var.project_name}-api-cache-${var.environment}"
  comment     = "Cache policy for API endpoints"
  default_ttl = 0
  max_ttl     = 86400
  min_ttl     = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    enable_accept_encoding_brotli = true
    enable_accept_encoding_gzip   = true

    headers_config {
      header_behavior = "whitelist"
      headers {
        items = ["Authorization", "Content-Type", "Accept"]
      }
    }

    query_strings_config {
      query_string_behavior = "all"
    }

    cookies_config {
      cookie_behavior = "none"
    }
  }
}

resource "aws_cloudfront_cache_policy" "static" {
  name        = "${var.project_name}-static-cache-${var.environment}"
  comment     = "Cache policy for static assets"
  default_ttl = 86400
  max_ttl     = 31536000
  min_ttl     = 1

  parameters_in_cache_key_and_forwarded_to_origin {
    enable_accept_encoding_brotli = true
    enable_accept_encoding_gzip   = true

    headers_config {
      header_behavior = "none"
    }

    query_strings_config {
      query_string_behavior = "none"
    }

    cookies_config {
      cookie_behavior = "none"
    }
  }
}

# Origin request policy
resource "aws_cloudfront_origin_request_policy" "main" {
  name    = "${var.project_name}-origin-request-${var.environment}"
  comment = "Origin request policy for ${var.project_name}"

  headers_config {
    header_behavior = "whitelist"
    headers {
      items = [
        "Accept",
        "Accept-Language",
        "Authorization",
        "CloudFront-Forwarded-Proto",
        "Content-Type",
        "Host",
        "Origin",
        "Referer",
        "User-Agent",
        "X-Forwarded-For",
        "X-Forwarded-Host",
        "X-Forwarded-Proto"
      ]
    }
  }

  query_strings_config {
    query_string_behavior = "all"
  }

  cookies_config {
    cookie_behavior = "all"
  }
}

# Response headers policy for security
resource "aws_cloudfront_response_headers_policy" "security" {
  name    = "${var.project_name}-security-headers-${var.environment}"
  comment = "Security headers policy for ${var.project_name}"

  security_headers_config {
    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = true
      override                   = true
    }

    content_type_options {
      override = true
    }

    frame_options {
      frame_option = "SAMEORIGIN"
      override     = true
    }

    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }
  }

  custom_headers_config {
    items {
      header   = "X-Content-Security-Policy"
      value    = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https:; media-src 'self'; object-src 'none'; child-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
      override = true
    }

    items {
      header   = "X-Permitted-Cross-Domain-Policies"
      value    = "none"
      override = true
    }
  }
}

# CloudFront Function for additional security
resource "aws_cloudfront_function" "security_headers" {
  name    = "${var.project_name}-security-headers-${var.environment}"
  runtime = "cloudfront-js-1.0"
  comment = "Add security headers and perform basic request validation"
  publish = true
  code    = file("${path.module}/security-headers-function.js")
}

# S3 bucket for CloudFront logs
resource "aws_s3_bucket" "cloudfront_logs" {
  bucket        = "${var.project_name}-cloudfront-logs-${var.environment}-${random_id.bucket_suffix.hex}"
  force_destroy = var.environment == "dev"

  tags = merge(var.tags, {
    Name = "${var.project_name}-cloudfront-logs-${var.environment}"
    Type = "s3-bucket"
  })
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket_encryption" "cloudfront_logs" {
  bucket = aws_s3_bucket.cloudfront_logs.id

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}

resource "aws_s3_bucket_public_access_block" "cloudfront_logs" {
  bucket = aws_s3_bucket.cloudfront_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "cloudfront_logs" {
  bucket = aws_s3_bucket.cloudfront_logs.id

  rule {
    id     = "log_retention"
    status = "Enabled"

    expiration {
      days = 90
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

# Route53 alias record (if domain is provided)
resource "aws_route53_record" "main" {
  count = var.route53_zone_id != "" && var.domain_name != "" ? 1 : 0
  
  zone_id = var.route53_zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
}

# CloudWatch alarms for monitoring
resource "aws_cloudwatch_metric_alarm" "cloudfront_4xx_errors" {
  alarm_name          = "${var.project_name}-cloudfront-4xx-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "4xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = "300"
  statistic           = "Average"
  threshold           = "5"
  alarm_description   = "This metric monitors CloudFront 4xx error rate"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    DistributionId = aws_cloudfront_distribution.main.id
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-cloudfront-4xx-errors-${var.environment}"
    Type = "cloudwatch-alarm"
  })
}

resource "aws_cloudwatch_metric_alarm" "cloudfront_5xx_errors" {
  alarm_name          = "${var.project_name}-cloudfront-5xx-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = "300"
  statistic           = "Average"
  threshold           = "2"
  alarm_description   = "This metric monitors CloudFront 5xx error rate"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    DistributionId = aws_cloudfront_distribution.main.id
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-cloudfront-5xx-errors-${var.environment}"
    Type = "cloudwatch-alarm"
  })
}