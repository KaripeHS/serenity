
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface DenialReason {
  code: string;
  description: string;
  count: number;
  amount: number;
  appealRate: number;
  trend: 'up' | 'down' | 'stable';
}

interface DenialAnalyzerProps {
  className?: string;
}

export function DenialAnalyzer({ className = '' }: DenialAnalyzerProps) {
  const denialReasons: DenialReason[] = [
    {
      code: 'CO-16',
      description: 'Claim lacks information which is needed for adjudication',
      count: 15,
      amount: 2250.00,
      appealRate: 85,
      trend: 'down'
    },
    {
      code: 'CO-97',
      description: 'Payment adjusted due to the previous payment for same/similar service',
      count: 8,
      amount: 1120.00,
      appealRate: 45,
      trend: 'stable'
    },
    {
      code: 'CO-151',
      description: 'Payment adjusted because the payer deems the information incomplete',
      count: 6,
      amount: 890.00,
      appealRate: 70,
      trend: 'up'
    },
    {
      code: 'CO-18',
      description: 'Duplicate claim or service',
      count: 4,
      amount: 580.00,
      appealRate: 25,
      trend: 'down'
    }
  ];

  const getTrendColor = (trend: string) => {
    const colors = {
      'up': 'text-red-600',
      'down': 'text-green-600',
      'stable': 'text-gray-600'
    };
    return colors[trend as keyof typeof colors] || 'text-gray-600';
  };

  const getTrendIcon = (trend: string) => {
    const icons = {
      'up': '↗️',
      'down': '↘️',
      'stable': '➡️'
    };
    return icons[trend as keyof typeof icons] || '➡️';
  };

  const getAppealRateColor = (rate: number) => {
    if (rate >= 70) return 'bg-green-100 text-green-800';
    if (rate >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const totalDenials = denialReasons.reduce((sum, reason) => sum + reason.count, 0);
  const totalAmount = denialReasons.reduce((sum, reason) => sum + reason.amount, 0);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Denial Analysis</span>
          <Badge className="bg-red-100 text-red-800">
            {totalDenials} Denials
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-red-700">Total Denials</div>
                <div className="text-2xl font-bold text-red-900">{totalDenials}</div>
              </div>
              <div>
                <div className="text-sm text-red-700">Total Amount</div>
                <div className="text-2xl font-bold text-red-900">
                  ${totalAmount.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Denial Reasons */}
          <div className="space-y-3">
            {denialReasons.map((reason, _index) => (
              <div key={reason.code} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-mono font-bold text-sm">
                        {reason.code}
                      </span>
                      <span className={getTrendColor(reason.trend)}>
                        {getTrendIcon(reason.trend)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {reason.description}
                    </p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span>Count: <strong>{reason.count}</strong></span>
                      <span>Amount: <strong>${reason.amount.toFixed(2)}</strong></span>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getAppealRateColor(reason.appealRate)}>
                      {reason.appealRate}% Success
                    </Badge>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    View Claims
                  </Button>
                  <Button variant="outline" size="sm">
                    Create Appeal
                  </Button>
                  <Button variant="outline" size="sm">
                    Prevention Guide
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Recommendations */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">
              AI Recommendations
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Focus on CO-16 denials - high appeal success rate (85%)</li>
              <li>• Review documentation templates to reduce incomplete claims</li>
              <li>• Implement pre-submission validation for duplicate checking</li>
              <li>• Consider automated appeal generation for CO-97 codes</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}