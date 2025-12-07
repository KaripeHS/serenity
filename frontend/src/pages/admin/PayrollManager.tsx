
import { useState } from 'react';
import SidebarLayout from '../../components/layouts/SidebarLayout';
import { financeService } from '../../services/finance.service';
import { Label } from '../../components/ui/label';
import { useToast } from '../../hooks/use-toast';

export function PayrollManager() {
    const { toast } = useToast();
    const [period, setPeriod] = useState({ start: '', end: '' });
    const [processing, setProcessing] = useState(false);
    const [runId, setRunId] = useState<string | null>(null);

    async function handleCalculate() {
        if (!period.start || !period.end) return;
        setProcessing(true);
        try {
            const result = await financeService.calculatePayroll(new Date(period.start), new Date(period.end));
            setRunId(result.runId);
            toast({ title: 'Success', description: 'Payroll calculated. Ready for review.' });
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setProcessing(false);
        }
    }

    async function handleCommit() {
        if (!runId) return;
        setProcessing(true);
        try {
            await financeService.commitPayroll(runId);
            toast({ title: 'Success', description: 'Payroll committed/paid successfully!' });
            setRunId(null);
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setProcessing(false);
        }
    }

    return (
        <SidebarLayout>
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-6">Payroll Manager</h1>

                <div className="bg-white p-6 rounded-lg shadow max-w-xl">
                    <h2 className="text-lg font-semibold mb-4">Run Payroll</h2>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <Label>Period Start</Label>
                            <input type="date" className="w-full mt-1 border rounded p-2" onChange={e => setPeriod({ ...period, start: e.target.value })} />
                        </div>
                        <div>
                            <Label>Period End</Label>
                            <input type="date" className="w-full mt-1 border rounded p-2" onChange={e => setPeriod({ ...period, end: e.target.value })} />
                        </div>
                    </div>

                    {!runId ? (
                        <button
                            onClick={handleCalculate}
                            disabled={processing || !period.start || !period.end}
                            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            {processing ? 'Calculating...' : 'Calculate Payroll'}
                        </button>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-green-50 p-4 rounded text-green-800 border border-green-200">
                                <p className="font-semibold">Calculation Complete</p>
                                <p className="text-sm">Run ID: {runId}</p>
                            </div>
                            <button
                                onClick={handleCommit}
                                disabled={processing}
                                className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
                            >
                                {processing ? 'Processing...' : 'Approve & Pay'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </SidebarLayout>
    );
}
