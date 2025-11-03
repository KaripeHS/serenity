import json
import boto3
import os
from datetime import datetime
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
cloudwatch = boto3.client('cloudwatch')
rds = boto3.client('rds')
ecs = boto3.client('ecs')

def handler(event, context):
    """
    Lambda function to collect custom business metrics for Serenity ERP
    """
    try:
        project_name = os.environ['PROJECT_NAME']
        environment = os.environ['ENVIRONMENT']
        
        logger.info(f"Starting metrics collection for {project_name}-{environment}")
        
        # Collect and send custom metrics
        metrics_data = []
        
        # Example business metrics (in production, these would come from your database)
        # Active users metric
        active_users = get_active_users_count()
        metrics_data.append({
            'MetricName': 'ActiveUsers',
            'Value': active_users,
            'Unit': 'Count',
            'Timestamp': datetime.utcnow()
        })
        
        # Active shifts metric
        active_shifts = get_active_shifts_count()
        metrics_data.append({
            'MetricName': 'ActiveShifts',
            'Value': active_shifts,
            'Unit': 'Count',
            'Timestamp': datetime.utcnow()
        })
        
        # EVV compliance rate
        evv_compliance_rate = get_evv_compliance_rate()
        metrics_data.append({
            'MetricName': 'EVVComplianceRate',
            'Value': evv_compliance_rate,
            'Unit': 'Percent',
            'Timestamp': datetime.utcnow()
        })
        
        # Claim processing rate
        claim_processing_rate = get_claim_processing_rate()
        metrics_data.append({
            'MetricName': 'ClaimProcessingRate',
            'Value': claim_processing_rate,
            'Unit': 'Count/Second',
            'Timestamp': datetime.utcnow()
        })
        
        # Schedule utilization rate
        schedule_utilization = get_schedule_utilization_rate()
        metrics_data.append({
            'MetricName': 'ScheduleUtilizationRate',
            'Value': schedule_utilization,
            'Unit': 'Percent',
            'Timestamp': datetime.utcnow()
        })
        
        # HIPAA audit events
        hipaa_audit_events = get_hipaa_audit_events()
        metrics_data.append({
            'MetricName': 'HIPAAAuditEvents',
            'Value': hipaa_audit_events,
            'Unit': 'Count',
            'Timestamp': datetime.utcnow()
        })
        
        # Send metrics to CloudWatch in batches (max 20 per request)
        batch_size = 20
        for i in range(0, len(metrics_data), batch_size):
            batch = metrics_data[i:i + batch_size]
            
            cloudwatch.put_metric_data(
                Namespace=f'SerenityERP/{environment.title()}',
                MetricData=[
                    {
                        'MetricName': metric['MetricName'],
                        'Value': metric['Value'],
                        'Unit': metric['Unit'],
                        'Timestamp': metric['Timestamp'],
                        'Dimensions': [
                            {
                                'Name': 'Environment',
                                'Value': environment
                            },
                            {
                                'Name': 'Project',
                                'Value': project_name
                            }
                        ]
                    } for metric in batch
                ]
            )
        
        logger.info(f"Successfully sent {len(metrics_data)} metrics to CloudWatch")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Successfully collected {len(metrics_data)} metrics',
                'metrics': [metric['MetricName'] for metric in metrics_data]
            })
        }
        
    except Exception as e:
        logger.error(f"Error collecting metrics: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }

def get_active_users_count():
    """
    Get count of active users in the system
    In production, this would query your application database
    """
    # Mock data for demonstration
    return 45

def get_active_shifts_count():
    """
    Get count of currently active shifts
    """
    # Mock data for demonstration
    return 23

def get_evv_compliance_rate():
    """
    Get EVV compliance rate percentage
    """
    # Mock data for demonstration - in production this would calculate:
    # (compliant_shifts / total_shifts) * 100
    return 98.5

def get_claim_processing_rate():
    """
    Get claim processing rate (claims per second)
    """
    # Mock data for demonstration
    return 2.3

def get_schedule_utilization_rate():
    """
    Get schedule utilization rate percentage
    """
    # Mock data for demonstration - in production this would calculate:
    # (assigned_shifts / total_available_slots) * 100
    return 87.2

def get_hipaa_audit_events():
    """
    Get count of HIPAA-related audit events in the last 5 minutes
    """
    # Mock data for demonstration
    return 12

def get_business_metrics_from_db():
    """
    Helper function to query actual business metrics from database
    This would be implemented in production to connect to your RDS instance
    """
    # In production, this would use environment variables to connect to RDS
    # and execute queries to get real business metrics
    pass

# Additional helper functions for more specific metrics
def get_caregiver_metrics():
    """
    Get caregiver-specific metrics
    """
    return {
        'total_caregivers': 156,
        'active_caregivers': 142,
        'caregiver_utilization_rate': 91.0,
        'average_caregiver_rating': 4.7
    }

def get_client_metrics():
    """
    Get client-specific metrics
    """
    return {
        'total_clients': 89,
        'active_clients': 78,
        'client_satisfaction_rate': 96.5,
        'new_client_onboarding_rate': 3.2
    }

def get_billing_metrics():
    """
    Get billing and financial metrics
    """
    return {
        'pending_claims': 45,
        'denied_claims': 7,
        'claim_approval_rate': 94.2,
        'average_days_to_payment': 18,
        'monthly_revenue': 245000
    }

def get_compliance_metrics():
    """
    Get compliance-specific metrics
    """
    return {
        'policy_violations': 2,
        'training_completion_rate': 98.8,
        'credential_expiry_warnings': 5,
        'hipaa_risk_score': 95.5
    }