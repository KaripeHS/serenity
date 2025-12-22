/**
 * Tax Compliance Service
 * Federal, Ohio state, and municipal tax management with automated compliance
 *
 * NOTE: Mock data only used in development with VITE_USE_MOCK_DATA=true
 */

import { shouldUseMockData } from '../config/environment';

export interface TaxDeadline {
  id: string;
  type: 'federal' | 'state' | 'municipal';
  form: string;
  description: string;
  dueDate: string;
  status: 'completed' | 'pending' | 'overdue';
  priority: 'high' | 'medium' | 'low';
  estimatedAmount?: number;
}

export interface TaxCalculation {
  period: string;
  federal: {
    withheld: number;
    owed: number;
    refund: number;
  };
  state: {
    withheld: number;
    owed: number;
    refund: number;
  };
  municipal: {
    city: string;
    withheld: number;
    owed: number;
    refund: number;
  }[];
  sui: {
    rate: number;
    taxableWages: number;
    owed: number;
  };
}

export interface ComplianceAlert {
  id: string;
  type: 'deadline' | 'penalty' | 'audit' | 'filing';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  dueDate?: string;
  actionRequired: boolean;
  estimatedPenalty?: number;
}

export interface FormGeneration {
  formType: string;
  period: string;
  status: 'generated' | 'pending' | 'error';
  downloadUrl?: string;
  generatedDate?: string;
}

class TaxComplianceService {
  async getTaxDeadlines(): Promise<TaxDeadline[]> {
    // TODO: Implement real API call
    if (!shouldUseMockData()) {
      return [];
    }
    await this.delay(500);
    return [
      {
        id: '1',
        type: 'federal',
        form: '941',
        description: 'Quarterly Federal Tax Return',
        dueDate: '2024-01-31',
        status: 'pending',
        priority: 'high',
        estimatedAmount: 45000
      },
      {
        id: '2',
        type: 'state',
        form: 'IT-501',
        description: 'Ohio Quarterly Tax Return',
        dueDate: '2024-01-31',
        status: 'pending',
        priority: 'high',
        estimatedAmount: 12000
      },
      {
        id: '3',
        type: 'municipal',
        form: 'Columbus City',
        description: 'Columbus Municipal Tax',
        dueDate: '2024-02-15',
        status: 'pending',
        priority: 'medium',
        estimatedAmount: 8500
      },
      {
        id: '4',
        type: 'federal',
        form: 'W-2',
        description: 'Employee Wage Statements',
        dueDate: '2024-01-31',
        status: 'completed',
        priority: 'high'
      }
    ];
  }

  async getTaxCalculations(period: string): Promise<TaxCalculation | null> {
    if (!shouldUseMockData()) {
      return null;
    }
    await this.delay(600);
    return {
      period,
      federal: {
        withheld: 125000,
        owed: 118500,
        refund: 6500
      },
      state: {
        withheld: 35000,
        owed: 32800,
        refund: 2200
      },
      municipal: [
        {
          city: 'Columbus',
          withheld: 15000,
          owed: 14200,
          refund: 800
        },
        {
          city: 'Cleveland',
          withheld: 8500,
          owed: 8100,
          refund: 400
        }
      ],
      sui: {
        rate: 0.026,
        taxableWages: 2850000,
        owed: 74100
      }
    };
  }

  async getComplianceAlerts(): Promise<ComplianceAlert[]> {
    if (!shouldUseMockData()) {
      return [];
    }
    await this.delay(400);
    return [
      {
        id: '1',
        type: 'deadline',
        severity: 'critical',
        title: 'Q4 941 Due Soon',
        description: 'Federal quarterly tax return due in 5 days',
        dueDate: '2024-01-31',
        actionRequired: true
      },
      {
        id: '2',
        type: 'penalty',
        severity: 'warning',
        title: 'Late Payment Risk',
        description: 'Columbus municipal payment 2 days overdue',
        actionRequired: true,
        estimatedPenalty: 125
      },
      {
        id: '3',
        type: 'audit',
        severity: 'info',
        title: 'SUI Rate Change',
        description: 'Ohio SUI rate updated for 2024',
        actionRequired: false
      }
    ];
  }

  async generateForm(formType: string, period: string): Promise<FormGeneration | null> {
    if (!shouldUseMockData()) {
      return null;
    }
    await this.delay(1200);
    return {
      formType,
      period,
      status: 'generated',
      downloadUrl: `/api/forms/${formType}_${period}.pdf`,
      generatedDate: new Date().toISOString()
    };
  }

  async getPayrollSummary(_period: string): Promise<any> {
    if (!shouldUseMockData()) {
      return null;
    }
    await this.delay(700);
    return {
      totalEmployees: 485,
      totalWages: 1425000,
      federalWithholding: 125000,
      stateWithholding: 35000,
      ficaWithholding: 89062,
      medicareWithholding: 20662,
      suiContribution: 37050,
      workersComp: 14250,
      breakdown: {
        fullTime: { employees: 380, wages: 1140000 },
        partTime: { employees: 85, wages: 255000 },
        contractors: { employees: 20, wages: 30000 }
      }
    };
  }

  async getPenaltyRiskAssessment(): Promise<any> {
    if (!shouldUseMockData()) {
      return null;
    }
    await this.delay(500);
    return {
      riskLevel: 'low',
      score: 85,
      factors: [
        { name: 'Filing Timeliness', score: 92, weight: 30 },
        { name: 'Payment Accuracy', score: 88, weight: 25 },
        { name: 'Record Keeping', score: 90, weight: 20 },
        { name: 'Compliance History', score: 75, weight: 25 }
      ],
      recommendations: [
        'Automate municipal tax calculations',
        'Implement earlier deadline reminders',
        'Review contractor classification'
      ]
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const taxComplianceService = new TaxComplianceService();