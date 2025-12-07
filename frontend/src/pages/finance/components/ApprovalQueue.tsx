
import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { CheckCircleIcon, XCircleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { financeService } from '../../../services/finance.service';

interface ApprovalQueueProps {
    items: any[]; // In real app, typed Bill[] | Expense[]
    onRefresh: () => void;
}

export const ApprovalQueue: React.FC<ApprovalQueueProps> = ({ items, onRefresh }) => {
    const [actionModal, setActionModal] = useState<{ id: string, type: 'bill' | 'expense', action: 'approve' | 'reject' | 'override' } | null>(null);
    const [reason, setReason] = useState('');

    const handleAction = async () => {
        if (!actionModal) return;
        try {
            await financeService.approveItem(actionModal.type, actionModal.id, actionModal.action, reason);
            setActionModal(null);
            setReason('');
            onRefresh();
        } catch (error) {
            alert('Action failed: ' + error);
        }
    };

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Approval Queue</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {items?.map((item) => (
                            <tr key={item.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.description || item.merchant || `Bill #${item.billNumber}`}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.amount}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                        {item.approvalStage}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <button
                                        onClick={() => setActionModal({ id: item.id, type: item.merchant ? 'expense' : 'bill', action: 'approve' })}
                                        className="text-green-600 hover:text-green-900"
                                    >
                                        <CheckCircleIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => setActionModal({ id: item.id, type: item.merchant ? 'expense' : 'bill', action: 'reject' })}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        <XCircleIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => setActionModal({ id: item.id, type: item.merchant ? 'expense' : 'bill', action: 'override' })}
                                        className="text-purple-600 hover:text-purple-900"
                                        title="Executive Override"
                                    >
                                        <ShieldCheckIcon className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Action Dialog */}
            {actionModal && (
                <div className="fixed inset-0 z-10 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setActionModal(null)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                            <div>
                                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                    Confirm {actionModal.action.toUpperCase()}
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500">
                                        Are you sure you want to {actionModal.action} this item?
                                        {actionModal.action === 'override' && ' This will bypass standard approval steps and strictly log your identity.'}
                                    </p>
                                    <textarea
                                        className="mt-3 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2"
                                        placeholder="Add a comment or reason (required for override)..."
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:col-start-2 sm:text-sm"
                                    onClick={handleAction}
                                >
                                    Confirm
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:col-start-1 sm:text-sm"
                                    onClick={() => setActionModal(null)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
