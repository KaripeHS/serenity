
import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { request } from '../../services/api';

// Services/Types inline for speed (Move to proper service file in refactor)
interface PaymentIntent {
    amount: number;
    method: 'card' | 'ach' | 'check' | 'zelle';
    reference?: string;
    billId?: string;
}

const processPayment = async (data: PaymentIntent) => {
    return request('/api/console/finance/payments', {
        method: 'POST',
        body: JSON.stringify(data)
    });
};

export const PaymentPortal: React.FC = () => {
    const [amount, setAmount] = useState<string>('');
    const [method, setMethod] = useState<'card' | 'ach' | 'check' | 'zelle'>('card');
    const [reference, setReference] = useState('');
    const [successId, setSuccessId] = useState<string | null>(null);

    const parsedAmount = parseFloat(amount) || 0;

    // Calculate Fee Display
    let fee = 0;
    if (method === 'card') {
        fee = parsedAmount * 0.03;
    } else if (method === 'ach') {
        fee = Math.min(parsedAmount * 0.008, 5.00);
    }

    const total = parsedAmount + fee;

    const mutation = useMutation({
        mutationFn: processPayment,
        onSuccess: (data: any) => {
            setSuccessId(data.paymentId);
            setAmount('');
            setReference('');
        },
        onError: (err: any) => alert(err.message)
    });

    if (successId) {
        return (
            <div className="card p-8 text-center max-w-lg mx-auto bg-green-50 border border-green-200 shadow-sm rounded-lg">
                <h2 className="text-2xl font-bold text-green-800 mb-2">Payment Successful!</h2>
                <p className="text-green-700">Thank you. Your transaction has been recorded.</p>
                <p className="text-sm text-gray-500 mt-4">Transaction ID: {successId}</p>
                <button onClick={() => setSuccessId(null)} className="btn btn-primary mt-6">Make Another Payment</button>
            </div>
        )
    }

    return (
        <div className="p-6 max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Make a Payment</h1>

            <div className="card bg-white p-6 rounded-lg shadow space-y-6">

                {/* Amount Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Amount ($)</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                            type="number"
                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-lg border-gray-300 rounded-md"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>
                </div>

                {/* Method Toggle */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <button
                            onClick={() => setMethod('card')}
                            className={`px-4 py-3 border rounded-md text-sm font-medium text-center ${method === 'card' ? 'border-indigo-500 ring-2 ring-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                        >
                            Credit Card
                        </button>
                        <button
                            onClick={() => setMethod('ach')}
                            className={`px-4 py-3 border rounded-md text-sm font-medium text-center ${method === 'ach' ? 'border-indigo-500 ring-2 ring-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                        >
                            Bank (ACH)
                        </button>
                        <button
                            onClick={() => setMethod('zelle')}
                            className={`px-4 py-3 border rounded-md text-sm font-medium text-center ${method === 'zelle' ? 'border-indigo-500 ring-2 ring-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                        >
                            Zelle
                        </button>
                        <button
                            onClick={() => setMethod('check')}
                            className={`px-4 py-3 border rounded-md text-sm font-medium text-center ${method === 'check' ? 'border-indigo-500 ring-2 ring-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                        >
                            Check / Manual
                        </button>
                    </div>
                </div>

                {/* Zelle / Manual Instructions */}
                {method === 'zelle' && (
                    <div className="bg-purple-50 p-4 rounded-md border border-purple-200">
                        <h4 className="font-semibold text-purple-900">Zelle Instructions</h4>
                        <p className="text-sm text-purple-800 mt-1">
                            Send amount to <strong>payments@serenitycare.com</strong> (or 555-0123).<br />
                            Include your Client ID in the memo. Once sent, click 'Record Payment' below.
                        </p>
                    </div>
                )}

                {(method === 'zelle' || method === 'check') && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Reference Number / Check #</label>
                        <input
                            type="text"
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Validation or Check #"
                            value={reference}
                            onChange={e => setReference(e.target.value)}
                        />
                    </div>
                )}

                {/* Dynamic Summary */}
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium">${parsedAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                            Processing Fee
                            {method === 'card' && ' (3%)'}
                            {method === 'ach' && ' (0.8%)'}
                        </span>
                        <span className="font-medium text-orange-600">+${fee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2 mt-2">
                        <span>Total Charge:</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                </div>

                {/* Submit */}
                <button
                    onClick={() => mutation.mutate({ amount: parsedAmount, method, reference })}
                    disabled={parsedAmount <= 0 || mutation.isPending}
                    className="w-full btn btn-primary py-3 rounded-md shadow bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50"
                >
                    {mutation.isPending ? 'Processing...' : `Pay $${total.toFixed(2)}`}
                </button>

            </div>
        </div>
    );
};
