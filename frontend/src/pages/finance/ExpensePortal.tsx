import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeService } from '../../services/finance.service';
import {
    PlusIcon,
    CameraIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    DocumentArrowDownIcon,
    CheckCircleIcon,
    ClockIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
    ReceiptPercentIcon,
    TruckIcon,
    BuildingOfficeIcon,
    ComputerDesktopIcon,
    AcademicCapIcon,
    WrenchScrewdriverIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '../../hooks/use-toast';

interface Expense {
    id: string;
    merchant: string;
    amount: number;
    category: string;
    date: string;
    status: 'pending' | 'approved' | 'rejected' | 'reimbursed';
    description: string;
    receiptUrl?: string;
    submittedBy: string;
    approvedBy?: string;
    approvedDate?: string;
    rejectionReason?: string;
}

const categoryIcons: Record<string, React.ElementType> = {
    'Meals': ReceiptPercentIcon,
    'Travel': TruckIcon,
    'Office Supplies': BuildingOfficeIcon,
    'Equipment': ComputerDesktopIcon,
    'Training': AcademicCapIcon,
    'Maintenance': WrenchScrewdriverIcon,
    'Other': ReceiptPercentIcon,
};

const statusConfig = {
    pending: { icon: ClockIcon, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Pending Review' },
    approved: { icon: CheckCircleIcon, color: 'text-green-600', bg: 'bg-green-100', label: 'Approved' },
    rejected: { icon: XCircleIcon, color: 'text-red-600', bg: 'bg-red-100', label: 'Rejected' },
    reimbursed: { icon: CheckCircleIcon, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Reimbursed' },
};

// Mock expenses data
const mockExpenses: Expense[] = [
    {
        id: '1',
        merchant: 'Office Depot',
        amount: 156.78,
        category: 'Office Supplies',
        date: '2026-01-03',
        status: 'approved',
        description: 'Printer paper and ink cartridges',
        submittedBy: 'John Smith',
        approvedBy: 'Sarah Manager',
        approvedDate: '2026-01-04',
    },
    {
        id: '2',
        merchant: 'Delta Airlines',
        amount: 425.00,
        category: 'Travel',
        date: '2026-01-02',
        status: 'pending',
        description: 'Flight to Columbus for client meeting',
        submittedBy: 'John Smith',
    },
    {
        id: '3',
        merchant: 'Chipotle',
        amount: 45.67,
        category: 'Meals',
        date: '2026-01-01',
        status: 'reimbursed',
        description: 'Team lunch during training session',
        submittedBy: 'John Smith',
        approvedBy: 'Sarah Manager',
        approvedDate: '2026-01-02',
    },
    {
        id: '4',
        merchant: 'Best Buy',
        amount: 299.99,
        category: 'Equipment',
        date: '2025-12-28',
        status: 'rejected',
        description: 'Wireless mouse and keyboard',
        submittedBy: 'John Smith',
        rejectionReason: 'Equipment request requires pre-approval from IT',
    },
    {
        id: '5',
        merchant: 'Coursera',
        amount: 79.00,
        category: 'Training',
        date: '2025-12-20',
        status: 'approved',
        description: 'HIPAA compliance certification course',
        submittedBy: 'John Smith',
        approvedBy: 'Sarah Manager',
        approvedDate: '2025-12-21',
    },
];

export const ExpensePortal: React.FC = () => {
    const { toast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);

    // Form state
    const [formData, setFormData] = useState({
        merchant: '',
        amount: '',
        category: 'Meals',
        description: '',
        date: new Date().toISOString().split('T')[0],
    });

    // Calculate summary stats
    const stats = {
        totalSubmitted: expenses.reduce((sum, e) => sum + e.amount, 0),
        pendingAmount: expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0),
        approvedAmount: expenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0),
        reimbursedAmount: expenses.filter(e => e.status === 'reimbursed').reduce((sum, e) => sum + e.amount, 0),
        pendingCount: expenses.filter(e => e.status === 'pending').length,
        thisMonthTotal: expenses.filter(e => new Date(e.date).getMonth() === new Date().getMonth()).reduce((sum, e) => sum + e.amount, 0),
    };

    // Filter expenses
    const filteredExpenses = expenses.filter(expense => {
        const matchesStatus = filterStatus === 'all' || expense.status === filterStatus;
        const matchesCategory = filterCategory === 'all' || expense.category === filterCategory;
        const matchesSearch = expense.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
            expense.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesCategory && matchesSearch;
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newExpense: Expense = {
            id: Date.now().toString(),
            merchant: formData.merchant,
            amount: parseFloat(formData.amount),
            category: formData.category,
            date: formData.date,
            status: 'pending',
            description: formData.description,
            submittedBy: 'Current User',
        };
        setExpenses([newExpense, ...expenses]);
        toast({ title: 'Expense Submitted', description: 'Your expense has been submitted for approval.' });
        setIsModalOpen(false);
        setFormData({ merchant: '', amount: '', category: 'Meals', description: '', date: new Date().toISOString().split('T')[0] });
    };

    const handleDelete = (id: string) => {
        setExpenses(expenses.filter(e => e.id !== id));
        toast({ title: 'Expense Deleted', description: 'The expense has been removed.' });
    };

    const categories = ['Meals', 'Travel', 'Office Supplies', 'Equipment', 'Training', 'Maintenance', 'Other'];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Expense Portal</h1>
                    <p className="text-gray-500 mt-1">Submit and track your expense reimbursements</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {}}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        <DocumentArrowDownIcon className="h-5 w-5 mr-2 text-gray-500" />
                        Export
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        New Expense
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setFilterStatus('all')}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">This Month</p>
                            <p className="text-2xl font-bold text-gray-900">${stats.thisMonthTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                        </div>
                        <div className="p-3 bg-indigo-100 rounded-lg">
                            <ReceiptPercentIcon className="h-6 w-6 text-indigo-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setFilterStatus('pending')}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Pending Review</p>
                            <p className="text-2xl font-bold text-yellow-600">${stats.pendingAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                            <p className="text-xs text-gray-400">{stats.pendingCount} expense{stats.pendingCount !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-lg">
                            <ClockIcon className="h-6 w-6 text-yellow-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setFilterStatus('approved')}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Approved</p>
                            <p className="text-2xl font-bold text-green-600">${stats.approvedAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <CheckCircleIcon className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setFilterStatus('reimbursed')}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Reimbursed</p>
                            <p className="text-2xl font-bold text-blue-600">${stats.reimbursedAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <ArrowPathIcon className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search expenses..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div className="flex gap-3">
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="reimbursed">Reimbursed</option>
                        </select>
                        <select
                            value={filterCategory}
                            onChange={e => setFilterCategory(e.target.value)}
                            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Expenses Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                {filteredExpenses.length === 0 ? (
                    <div className="p-10 text-center">
                        <ReceiptPercentIcon className="mx-auto h-12 w-12 text-gray-300" />
                        <p className="text-gray-500 mt-2">No expenses found</p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                            Submit your first expense →
                        </button>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Merchant</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredExpenses.map(expense => {
                                const status = statusConfig[expense.status];
                                const CategoryIcon = categoryIcons[expense.category] || ReceiptPercentIcon;
                                return (
                                    <tr key={expense.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedExpense(expense)}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(expense.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="text-sm font-medium text-gray-900">{expense.merchant}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <CategoryIcon className="h-4 w-4 text-gray-400" />
                                                <span className="text-sm text-gray-600">{expense.category}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-600 truncate max-w-xs">{expense.description}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <p className="text-sm font-semibold text-gray-900">${expense.amount.toFixed(2)}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                                                <status.icon className="h-3.5 w-3.5" />
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex items-center justify-center gap-2" onClick={e => e.stopPropagation()}>
                                                <button
                                                    onClick={() => setSelectedExpense(expense)}
                                                    className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                                                    title="View Details"
                                                >
                                                    <EyeIcon className="h-5 w-5" />
                                                </button>
                                                {expense.status === 'pending' && (
                                                    <>
                                                        <button
                                                            className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                                                            title="Edit"
                                                        >
                                                            <PencilIcon className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(expense.id)}
                                                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <TrashIcon className="h-5 w-5" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* New Expense Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
                        <div className="px-6 py-4 border-b flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Submit New Expense</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <XCircleIcon className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Merchant/Vendor</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.merchant}
                                        onChange={e => setFormData({...formData, merchant: e.target.value})}
                                        placeholder="e.g., Office Depot"
                                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.amount}
                                        onChange={e => setFormData({...formData, amount: e.target.value})}
                                        placeholder="0.00"
                                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({...formData, category: e.target.value})}
                                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.date}
                                        onChange={e => setFormData({...formData, date: e.target.value})}
                                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={formData.description}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                    placeholder="Describe the business purpose of this expense..."
                                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Receipt</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors">
                                    <CameraIcon className="mx-auto h-10 w-10 text-gray-400" />
                                    <p className="mt-2 text-sm text-gray-600">Click to upload or drag and drop</p>
                                    <p className="text-xs text-gray-400">PNG, JPG, PDF up to 10MB</p>
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
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                >
                                    Submit Expense
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Expense Detail Modal */}
            {selectedExpense && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
                        <div className="px-6 py-4 border-b flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Expense Details</h2>
                            <button onClick={() => setSelectedExpense(null)} className="text-gray-400 hover:text-gray-600">
                                <XCircleIcon className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">${selectedExpense.amount.toFixed(2)}</p>
                                    <p className="text-gray-500">{selectedExpense.merchant}</p>
                                </div>
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusConfig[selectedExpense.status].bg} ${statusConfig[selectedExpense.status].color}`}>
                                    {React.createElement(statusConfig[selectedExpense.status].icon, { className: "h-4 w-4" })}
                                    {statusConfig[selectedExpense.status].label}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 py-4 border-t border-b">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Date</p>
                                    <p className="font-medium">{new Date(selectedExpense.date).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Category</p>
                                    <p className="font-medium">{selectedExpense.category}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Submitted By</p>
                                    <p className="font-medium">{selectedExpense.submittedBy}</p>
                                </div>
                                {selectedExpense.approvedBy && (
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Approved By</p>
                                        <p className="font-medium">{selectedExpense.approvedBy}</p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <p className="text-xs text-gray-500 uppercase mb-1">Description</p>
                                <p className="text-gray-700">{selectedExpense.description}</p>
                            </div>

                            {selectedExpense.rejectionReason && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <div className="flex items-start gap-2">
                                        <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-red-800">Rejection Reason</p>
                                            <p className="text-sm text-red-700">{selectedExpense.rejectionReason}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button
                                    onClick={() => setSelectedExpense(null)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Close
                                </button>
                                {selectedExpense.status === 'rejected' && (
                                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                        Resubmit
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpensePortal;
