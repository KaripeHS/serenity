
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  result: 'success' | 'failure';
  details?: string;
}

interface AuditLogViewerProps {
  className?: string;
}

export function AuditLogViewer({ className = '' }: AuditLogViewerProps) {
  const productionAuditLogs: AuditLogEntry[] = [
    {
      id: '1',
      timestamp: '2024-01-15T14:30:00Z',
      user: 'sarah.johnson@serenitycare.com',
      action: 'ACCESS_PATIENT_RECORD',
      resource: 'Patient #1001 - Eleanor Johnson',
      result: 'success',
      details: 'Viewed patient care plan'
    },
    {
      id: '2',
      timestamp: '2024-01-15T14:25:00Z',
      user: 'maria.rodriguez@serenitycare.com',
      action: 'UPDATE_MEDICATION',
      resource: 'Patient #1001 - Eleanor Johnson',
      result: 'success',
      details: 'Updated medication schedule'
    },
    {
      id: '3',
      timestamp: '2024-01-15T14:20:00Z',
      user: 'david.chen@serenitycare.com',
      action: 'LOGIN_ATTEMPT',
      resource: 'ERP System',
      result: 'failure',
      details: 'Invalid credentials'
    }
  ];

  const getResultColor = (result: string) => {
    return result === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Audit Log</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {productionAuditLogs.map((log) => (
            <div key={log.id} className="border-l-4 border-blue-200 pl-4 py-2">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-900">
                  {log.action.replace(/_/g, ' ')}
                </div>
                <Badge className={getResultColor(log.result)}>
                  {log.result}
                </Badge>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div><strong>User:</strong> {log.user}</div>
                <div><strong>Resource:</strong> {log.resource}</div>
                <div><strong>Time:</strong> {new Date(log.timestamp).toLocaleString()}</div>
                {log.details && <div><strong>Details:</strong> {log.details}</div>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}