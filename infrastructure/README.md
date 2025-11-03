# Serenity ERP Infrastructure

This directory contains the Infrastructure as Code (IaC) for deploying the Serenity ERP system on AWS. The infrastructure is designed to be HIPAA-compliant, secure, and scalable.

## Architecture Overview

The infrastructure consists of the following components:

- **VPC**: Multi-AZ Virtual Private Cloud with proper network segmentation
- **ECS Fargate**: Containerized application deployment with auto-scaling
- **RDS PostgreSQL**: Encrypted database with automated backups and Multi-AZ support
- **Application Load Balancer**: SSL termination and traffic distribution
- **CloudFront**: Global CDN with WAF protection
- **CloudWatch**: Comprehensive monitoring and alerting
- **S3**: Encrypted storage for assets and logs
- **KMS**: Key management for encryption
- **IAM**: Least-privilege access control
- **Route53**: DNS management (optional)

## Directory Structure

```
infrastructure/
├── terraform/                 # Terraform configurations
│   ├── main.tf               # Main configuration
│   ├── variables.tf          # Variable definitions
│   ├── outputs.tf            # Output values
│   ├── terraform.tfvars.example  # Example variables file
│   └── modules/              # Terraform modules
│       ├── vpc/              # VPC and networking
│       ├── security/         # Security groups
│       ├── rds/              # Database
│       ├── ecs/              # Container orchestration
│       ├── cloudfront/       # CDN and WAF
│       └── monitoring/       # Logging and monitoring
├── scripts/                  # Deployment and utility scripts
│   └── deploy.sh            # Main deployment script
└── README.md                # This file
```

## Prerequisites

Before deploying the infrastructure, ensure you have:

1. **AWS CLI** configured with appropriate credentials
2. **Terraform** >= 1.5.0 installed
3. **jq** for JSON processing
4. **bash** shell (or Git Bash on Windows)

### AWS Permissions

Your AWS credentials need the following permissions:
- EC2, VPC, and networking services
- RDS and database services
- ECS, ELB, and container services
- CloudFront and Route53
- S3, KMS, and storage services
- IAM role and policy management
- CloudWatch, CloudTrail, and Config
- Lambda and EventBridge

## Quick Start

1. **Clone the repository** and navigate to the infrastructure directory:
   ```bash
   cd infrastructure/terraform
   ```

2. **Copy the example variables file**:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

3. **Edit terraform.tfvars** with your specific values:
   ```bash
   # Update domain name, allowed IP ranges, email addresses, etc.
   nano terraform.tfvars
   ```

4. **Deploy the infrastructure**:
   ```bash
   # For development environment
   ../scripts/deploy.sh -e dev

   # For production environment (requires approval)
   ../scripts/deploy.sh -e production
   ```

## Deployment Environments

The infrastructure supports three environments:

### Development (dev)
- Single AZ deployment for cost optimization
- Smaller instance sizes
- Shorter backup retention
- Relaxed monitoring thresholds

### Staging (staging)
- Multi-AZ for testing high availability
- Production-like configuration
- Extended backup retention
- Full monitoring and alerting

### Production (production)
- Multi-AZ deployment
- High-performance instances
- Maximum backup retention
- Comprehensive security features
- Enhanced monitoring and alerting

## Deployment Options

### Using the Deployment Script

The `deploy.sh` script provides a convenient way to deploy the infrastructure:

```bash
# Deploy development environment
./scripts/deploy.sh -e dev

# Plan only (don't apply changes)
./scripts/deploy.sh -e staging -p

# Deploy production with auto-approval
./scripts/deploy.sh -e production -y

# Destroy development environment
./scripts/deploy.sh -e dev -d

# Deploy to different region
./scripts/deploy.sh -e production -r us-west-2
```

### Using Terraform Directly

You can also use Terraform commands directly:

```bash
cd terraform

# Initialize Terraform
terraform init

# Plan changes
terraform plan -var="environment=dev"

# Apply changes
terraform apply -var="environment=dev"

# Destroy infrastructure
terraform destroy -var="environment=dev"
```

### Using GitHub Actions

The repository includes GitHub Actions workflows for automated deployment:

1. **Pull Request**: Runs `terraform plan` and security scans
2. **Push to main**: Deploys to production environment
3. **Manual trigger**: Deploy to any environment or destroy

## Security Features

The infrastructure includes comprehensive security features:

### Network Security
- VPC with private subnets for application and database tiers
- Network ACLs for additional layer of security
- Security groups with least-privilege access
- NAT gateways for outbound internet access

### Encryption
- All data encrypted at rest using KMS
- All data encrypted in transit using TLS
- Database encryption with customer-managed keys
- S3 buckets with server-side encryption

### Access Control
- IAM roles with least-privilege principles
- No hardcoded credentials
- Service-linked roles for AWS services
- Regular access reviews and rotation

### Monitoring and Auditing
- CloudTrail for API call logging
- VPC Flow Logs for network traffic
- CloudWatch for application monitoring
- Config for compliance monitoring

### Web Application Firewall
- CloudFront with AWS WAF enabled
- Protection against common web exploits
- Rate limiting and DDoS protection
- Custom security rules

## HIPAA Compliance

The infrastructure is designed to meet HIPAA requirements:

### Administrative Safeguards
- Assigned security responsibility
- Workforce training and access management
- Information security officer designated
- Security incident procedures
- Contingency plan for emergencies

### Physical Safeguards
- AWS data centers with physical security
- Workstation use restrictions
- Device and media controls

### Technical Safeguards
- Access control (unique user identification, emergency procedures, automatic logoff)
- Audit controls (hardware, software, procedural mechanisms)
- Integrity (PHI alteration/destruction protection)
- Person or entity authentication
- Transmission security (end-to-end encryption)

## Monitoring and Alerting

The infrastructure includes comprehensive monitoring:

### CloudWatch Dashboards
- Application performance metrics
- Infrastructure health monitoring
- Business metrics specific to Serenity ERP
- Custom metrics for EVV compliance

### Alerts
- High CPU/memory utilization
- Application errors and failures
- Security events and unauthorized access
- Database connection issues
- Failed backups or compliance violations

### Log Aggregation
- Application logs centralized in CloudWatch
- Database logs for audit purposes
- Load balancer access logs
- CloudFront request logs

## Cost Optimization

To optimize costs:

### Development Environment
- Use smaller instance types (t3.micro for RDS, etc.)
- Disable Multi-AZ for RDS
- Shorter backup retention periods
- Single AZ deployment

### Production Environment
- Use Reserved Instances for predictable workloads
- Enable auto-scaling to handle traffic spikes
- Use lifecycle policies for S3 storage
- Regular cost reviews and optimization

## Backup and Disaster Recovery

### Automated Backups
- RDS automated backups with point-in-time recovery
- S3 versioning for object history
- Cross-region replication for critical data

### Disaster Recovery
- Multi-AZ deployment for high availability
- Read replicas for database scaling
- Infrastructure as Code for rapid recovery
- Documented recovery procedures

## Maintenance and Updates

### Regular Maintenance
- Security patches applied during maintenance windows
- Database maintenance windows scheduled
- SSL certificate renewal automation
- Regular security assessments

### Scaling
- Application auto-scaling based on CPU/memory
- Database scaling through read replicas
- CDN scaling handled automatically
- Manual intervention for major capacity changes

## Troubleshooting

### Common Issues

1. **Terraform Init Fails**
   - Check AWS credentials
   - Verify S3 bucket permissions
   - Ensure correct region settings

2. **Deployment Timeouts**
   - Check security group rules
   - Verify subnet routing
   - Review CloudWatch logs

3. **Application Health Checks Fail**
   - Verify application is listening on correct port
   - Check security group ingress rules
   - Review application logs

4. **Database Connection Issues**
   - Check security groups allow database port
   - Verify database credentials in secrets manager
   - Ensure application is in correct subnets

### Getting Help

- Review CloudWatch logs for detailed error messages
- Use AWS Systems Manager Session Manager for secure access
- Check the GitHub repository issues for common problems
- Contact the infrastructure team for complex issues

## Contributing

When making changes to the infrastructure:

1. Create a feature branch
2. Make changes and test locally
3. Run security scans and validation
4. Submit pull request with detailed description
5. Ensure all checks pass before merging

## Additional Resources

- [AWS HIPAA Compliance Whitepaper](https://aws.amazon.com/compliance/hipaa-compliance/)
- [Terraform AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)