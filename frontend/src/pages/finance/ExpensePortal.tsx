
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeService } from '../../services/finance.service';
import { PlusIcon, CameraIcon } from '@heroicons/react/24/outline';

export const ExpensePortal: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // In a real app, we'd fetch current user's expenses
    // For now, we'll just mock the list or fetch if we had an endpoint for "my expenses"
    // Assuming backend endpoint /expenses exists, but we didn't add it to service yet explicitly
    // We'll focus on the Submit Form

    const submitExpenseMutation = useMutation({
        // Using createBill as a placeholder or assuming we add createExpense to service
        mutationFn: (data: any) => financeService.createBill(data), // Reusing bill for demo, ideally distinct
        onSuccess: () => {
            alert('Expense Submitted');
            setIsModalOpen(false);
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-900">My Expenses</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                    New Expense
                </button>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md p-10 text-center">
                <p className="text-gray-500">No recent expenses found.</p>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-10 flex items-center justify-center bg-gray-500 bg-opacity-75">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                        <h2 className="text-lg font-medium mb-4">Submit Expense</h2>
                        <form onSubmit={(e: any) => {
                            e.preventDefault();
                            alert("Expense submission simulated");
                            setIsModalOpen(false);
                        }}>
                            <input placeholder="Merchant" className="block w-full mb-2 p-2 border rounded" required />
                            <input type="number" placeholder="Amount" className="block w-full mb-2 p-2 border rounded" required />
                            <select className="block w-full mb-2 p-2 border rounded">
                                <option>Meals</option>
                                <option>Travel</option>
                                <option>Supplies</option>
                            </select>
                            <div className="border-2 border-dashed border-gray-300 rounded p-4 mb-4 text-center cursor-pointer hover:bg-gray-50">
                                <CameraIcon className="mx-auto h-8 w-8 text-gray-400" />
                                <span className="text-sm text-gray-500">Upload Receipt</span>
                            </div>

                            <div className="flex justify-end space-x-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Submit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
