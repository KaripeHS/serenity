/**
 * Compliance Dashboard Service
 * HIPAA compliance, regulatory tracking, and audit preparation
 */
import { request } from './api';

export interface ComplianceMetric {
  area: string;
  score: number;
  target: number;
  status: 'compliant' | 'warning' | 'non-compliant';
  lastAudit: string;
  nextAudit: string;
}

export interface AuditItem {
  id: string;
  category: 'HIPAA' | 'Medicare' | 'State' | 'Internal' | 'Certification';
  finding: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in-progress' | 'resolved' | 'overdue' | 'expired';
  dueDate: string;
  assignee: string;
}

export interface PolicyDocument {
  id: string;
  title: string;
  category: string;
  version: string;
  lastUpdated: string;
  nextReview: string;
  status: 'current' | 'needs-review' | 'outdated';
}

class ComplianceDashboardService {
  async getComplianceData(organizationId: string): Promise<{ metrics: ComplianceMetric[], items: AuditItem[] }> {
    try {
      const response = await request<{ metrics: any, items: any[] }>(`/api/console/dashboard/compliance/${organizationId}`);
      const { metrics, items } = response;

      // Map backend metrics to frontend format
      const complianceMetrics: ComplianceMetric[] = [
        {
          area: 'HIPAA & Security',
          score: metrics.hipaaComplianceScore,
          target: 90,
          status: metrics.hipaaComplianceScore >= 90 ? 'compliant' : 'warning',
          lastAudit: '2023-10-15',
          nextAudit: '2024-04-15'
        },
        {
          area: 'EVV Adherence',
          score: 100 - (metrics.activeAudits * 5), // Rough proxy logic
          target: 95,
          status: metrics.activeAudits === 0 ? 'compliant' : 'non-compliant',
          lastAudit: new Date().toISOString().split('T')[0],
          nextAudit: 'Daily'
        }
      ];

      // Map items to AuditItems
      const auditItems: AuditItem[] = items.map((item: any) => ({
        id: item.id,
        category: item.type,
        finding: item.description,
        severity: item.priority,
        status: item.status === 'completed' ? 'resolved' : 'open',
        dueDate: item.dueDate,
        assignee: 'Unassigned'
      }));

      return { metrics: complianceMetrics, items: auditItems };

    } catch (error) {
      console.error('Failed compliance fetch', error);
      return { metrics: [], items: [] };
    }
  }

  // Keep these for now if needed, but primary is getComplianceData
  async getPolicyDocuments(): Promise<PolicyDocument[]> {
    await this.delay(600);
    return [
      {
        id: 'POL-001',
        title: 'HIPAA Privacy Policy',
        category: 'Privacy',
        version: '3.2',
        lastUpdated: '2023-08-15',
        nextReview: '2024-08-15',
        status: 'current'
      },
      {
        id: 'POL-002',
        title: 'Emergency Procedures',
        category: 'Safety',
        version: '2.1',
        lastUpdated: '2023-06-01',
        nextReview: '2024-01-01',
        status: 'needs-review'
      }
    ];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const complianceDashboardService = new ComplianceDashboardService();