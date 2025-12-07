
import { useState, useEffect } from 'react';
import { request } from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

interface FlaggedShift {
    id: string;
    scheduled_start_time: string;
    scheduled_end_time: string;
    cg_first: string;
    cg_last: string;
    cl_first: string;
    cl_last: string;
    status: string;
    commuter_status: string;
}

export function ComplianceAuditQueue() {
    const [shifts, setShifts] = useState<FlaggedShift[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        loadQueue();
    }, []);

    const loadQueue = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('serenity_user_data') || '{}');
            const orgId = user.organizationId;
            if (!orgId) return;

            const data = await request<FlaggedShift[]>(`/api/compliance/audit-queue/${orgId}`);
            setShifts(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (shiftId: string, action: 'verify' | 'reject') => {
        const reason = prompt(action === 'verify' ? "Enter reason for override:" : "Enter rejection reason:");
        if (!reason) return;

        setProcessing(shiftId);
        try {
            await request(`/api/compliance/${action}/${shiftId}`, {
                method: 'POST',
                body: JSON.stringify({ note: reason })
            });
            // Remove from list locally
            setShifts(prev => prev.filter(s => s.id !== shiftId));
        } catch (err) {
            alert('Action failed');
            console.error(err);
        } finally {
            setProcessing(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Compliance Audit Queue</h1>
                    <p className="text-sm text-gray-500">Review flagged shifts before billing</p>
                </div>
                <div className="text-sm text-gray-500">
                    Pending Review: <strong>{shifts.length}</strong>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading...</div>
            ) : shifts.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-lg border border-dashed border-gray-300">
                    <div className="text-4xl mb-4">🙌</div>
                    <h3 className="text-lg font-medium text-gray-900">All Clear</h3>
                    <p className="text-gray-500">No flagged shifts requiring manual review.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {shifts.map(shift => (
                        <Card key={shift.id} className="border-l-4 border-l-red-500">
                            <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-red-700">GPS Mismatch / Exception</h3>
                                        <Badge variant="destructive">FLAGGED</Badge>
                                    </div>
                                    <p className="font-medium text-gray-900">
                                        {shift.cg_first} {shift.cg_last} ➜ {shift.cl_first} {shift.cl_last}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {new Date(shift.scheduled_start_time).toLocaleDateString()} • {new Date(shift.scheduled_start_time).toLocaleTimeString()} - {new Date(shift.scheduled_end_time).toLocaleTimeString()}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => handleAction(shift.id, 'reject')}
                                        disabled={processing === shift.id}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                    >
                                        Reject (Don't Pay)
                                    </Button>
                                    <Button
                                        onClick={() => handleAction(shift.id, 'verify')}
                                        disabled={processing === shift.id}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        Override & Pay
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
