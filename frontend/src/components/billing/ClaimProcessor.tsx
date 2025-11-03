import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface Claim {
  id: string;
  patientName: string;
  serviceDate: string;
  amount: number;
  status: 'draft' | 'ready' | 'submitted' | 'approved' | 'denied';
  payer: string;
}

interface ClaimProcessorProps {
  className?: string;
}

export function ClaimProcessor({ className = '' }: ClaimProcessorProps) {
  const [claims, setClaims] = useState<Claim[]>([
    {
      id: 'CLM-004',
      patientName: 'John Davis',
      serviceDate: '2024-01-16',
      amount: 165.00,
      status: 'ready',
      payer: 'Medicare'
    },
    {
      id: 'CLM-005',
      patientName: 'Susan Miller',
      serviceDate: '2024-01-16',
      amount: 145.00,
      status: 'ready',
      payer: 'Medicaid'
    },
    {
      id: 'CLM-006',
      patientName: 'Robert Wilson',
      serviceDate: '2024-01-15',
      amount: 189.00,
      status: 'draft',
      payer: 'Aetna'
    }
  ]);

  const [isProcessing, setIsProcessing] = useState(false);

  const getStatusColor = (status: string) => {
    const colors = {
      'draft': 'bg-gray-100 text-gray-800',
      'ready': 'bg-blue-100 text-blue-800',
      'submitted': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'denied': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleProcessClaim = async (claimId: string) => {
    setIsProcessing(true);

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    setClaims(prev =>
      prev.map(claim =>
        claim.id === claimId
          ? { ...claim, status: 'submitted' as const }
          : claim
      )
    );

    setIsProcessing(false);
  };

  const handleBatchProcess = async () => {
    setIsProcessing(true);

    // Simulate batch processing
    await new Promise(resolve => setTimeout(resolve, 3000));

    setClaims(prev =>
      prev.map(claim =>
        claim.status === 'ready'
          ? { ...claim, status: 'submitted' as const }
          : claim
      )
    );

    setIsProcessing(false);
  };

  const readyClaims = claims.filter(claim => claim.status === 'ready');
  const totalReadyAmount = readyClaims.reduce((sum, claim) => sum + claim.amount, 0);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Claim Processor</span>
          <Badge className="bg-blue-100 text-blue-800">
            {readyClaims.length} Ready
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-blue-900">
                Claims Ready for Processing
              </span>
              <span className="text-2xl font-bold text-blue-900">
                ${totalReadyAmount.toFixed(2)}
              </span>
            </div>
            <Button
              onClick={handleBatchProcess}
              disabled={isProcessing || readyClaims.length === 0}
              className="w-full"
            >
              {isProcessing ? 'Processing...' : `Process ${readyClaims.length} Claims`}
            </Button>
          </div>

          {/* Claims List */}
          <div className="space-y-3">
            {claims.map((claim) => (
              <div key={claim.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium">{claim.patientName}</div>
                    <div className="text-sm text-gray-600">
                      {claim.id} • {claim.serviceDate} • {claim.payer}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">${claim.amount.toFixed(2)}</div>
                    <Badge className={getStatusColor(claim.status)}>
                      {claim.status}
                    </Badge>
                  </div>
                </div>

                {claim.status === 'ready' && (
                  <div className="mt-3 flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleProcessClaim(claim.id)}
                      disabled={isProcessing}
                    >
                      Process Individual
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {/* Review claim logic */}}
                    >
                      Review
                    </Button>
                  </div>
                )}

                {claim.status === 'draft' && (
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {/* Complete claim logic */}}
                    >
                      Complete Claim
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Processing Status */}
          {isProcessing && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-yellow-800">Processing claims...</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}