
import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { financeService } from '../../services/finance.service';
import { formatCurrency } from '../../utils/format';

export const PayrollManager: React.FC = () => {
    const [step, setStep] = useState(0);
    const [period, setPeriod] = useState({ start: '', end: '' });
    const [runId, setRunId] = useState<string | null>(null);

    const calcMutation = useMutation({
        mutationFn: async () => financeService.calculatePayroll(new Date(period.start), new Date(period.end)),
        onSuccess: (data) => {
            setRunId(data.runId);
            setStep(1);
        },
        onError: (err: any) => alert(`Error: ${err.message}`)
    });

    const commitMutation = useMutation({
        mutationFn: async () => {
            if (!runId) return;
            await financeService.commitPayroll(runId);
        },
        onSuccess: () => {
            setStep(2);
        },
        onError: (err: any) => alert(`Error: ${err.message}`)
    });

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Payroll Wizard</h1>

            {step === 0 && (
                <div className="card bg-white p-6 rounded-lg shadow space-y-4">
                    <h2 className="text-lg font-semibold">Step 1: Select Pay Period</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Start Date</label>
                            <input
                                type="date"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={period.start}
                                onChange={e => setPeriod({ ...period, start: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">End Date</label>
                            <input
                                type="date"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={period.end}
                                onChange={e => setPeriod({ ...period, end: e.target.value })}
                            />
                        </div>
                    </div>
                    <button
                        className="btn btn-primary w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        onClick={() => calcMutation.mutate()}
                        disabled={!period.start || !period.end || calcMutation.isPending}
                    >
                        {calcMutation.isPending ? 'Calculating...' : 'Run Payroll Calculation'}
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                        Includes: Completed Visits, Hourly Logs, Mileage, and Approved Bonuses.
                    </p>
                </div>
            )}

            {step === 1 && (
                <div className="card bg-white p-6 rounded-lg shadow space-y-4">
                    <h2 className="text-lg font-semibold">Step 2: Review Draft Payroll</h2>
                    <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                        <p className="text-yellow-800">Review the totals below. This mimics the final GL posting.</p>
                    </div>

                    {/* Placeholder for detailed items table - mocking visual summary for now */}
                    <div className="space-y-2 border-t pt-4">
                        <div className="flex justify-between">
                            <span>Total Visits Pay:</span>
                            <span className="font-mono">$3,450.00</span>
                        </div>
                        <div className="flex justify-between font-medium text-green-700">
                            <span>Total Bonuses (Integrated):</span>
                            <span className="font-mono">$450.00</span>
                        </div>
                        <div className="flex justify-between border-t border-gray-300 pt-2 font-bold text-lg">
                            <span>Grand Total:</span>
                            <span>$3,900.00</span>
                        </div>
                    </div>

                    <div className="flex space-x-4">
                        <button
                            className="btn btn-secondary flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                            onClick={() => setStep(0)}
                        >
                            Back
                        </button>
                        <button
                            className="btn btn-primary flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                            onClick={() => commitMutation.mutate()}
                            disabled={commitMutation.isPending}
                        >
                            {commitMutation.isPending ? 'Posting...' : 'Approve & Post to GL'}
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="card bg-green-50 p-6 rounded-lg shadow text-center space-y-4 border border-green-200">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                        <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-green-800">Payroll Posted!</h2>
                    <p className="text-green-700">
                        Journal Entries have been created. <br />
                        Debit: Direct Labor / Bonus Expense <br />
                        Credit: Accrued Payroll
                    </p>
                    <button
                        className="btn btn-primary mt-4 py-2 px-4 rounded shadow bg-indigo-600 text-white"
                        onClick={() => { setStep(0); setRunId(null); setPeriod({ start: '', end: '' }); }}
                    >
                        Start New Run
                    </button>
                </div>
            )}
        </div>
    );
};
