
import React, { useState } from 'react';
import { financeService } from '../../services/finance.service';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

export const BankFeed: React.FC = () => {
    const [connecting, setConnecting] = useState(false);

    const handleConnectPlaid = async () => {
        setConnecting(true);
        try {
            // 1. Get Link Token
            const { link_token } = await financeService.getLinkToken();
            console.log('Got Link Token:', link_token);

            // 2. Mock "Opening Plaid Link"
            // In real app, we would use usePlaidLink({ token: link_token ... })
            // Here we just simulate the success callback
            const mockPublicToken = 'public-sandbox-12345';

            // 3. Exchange Token
            await financeService.exchangePublicToken(mockPublicToken);
            alert('Bank Connected Successfully (Mock Mode)!');

        } catch (error) {
            alert('Failed to connect bank: ' + error);
        } finally {
            setConnecting(false);
        }
    };

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Bank Feeds</h3>
                <button
                    onClick={handleConnectPlaid}
                    disabled={connecting}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                    {connecting ? 'Connecting...' : 'Connect Bank Account'}
                </button>
            </div>

            <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-lg">
                <ArrowPathIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions synced yet</h3>
                <p className="mt-1 text-sm text-gray-500">Connect a bank account to start importing transactions automatically.</p>
            </div>
        </div>
    );
};
