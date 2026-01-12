import { useState, useEffect } from 'react';
import { financeService, BankAccount } from '../../services/finance.service';
import { Label } from '../../components/ui/label';
import { useToast } from '../../hooks/use-toast';
import {
    BuildingLibraryIcon,
    PlusIcon,
    TrashIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    ArrowPathIcon,
    CreditCardIcon,
    CheckCircleIcon,
    XCircleIcon,
    EyeIcon,
    EyeSlashIcon,
    LinkIcon,
    DocumentArrowDownIcon,
    StarIcon,
    ClockIcon,
    BanknotesIcon,
    ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

interface BankAccountExtended extends BankAccount {
    accountType?: 'checking' | 'savings' | 'credit';
    balance?: number;
    availableBalance?: number;
    lastSynced?: string;
    status?: 'active' | 'pending' | 'error';
}

interface Transaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'credit' | 'debit';
    category: string;
    accountId: string;
}

// Mock data
const mockAccounts: BankAccountExtended[] = [
    {
        id: '1',
        name: 'Operating Account',
        institutionName: 'Chase Bank',
        accountNumberLast4: '4521',
        routingNumber: '044000037',
        isPrimary: true,
        accountType: 'checking',
        balance: 125450.67,
        availableBalance: 120000.00,
        lastSynced: '2026-01-06T10:30:00',
        status: 'active',
    },
    {
        id: '2',
        name: 'Payroll Account',
        institutionName: 'Chase Bank',
        accountNumberLast4: '7823',
        routingNumber: '044000037',
        isPrimary: false,
        accountType: 'checking',
        balance: 45678.90,
        availableBalance: 45678.90,
        lastSynced: '2026-01-06T10:30:00',
        status: 'active',
    },
    {
        id: '3',
        name: 'Reserve Account',
        institutionName: 'Fifth Third Bank',
        accountNumberLast4: '1234',
        routingNumber: '042000314',
        isPrimary: false,
        accountType: 'savings',
        balance: 75000.00,
        availableBalance: 75000.00,
        lastSynced: '2026-01-06T09:15:00',
        status: 'active',
    },
];

const mockTransactions: Transaction[] = [
    { id: '1', date: '2026-01-06', description: 'Medicaid Reimbursement', amount: 12450.00, type: 'credit', category: 'Revenue', accountId: '1' },
    { id: '2', date: '2026-01-05', description: 'Payroll Processing - Jan Week 1', amount: -18750.00, type: 'debit', category: 'Payroll', accountId: '2' },
    { id: '3', date: '2026-01-05', description: 'Medical Supplies Co - Invoice #4521', amount: -2340.50, type: 'debit', category: 'Supplies', accountId: '1' },
    { id: '4', date: '2026-01-04', description: 'Medicare Payment', amount: 8920.00, type: 'credit', category: 'Revenue', accountId: '1' },
    { id: '5', date: '2026-01-04', description: 'Office Depot - Supplies', amount: -156.78, type: 'debit', category: 'Office', accountId: '1' },
    { id: '6', date: '2026-01-03', description: 'Transfer to Reserve', amount: -5000.00, type: 'debit', category: 'Transfer', accountId: '1' },
    { id: '7', date: '2026-01-03', description: 'Transfer from Operating', amount: 5000.00, type: 'credit', category: 'Transfer', accountId: '3' },
];

const statusConfig = {
    active: { color: 'text-green-700', bg: 'bg-green-100', label: 'Connected' },
    pending: { color: 'text-yellow-700', bg: 'bg-yellow-100', label: 'Pending' },
    error: { color: 'text-red-700', bg: 'bg-red-100', label: 'Error' },
};

export default function BankAccounts() {
    const [accounts, setAccounts] = useState<BankAccountExtended[]>(mockAccounts);
    const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<BankAccountExtended | null>(null);
    const [showBalance, setShowBalance] = useState(true);
    const [newItem, setNewItem] = useState({
        name: '',
        institutionName: '',
        accountNumberLast4: '',
        routingNumber: '',
        accountType: 'checking',
    });

    // Calculate totals
    const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    const totalAvailable = accounts.reduce((sum, acc) => sum + (acc.availableBalance || 0), 0);
    const totalChecking = accounts.filter(a => a.accountType === 'checking').reduce((sum, acc) => sum + (acc.balance || 0), 0);
    const totalSavings = accounts.filter(a => a.accountType === 'savings').reduce((sum, acc) => sum + (acc.balance || 0), 0);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const newAccount: BankAccountExtended = {
            id: Date.now().toString(),
            ...newItem,
            isPrimary: accounts.length === 0,
            balance: 0,
            availableBalance: 0,
            lastSynced: new Date().toISOString(),
            status: 'pending',
            accountType: newItem.accountType as any,
        };
        setAccounts([...accounts, newAccount]);
        toast({ title: 'Account Added', description: 'Bank account has been added and is pending verification.' });
        setIsModalOpen(false);
        setNewItem({ name: '', institutionName: '', accountNumberLast4: '', routingNumber: '', accountType: 'checking' });
    }

    async function handleDelete(id: string) {
        const account = accounts.find(a => a.id === id);
        if (account?.isPrimary) {
            toast({ title: 'Cannot Delete', description: 'Cannot delete the primary account.', variant: 'destructive' });
            return;
        }
        if (!confirm('Are you sure you want to remove this account?')) return;
        setAccounts(accounts.filter(a => a.id !== id));
        toast({ title: 'Account Removed', description: 'Bank account has been removed.' });
    }

    async function handleSetPrimary(id: string) {
        setAccounts(accounts.map(a => ({
            ...a,
            isPrimary: a.id === id,
        })));
        toast({ title: 'Primary Account Updated', description: 'Primary account has been changed.' });
    }

    async function handleSync() {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        setAccounts(accounts.map(a => ({
            ...a,
            lastSynced: new Date().toISOString(),
        })));
        setLoading(false);
        toast({ title: 'Sync Complete', description: 'All accounts have been synced.' });
    }

    const getAccountTransactions = (accountId: string) => {
        return transactions.filter(t => t.accountId === accountId);
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Bank Accounts</h1>
                    <p className="text-gray-500 mt-1">Manage your connected bank accounts and transactions</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowBalance(!showBalance)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 bg-white hover:bg-gray-50"
                    >
                        {showBalance ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                    <button
                        onClick={handleSync}
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                        <ArrowPathIcon className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Sync All
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Link Account
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Balance</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {showBalance ? `$${totalBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}` : '••••••'}
                            </p>
                        </div>
                        <div className="p-3 bg-indigo-100 rounded-lg">
                            <BanknotesIcon className="h-6 w-6 text-indigo-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Available Balance</p>
                            <p className="text-2xl font-bold text-green-600">
                                {showBalance ? `$${totalAvailable.toLocaleString(undefined, {minimumFractionDigits: 2})}` : '••••••'}
                            </p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <CheckCircleIcon className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Checking Accounts</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {showBalance ? `$${totalChecking.toLocaleString(undefined, {minimumFractionDigits: 2})}` : '••••••'}
                            </p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <CreditCardIcon className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Savings Accounts</p>
                            <p className="text-2xl font-bold text-purple-600">
                                {showBalance ? `$${totalSavings.toLocaleString(undefined, {minimumFractionDigits: 2})}` : '••••••'}
                            </p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <BuildingLibraryIcon className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Accounts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {accounts.map(account => {
                    const status = statusConfig[account.status || 'active'];
                    const accountTxns = getAccountTransactions(account.id);
                    return (
                        <div
                            key={account.id}
                            className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${account.isPrimary ? 'ring-2 ring-blue-500' : ''}`}
                            onClick={() => setSelectedAccount(account)}
                        >
                            <div className="p-5">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-100 rounded-lg">
                                            <BuildingLibraryIcon className="h-6 w-6 text-gray-600" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-gray-900">{account.name}</h3>
                                                {account.isPrimary && (
                                                    <StarSolid className="h-4 w-4 text-yellow-500" title="Primary Account" />
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500">{account.institutionName}</p>
                                        </div>
                                    </div>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                                        {status.label}
                                    </span>
                                </div>

                                <div className="mt-4">
                                    <p className="text-sm text-gray-500">Current Balance</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {showBalance ? `$${(account.balance || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}` : '••••••'}
                                    </p>
                                </div>

                                <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                                    <span>•••• {account.accountNumberLast4}</span>
                                    <span className="capitalize">{account.accountType}</span>
                                </div>

                                <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <ClockIcon className="h-3.5 w-3.5" />
                                        Synced {account.lastSynced ? new Date(account.lastSynced).toLocaleTimeString() : 'Never'}
                                    </span>
                                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                        {!account.isPrimary && (
                                            <button
                                                onClick={() => handleSetPrimary(account.id)}
                                                className="p-1 text-gray-400 hover:text-yellow-600"
                                                title="Set as Primary"
                                            >
                                                <StarIcon className="h-4 w-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(account.id)}
                                            className="p-1 text-gray-400 hover:text-red-600"
                                            title="Remove Account"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Activity Preview */}
                            {accountTxns.length > 0 && (
                                <div className="bg-gray-50 px-5 py-3 border-t">
                                    <p className="text-xs font-medium text-gray-500 mb-2">Recent Activity</p>
                                    {accountTxns.slice(0, 2).map(txn => (
                                        <div key={txn.id} className="flex items-center justify-between py-1 text-sm">
                                            <span className="text-gray-700 truncate">{txn.description}</span>
                                            <span className={`font-medium ${txn.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                                {txn.type === 'credit' ? '+' : ''}{showBalance ? `$${Math.abs(txn.amount).toLocaleString()}` : '••••'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Add Account Card */}
                <div
                    onClick={() => setIsModalOpen(true)}
                    className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-8 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors min-h-[280px]"
                >
                    <div className="p-3 bg-blue-100 rounded-full mb-3">
                        <LinkIcon className="h-8 w-8 text-blue-600" />
                    </div>
                    <p className="font-medium text-gray-700">Link New Account</p>
                    <p className="text-sm text-gray-500 text-center mt-1">Connect your bank account to track transactions</p>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="px-6 py-4 border-b flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
                    <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">View All</button>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {transactions.slice(0, 7).map(txn => {
                            const account = accounts.find(a => a.id === txn.accountId);
                            return (
                                <tr key={txn.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(txn.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-medium text-gray-900">{txn.description}</p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {account?.name || 'Unknown'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">{txn.category}</span>
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${txn.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                        {txn.type === 'credit' ? '+' : ''}{showBalance ? `$${Math.abs(txn.amount).toLocaleString()}` : '••••'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Add Account Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
                        <div className="px-6 py-4 border-b flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Link Bank Account</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <XCircleIcon className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <LinkIcon className="h-5 w-5 text-blue-600" />
                                    <p className="text-sm text-blue-700">For a production environment, we recommend using Plaid for secure bank connections.</p>
                                </div>
                            </div>
                            <div>
                                <Label>Account Nickname</Label>
                                <input
                                    className="w-full mt-1 border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                                    value={newItem.name}
                                    onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                    required
                                    placeholder="e.g., Operating Account"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Institution Name</Label>
                                    <input
                                        className="w-full mt-1 border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                                        value={newItem.institutionName}
                                        onChange={e => setNewItem({ ...newItem, institutionName: e.target.value })}
                                        required
                                        placeholder="e.g., Chase Bank"
                                    />
                                </div>
                                <div>
                                    <Label>Account Type</Label>
                                    <select
                                        className="w-full mt-1 border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                                        value={newItem.accountType}
                                        onChange={e => setNewItem({ ...newItem, accountType: e.target.value })}
                                    >
                                        <option value="checking">Checking</option>
                                        <option value="savings">Savings</option>
                                        <option value="credit">Credit Card</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Routing Number</Label>
                                    <input
                                        className="w-full mt-1 border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                                        value={newItem.routingNumber}
                                        onChange={e => setNewItem({ ...newItem, routingNumber: e.target.value })}
                                        placeholder="e.g., 044000037"
                                    />
                                </div>
                                <div>
                                    <Label>Last 4 Digits</Label>
                                    <input
                                        className="w-full mt-1 border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                                        value={newItem.accountNumberLast4}
                                        onChange={e => setNewItem({ ...newItem, accountNumberLast4: e.target.value })}
                                        maxLength={4}
                                        placeholder="e.g., 1234"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Link Account
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Account Detail Modal */}
            {selectedAccount && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg">
                                    <BuildingLibraryIcon className="h-6 w-6 text-gray-600" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-semibold text-gray-900">{selectedAccount.name}</h2>
                                        {selectedAccount.isPrimary && (
                                            <StarSolid className="h-4 w-4 text-yellow-500" />
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500">{selectedAccount.institutionName} •••• {selectedAccount.accountNumberLast4}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedAccount(null)} className="text-gray-400 hover:text-gray-600">
                                <XCircleIcon className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Balance Summary */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600">Current Balance</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {showBalance ? `$${(selectedAccount.balance || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}` : '••••••'}
                                    </p>
                                </div>
                                <div className="bg-green-50 rounded-lg p-4">
                                    <p className="text-sm text-green-600">Available Balance</p>
                                    <p className="text-2xl font-bold text-green-900">
                                        {showBalance ? `$${(selectedAccount.availableBalance || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}` : '••••••'}
                                    </p>
                                </div>
                            </div>

                            {/* Account Details */}
                            <div className="border rounded-lg p-4">
                                <h3 className="font-semibold text-gray-900 mb-3">Account Details</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500">Account Type</p>
                                        <p className="font-medium capitalize">{selectedAccount.accountType}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Routing Number</p>
                                        <p className="font-medium">{selectedAccount.routingNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Status</p>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[selectedAccount.status || 'active'].bg} ${statusConfig[selectedAccount.status || 'active'].color}`}>
                                            {statusConfig[selectedAccount.status || 'active'].label}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Last Synced</p>
                                        <p className="font-medium">{selectedAccount.lastSynced ? new Date(selectedAccount.lastSynced).toLocaleString() : 'Never'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Transactions */}
                            <div className="border rounded-lg overflow-hidden">
                                <div className="px-4 py-3 bg-gray-50 border-b">
                                    <h3 className="font-semibold text-gray-900">Transactions</h3>
                                </div>
                                <div className="divide-y">
                                    {getAccountTransactions(selectedAccount.id).map(txn => (
                                        <div key={txn.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${txn.type === 'credit' ? 'bg-green-100' : 'bg-red-100'}`}>
                                                    {txn.type === 'credit' ? (
                                                        <ArrowDownIcon className="h-4 w-4 text-green-600" />
                                                    ) : (
                                                        <ArrowUpIcon className="h-4 w-4 text-red-600" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{txn.description}</p>
                                                    <p className="text-sm text-gray-500">{new Date(txn.date).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-semibold ${txn.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {txn.type === 'credit' ? '+' : ''}{showBalance ? `$${Math.abs(txn.amount).toLocaleString()}` : '••••'}
                                                </p>
                                                <p className="text-xs text-gray-500">{txn.category}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {getAccountTransactions(selectedAccount.id).length === 0 && (
                                        <div className="px-4 py-8 text-center text-gray-500">
                                            <ArrowsRightLeftIcon className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                                            <p>No transactions found</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button
                                    onClick={() => setSelectedAccount(null)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Close
                                </button>
                                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                                    <DocumentArrowDownIcon className="h-5 w-5" />
                                    Export Statement
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
