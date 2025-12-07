/**
 * Bank Accounts Page
 * Manage Physical Bank Accounts for Financial Integration
 */

import React, { useEffect, useState } from 'react';
import { PlusIcon, BuildingLibraryIcon, TrashIcon } from '@heroicons/react/24/outline';
import { BankAccount, financeService } from '../../services/finance.service';
import DashboardLayout from '../../components/layouts/DashboardLayout';

const BankAccounts: React.FC = () => {
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        institutionName: '',
        accountNumberLast4: '',
        routingNumber: '',
        isPrimary: false
    });

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        try {
            setIsLoading(true);
            const data = await financeService.getBankAccounts();
            setAccounts(data);
        } catch (error) {
            console.error('Failed to load accounts', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await financeService.createBankAccount(formData);
            setIsModalOpen(false);
            setFormData({ name: '', institutionName: '', accountNumberLast4: '', routingNumber: '', isPrimary: false });
            loadAccounts();
        } catch (error) {
            console.error('Failed to create account', error);
            alert('Failed to create account');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this account?')) return;
        try {
            await financeService.deleteBankAccount(id);
            loadAccounts();
        } catch (error) {
            console.error('Failed to delete account', error);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Bank Accounts</h1>
                    <p className="mt-1 text-sm text-gray-500">Manage your connected financial institutions</p>
                </div>

                {/* Header Actions */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Connected Accounts</h2>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        Add Account
                    </button>
                </div>

                {/* Accounts Grid */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {isLoading ? (
                        <p>Loading accounts...</p>
                    ) : accounts.length === 0 ? (
                        <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                            <BuildingLibraryIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No bank accounts</h3>
                            <p className="mt-1 text-sm text-gray-500">Get started by adding your primary operating account.</p>
                        </div>
                    ) : (
                        accounts.map((account) => (
                            <div key={account.id} className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
                                <div className="p-5">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <BuildingLibraryIcon className="h-10 w-10 text-gray-400" aria-hidden="true" />
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">{account.institutionName || 'Bank Account'}</dt>
                                                <dd>
                                                    <div className="text-lg font-medium text-gray-900">{account.name}</div>
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-5 py-3">
                                    <div className="text-sm flex justify-between">
                                        <div className="font-medium text-indigo-700 truncate">
                                            Ending in •••• {account.accountNumberLast4 || 'N/A'}
                                        </div>
                                        <button onClick={() => handleDelete(account.id)} className="text-red-600 hover:text-red-900">
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Add Account Modal */}
            {isModalOpen && (
                <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setIsModalOpen(false)}></div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <form onSubmit={handleSubmit}>
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                            <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">Add Bank Account</h3>
                                            <div className="mt-4 space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Account Nickname</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                        placeholder="e.g. Chase Operating"
                                                        value={formData.name}
                                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Institution Name</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                        placeholder="e.g. Chase Bank"
                                                        value={formData.institutionName}
                                                        onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Routing Number</label>
                                                        <input
                                                            type="text"
                                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                            value={formData.routingNumber}
                                                            onChange={(e) => setFormData({ ...formData, routingNumber: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Last 4 Digits</label>
                                                        <input
                                                            type="text"
                                                            maxLength={4}
                                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                            value={formData.accountNumberLast4}
                                                            onChange={(e) => setFormData({ ...formData, accountNumberLast4: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex items-start">
                                                    <div className="flex items-center h-5">
                                                        <input
                                                            id="is_primary"
                                                            name="is_primary"
                                                            type="checkbox"
                                                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                                            checked={formData.isPrimary}
                                                            onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                                                        />
                                                    </div>
                                                    <div className="ml-3 text-sm">
                                                        <label htmlFor="is_primary" className="font-medium text-gray-700">Primary Account</label>
                                                        <p className="text-gray-500">Use this account for default deposits.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm">
                                        Add Account
                                    </button>
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default BankAccounts;
