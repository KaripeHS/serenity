import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'HIPAA' | 'Medicare' | 'State' | 'Internal';
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Annual';
  lastGenerated?: string;
}

interface ComplianceReportGeneratorProps {
  className?: string;
}

export function ComplianceReportGenerator({ className = '' }: ComplianceReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const reportTemplates: ReportTemplate[] = [
    {
      id: '1',
      name: 'HIPAA Privacy Compliance Report',
      description: 'Comprehensive review of privacy safeguards and access controls',
      type: 'HIPAA',
      frequency: 'Monthly',
      lastGenerated: '2024-01-01'
    },
    {
      id: '2',
      name: 'Medicare Billing Compliance',
      description: 'Claims accuracy and billing practice compliance review',
      type: 'Medicare',
      frequency: 'Quarterly',
      lastGenerated: '2023-10-01'
    },
    {
      id: '3',
      name: 'Ohio State Regulatory Report',
      description: 'State-specific compliance requirements and certifications',
      type: 'State',
      frequency: 'Annual',
      lastGenerated: '2023-12-01'
    },
    {
      id: '4',
      name: 'Internal Audit Summary',
      description: 'Internal process compliance and quality metrics',
      type: 'Internal',
      frequency: 'Weekly',
      lastGenerated: '2024-01-14'
    }
  ];

  const handleGenerateReport = async (reportId: string) => {
    setIsGenerating(true);
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGenerating(false);

    // In a real app, this would trigger the report generation and download
    const report = reportTemplates.find(r => r.id === reportId);
    alert(`Generated: ${report?.name}`);
  };

  const getTypeColor = (type: string) => {
    const colors = {
      'HIPAA': 'bg-blue-100 text-blue-800',
      'Medicare': 'bg-green-100 text-green-800',
      'State': 'bg-purple-100 text-purple-800',
      'Internal': 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getFrequencyColor = (frequency: string) => {
    const colors = {
      'Daily': 'bg-red-100 text-red-800',
      'Weekly': 'bg-orange-100 text-orange-800',
      'Monthly': 'bg-yellow-100 text-yellow-800',
      'Quarterly': 'bg-blue-100 text-blue-800',
      'Annual': 'bg-green-100 text-green-800'
    };
    return colors[frequency as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Compliance Report Generator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reportTemplates.map((template) => (
            <div key={template.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">{template.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                  <div className="flex items-center space-x-2">
                    <Badge className={getTypeColor(template.type)}>
                      {template.type}
                    </Badge>
                    <Badge className={getFrequencyColor(template.frequency)}>
                      {template.frequency}
                    </Badge>
                  </div>
                </div>
                <Button
                  onClick={() => handleGenerateReport(template.id)}
                  disabled={isGenerating}
                  size="sm"
                >
                  {isGenerating ? 'Generating...' : 'Generate'}
                </Button>
              </div>

              {template.lastGenerated && (
                <div className="text-xs text-gray-500">
                  Last generated: {new Date(template.lastGenerated).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h5 className="font-medium text-blue-900 mb-2">Automated Reporting</h5>
          <p className="text-sm text-blue-800 mb-3">
            Reports are automatically generated according to their frequency schedule and
            stored securely for compliance audits.
          </p>
          <div className="flex items-center space-x-4 text-sm text-blue-700">
            <div>📊 4 Active Templates</div>
            <div>🔄 Auto-generated</div>
            <div>🔒 Encrypted Storage</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}