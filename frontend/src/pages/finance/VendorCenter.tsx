import { useState, useEffect } from 'react';
import { financeService, Vendor } from '../../services/finance.service';
import { Label } from '../../components/ui/label';
import { useToast } from '../../hooks/use-toast';
import {
    BuildingOffice2Icon,
    PlusIcon,
    MagnifyingGlassIcon,
    PencilIcon,
    TrashIcon,
    PhoneIcon,
    EnvelopeIcon,
    DocumentTextIcon,
    CheckCircleIcon,
    XCircleIcon,
    EyeIcon,
    BanknotesIcon,
    ClockIcon,
    DocumentArrowDownIcon,
    FunnelIcon,
} from '@heroicons/react/24/outline';

interface VendorExtended extends Vendor {
    phone?: string;
    address?: string;
    status?: 'active' | 'inactive' | 'pending';
    category?: string;
    paymentTerms?: string;
    totalSpend?: number;
    lastPayment?: string;
    outstandingBalance?: number;
}

// Mock vendors data
const mockVendors: VendorExtended[] = [
    {
        id: '1',
        organizationId: 'org-1',
        createdAt: new Date('2024-01-01'),
        name: 'Medical Supply Co.',
        email: 'accounts@medicalsupply.com',
        taxId: '12-3456789',
        phone: '(614) 555-0123',
        address: '123 Healthcare Ave, Columbus, OH 43215',
        status: 'active',
        category: 'Medical Supplies',
        paymentTerms: 'Net 30',
        totalSpend: 45678.90,
        lastPayment: '2026-01-02',
        outstandingBalance: 2340.50,
    },
    {
        id: '2',
        organizationId: 'org-1',
        createdAt: new Date('2024-01-01'),
        name: 'Office Depot Business',
        email: 'billing@officedepot.com',
        taxId: '98-7654321',
        phone: '(800) 463-3768',
        address: '456 Office Park Dr, Worthington, OH 43085',
        status: 'active',
        category: 'Office Supplies',
        paymentTerms: 'Net 15',
        totalSpend: 12345.67,
        lastPayment: '2025-12-28',
        outstandingBalance: 0,
    },
    {
        id: '3',
        organizationId: 'org-1',
        createdAt: new Date('2024-01-01'),
        name: 'IT Solutions LLC',
        email: 'invoices@itsolutions.com',
        taxId: '45-6789012',
        phone: '(614) 555-0456',
        address: '789 Tech Center Blvd, Dublin, OH 43017',
        status: 'active',
        category: 'Technology',
        paymentTerms: 'Net 45',
        totalSpend: 89012.34,
        lastPayment: '2025-12-15',
        outstandingBalance: 5600.00,
    },
    {
        id: '4',
        organizationId: 'org-1',
        createdAt: new Date('2024-01-01'),
        name: 'Uniform Express',
        email: 'ap@uniformexpress.com',
        taxId: '67-8901234',
        status: 'pending',
        category: 'Uniforms',
        paymentTerms: 'Net 30',
        totalSpend: 0,
        outstandingBalance: 0,
    },
];

const statusConfig = {
    active: { color: 'text-green-700', bg: 'bg-green-100', label: 'Active' },
    inactive: { color: 'text-gray-700', bg: 'bg-gray-100', label: 'Inactive' },
    pending: { color: 'text-yellow-700', bg: 'bg-yellow-100', label: 'Pending Approval' },
};

const categories = ['Medical Supplies', 'Office Supplies', 'Technology', 'Uniforms', 'Maintenance', 'Professional Services', 'Other'];

export function VendorCenter() {
    const [vendors, setVendors] = useState<VendorExtended[]>(mockVendors);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState<VendorExtended | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [newItem, setNewItem] = useState({
        name: '',
        email: '',
        taxId: '',
        phone: '',
        address: '',
        category: 'Medical Supplies',
        paymentTerms: 'Net 30',
    });

    // Calculate stats
    const stats = {
        totalVendors: vendors.length,
        activeVendors: vendors.filter(v => v.status === 'active').length,
        totalOutstanding: vendors.reduce((sum, v) => sum + (v.outstandingBalance || 0), 0),
        totalSpendYTD: vendors.reduce((sum, v) => sum + (v.totalSpend || 0), 0),
    };

    // Filter vendors
    const filteredVendors = vendors.filter(vendor => {
        const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vendor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vendor.taxId?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || vendor.status === filterStatus;
        const matchesCategory = filterCategory === 'all' || vendor.category === filterCategory;
        return matchesSearch && matchesStatus && matchesCategory;
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const newVendor: VendorExtended = {
            id: Date.now().toString(),
            organizationId: 'org-1',
            createdAt: new Date(),
            ...newItem,
            status: 'pending',
            totalSpend: 0,
            outstandingBalance: 0,
        };
        setVendors([...vendors, newVendor]);
        toast({ title: 'Vendor Added', description: 'Vendor has been added and is pending approval.' });
        setIsModalOpen(false);
        setNewItem({ name: '', email: '', taxId: '', phone: '', address: '', category: 'Medical Supplies', paymentTerms: 'Net 30' });
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to remove this vendor?')) return;
        setVendors(vendors.filter(v => v.id !== id));
        toast({ title: 'Vendor Removed', description: 'The vendor has been removed.' });
    }

    async function handleStatusToggle(id: string) {
        setVendors(vendors.map(v => {
            if (v.id === id) {
                const newStatus = v.status === 'active' ? 'inactive' : 'active';
                return { ...v, status: newStatus };
            }
            return v;
        }));
        toast({ title: 'Status Updated', description: 'Vendor status has been updated.' });
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Vendor Center</h1>
                    <p className="text-gray-500 mt-1">Manage your suppliers and vendors</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                        <DocumentArrowDownIcon className="h-5 w-5 mr-2 text-gray-500" />
                        Export
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Add Vendor
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setFilterStatus('all')}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Vendors</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalVendors}</p>
                        </div>
                        <div className="p-3 bg-indigo-100 rounded-lg">
                            <BuildingOffice2Icon className="h-6 w-6 text-indigo-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setFilterStatus('active')}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Active Vendors</p>
                            <p className="text-2xl font-bold text-green-600">{stats.activeVendors}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <CheckCircleIcon className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Outstanding Balance</p>
                            <p className="text-2xl font-bold text-red-600">${stats.totalOutstanding.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                        </div>
                        <div className="p-3 bg-red-100 rounded-lg">
                            <ClockIcon className="h-6 w-6 text-red-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">YTD Spend</p>
                            <p className="text-2xl font-bold text-blue-600">${stats.totalSpendYTD.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <BanknotesIcon className="h-6 w-6 text-blue-600" />
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
                            placeholder="Search vendors..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                    <div className="flex gap-3">
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="pending">Pending</option>
                        </select>
                        <select
                            value={filterCategory}
                            onChange={e => setFilterCategory(e.target.value)}
                            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="all">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Vendors Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                {filteredVendors.length === 0 ? (
                    <div className="p-10 text-center">
                        <BuildingOffice2Icon className="mx-auto h-12 w-12 text-gray-300" />
                        <p className="text-gray-500 mt-2">No vendors found</p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="mt-4 text-emerald-600 hover:text-emerald-800 font-medium"
                        >
                            Add your first vendor →
                        </button>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Outstanding</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Spend</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredVendors.map(vendor => {
                                const status = statusConfig[vendor.status || 'active'];
                                return (
                                    <tr key={vendor.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedVendor(vendor)}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gray-100 rounded-lg">
                                                    <BuildingOffice2Icon className="h-5 w-5 text-gray-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{vendor.name}</p>
                                                    <p className="text-sm text-gray-500">EIN: {vendor.taxId || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-600">{vendor.category || 'N/A'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">
                                                <p className="text-gray-900 flex items-center gap-1">
                                                    <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                                                    {vendor.email || 'N/A'}
                                                </p>
                                                {vendor.phone && (
                                                    <p className="text-gray-500 flex items-center gap-1">
                                                        <PhoneIcon className="h-4 w-4 text-gray-400" />
                                                        {vendor.phone}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <p className={`text-sm font-semibold ${(vendor.outstandingBalance || 0) > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                                ${(vendor.outstandingBalance || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <p className="text-sm font-semibold text-gray-900">
                                                ${(vendor.totalSpend || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex items-center justify-center gap-2" onClick={e => e.stopPropagation()}>
                                                <button
                                                    onClick={() => setSelectedVendor(vendor)}
                                                    className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                                                    title="View Details"
                                                >
                                                    <EyeIcon className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleStatusToggle(vendor.id)}
                                                    className={`p-1 transition-colors ${vendor.status === 'active' ? 'text-gray-400 hover:text-red-600' : 'text-gray-400 hover:text-green-600'}`}
                                                    title={vendor.status === 'active' ? 'Deactivate' : 'Activate'}
                                                >
                                                    {vendor.status === 'active' ? <XCircleIcon className="h-5 w-5" /> : <CheckCircleIcon className="h-5 w-5" />}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(vendor.id)}
                                                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                                    title="Delete"
                                                >
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add Vendor Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
                        <div className="px-6 py-4 border-b flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Add New Vendor</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <XCircleIcon className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <Label>Company Name *</Label>
                                <input
                                    className="w-full mt-1 border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500"
                                    value={newItem.name}
                                    onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                    required
                                    placeholder="e.g., Medical Supply Co."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Email</Label>
                                    <input
                                        className="w-full mt-1 border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500"
                                        type="email"
                                        value={newItem.email}
                                        onChange={e => setNewItem({ ...newItem, email: e.target.value })}
                                        placeholder="accounts@vendor.com"
                                    />
                                </div>
                                <div>
                                    <Label>Phone</Label>
                                    <input
                                        className="w-full mt-1 border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500"
                                        type="tel"
                                        value={newItem.phone}
                                        onChange={e => setNewItem({ ...newItem, phone: e.target.value })}
                                        placeholder="(614) 555-0123"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Tax ID / EIN</Label>
                                    <input
                                        className="w-full mt-1 border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500"
                                        value={newItem.taxId}
                                        onChange={e => setNewItem({ ...newItem, taxId: e.target.value })}
                                        placeholder="12-3456789"
                                    />
                                </div>
                                <div>
                                    <Label>Category</Label>
                                    <select
                                        className="w-full mt-1 border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500"
                                        value={newItem.category}
                                        onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                                    >
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <Label>Address</Label>
                                <input
                                    className="w-full mt-1 border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500"
                                    value={newItem.address}
                                    onChange={e => setNewItem({ ...newItem, address: e.target.value })}
                                    placeholder="123 Main St, City, State ZIP"
                                />
                            </div>
                            <div>
                                <Label>Payment Terms</Label>
                                <select
                                    className="w-full mt-1 border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500"
                                    value={newItem.paymentTerms}
                                    onChange={e => setNewItem({ ...newItem, paymentTerms: e.target.value })}
                                >
                                    <option value="Net 15">Net 15</option>
                                    <option value="Net 30">Net 30</option>
                                    <option value="Net 45">Net 45</option>
                                    <option value="Net 60">Net 60</option>
                                    <option value="Due on Receipt">Due on Receipt</option>
                                </select>
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
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                                >
                                    Add Vendor
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Vendor Detail Modal */}
            {selectedVendor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg">
                                    <BuildingOffice2Icon className="h-6 w-6 text-gray-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">{selectedVendor.name}</h2>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[selectedVendor.status || 'active'].bg} ${statusConfig[selectedVendor.status || 'active'].color}`}>
                                        {statusConfig[selectedVendor.status || 'active'].label}
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedVendor(null)} className="text-gray-400 hover:text-gray-600">
                                <XCircleIcon className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Financial Summary */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <p className="text-sm text-blue-600">Total Spend (YTD)</p>
                                    <p className="text-xl font-bold text-blue-900">${(selectedVendor.totalSpend || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                                </div>
                                <div className="bg-red-50 rounded-lg p-4">
                                    <p className="text-sm text-red-600">Outstanding Balance</p>
                                    <p className="text-xl font-bold text-red-900">${(selectedVendor.outstandingBalance || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600">Payment Terms</p>
                                    <p className="text-xl font-bold text-gray-900">{selectedVendor.paymentTerms || 'Net 30'}</p>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="border rounded-lg p-4">
                                <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-2">
                                        <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-500">Email</p>
                                            <p className="text-sm text-gray-900">{selectedVendor.email || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <PhoneIcon className="h-5 w-5 text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-500">Phone</p>
                                            <p className="text-sm text-gray-900">{selectedVendor.phone || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 col-span-2">
                                        <BuildingOffice2Icon className="h-5 w-5 text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-500">Address</p>
                                            <p className="text-sm text-gray-900">{selectedVendor.address || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-500">Tax ID / EIN</p>
                                            <p className="text-sm text-gray-900">{selectedVendor.taxId || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FunnelIcon className="h-5 w-5 text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-500">Category</p>
                                            <p className="text-sm text-gray-900">{selectedVendor.category || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Activity Placeholder */}
                            <div className="border rounded-lg p-4">
                                <h3 className="font-semibold text-gray-900 mb-3">Recent Transactions</h3>
                                <div className="text-center py-6 text-gray-500">
                                    <BanknotesIcon className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                                    <p className="text-sm">No recent transactions</p>
                                    <p className="text-xs text-gray-400">Transactions will appear here once payments are made</p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button
                                    onClick={() => setSelectedVendor(null)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Close
                                </button>
                                <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                                    Create Payment
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default VendorCenter;
