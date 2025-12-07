
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeService, Vendor, Bill } from '../../services/finance.service';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';

export const VendorCenter: React.FC = () => {
    const queryClient = useQueryClient();
    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
    const [isBillModalOpen, setIsBillModalOpen] = useState(false);
    const [selectedVendorId, setSelectedVendorId] = useState<string>('');

    // --- Queries ---
    const { data: vendors, isLoading: loadingVendors } = useQuery({
        queryKey: ['vendors'],
        queryFn: () => financeService.getVendors()
    });

    // --- Mutations ---
    const createVendorMutation = useMutation({
        mutationFn: (data: Partial<Vendor>) => financeService.createVendor(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendors'] });
            setIsVendorModalOpen(false);
        }
    });

    const createBillMutation = useMutation({
        mutationFn: (data: Partial<Bill>) => financeService.createBill(data),
        onSuccess: () => {
            // In a real app we'd fetch bills too
            alert('Bill Created Successfully');
            setIsBillModalOpen(false);
        }
    });

    if (loadingVendors) return <div>Loading Vendors...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-900">Vendor Center</h1>
                <div className="space-x-4">
                    <button
                        onClick={() => setIsVendorModalOpen(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                        Add Vendor
                    </button>
                    <button
                        onClick={() => setIsBillModalOpen(true)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                        Create Bill
                    </button>
                </div>
            </div>

            {/* Vendors List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {vendors?.map((vendor) => (
                        <li key={vendor.id}>
                            <div className="px-4 py-4 sm:px-6">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-indigo-600 truncate">{vendor.name}</p>
                                    <div className="ml-2 flex-shrink-0 flex">
                                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            Active
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-2 sm:flex sm:justify-between">
                                    <div className="sm:flex">
                                        <p className="flex items-center text-sm text-gray-500">
                                            {vendor.email}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                    {vendors?.length === 0 && (
                        <li className="px-4 py-8 text-center text-gray-500">No vendors found. Add one to get started.</li>
                    )}
                </ul>
            </div>

            {/* Simple Add Vendor Modal (Simplified for brevity) */}
            {isVendorModalOpen && (
                <div className="fixed inset-0 z-10 flex items-center justify-center bg-gray-500 bg-opacity-75">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                        <h2 className="text-lg font-medium mb-4">Add Vendor</h2>
                        <form onSubmit={(e: any) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            createVendorMutation.mutate({
                                name: formData.get('name') as string,
                                email: formData.get('email') as string,
                                taxId: formData.get('taxId') as string,
                            });
                        }}>
                            <input name="name" placeholder="Vendor Name" className="block w-full mb-2 p-2 border rounded" required />
                            <input name="email" placeholder="Email" className="block w-full mb-2 p-2 border rounded" />
                            <input name="taxId" placeholder="Tax ID" className="block w-full mb-4 p-2 border rounded" />
                            <div className="flex justify-end space-x-2">
                                <button type="button" onClick={() => setIsVendorModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Bill Modal */}
            {isBillModalOpen && (
                <div className="fixed inset-0 z-10 flex items-center justify-center bg-gray-500 bg-opacity-75">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                        <h2 className="text-lg font-medium mb-4">Create Bill</h2>
                        <form onSubmit={(e: any) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            createBillMutation.mutate({
                                vendorId: formData.get('vendorId') as string,
                                billNumber: formData.get('billNumber') as string,
                                amount: parseFloat(formData.get('amount') as string),
                                dueDate: formData.get('dueDate') as string,
                                status: 'draft' // Default
                            });
                        }}>
                            <select name="vendorId" className="block w-full mb-2 p-2 border rounded" required>
                                <option value="">Select Vendor</option>
                                {vendors?.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                            <input name="billNumber" placeholder="Invoice #" className="block w-full mb-2 p-2 border rounded" required />
                            <input name="amount" type="number" step="0.01" placeholder="Amount" className="block w-full mb-2 p-2 border rounded" required />
                            <input name="dueDate" type="date" className="block w-full mb-4 p-2 border rounded" required />

                            <div className="flex justify-end space-x-2">
                                <button type="button" onClick={() => setIsBillModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Submit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
