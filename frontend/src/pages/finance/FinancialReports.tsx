
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { financeService } from '../../services/finance.service';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

export const FinancialReports: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'bs' | 'pl'>('pl');

    // Queries
    const { data: balanceSheet, isLoading: loadingBS } = useQuery({
        queryKey: ['balanceSheet'],
        queryFn: () => financeService.getBalanceSheet()
    });

    const { data: marginReport, isLoading: loadingPL } = useQuery({
        queryKey: ['grossMargin'],
        queryFn: () => financeService.getGrossMarginReport()
    });

    // --- Tab Content Components ---

    const IncomeStatement = () => {
        if (!marginReport) return <div>Loading P&L...</div>;

        const { totalRevenue, totalCOGS, grossMargin, grossMarginPercent, breakdown } = marginReport;

        // Chart Data
        const chartData = [
            { name: 'Revenue', amount: totalRevenue },
            { name: 'Direct Costs', amount: totalCOGS },
            { name: 'Gross Profit', amount: grossMargin }
        ];

        return (
            <div className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="text-sm font-medium text-green-800">Total Revenue</h4>
                        <p className="text-2xl font-bold text-green-900">${totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h4 className="text-sm font-medium text-red-800">Cost of Revenue (COGS)</h4>
                        <p className="text-2xl font-bold text-red-900">${totalCOGS.toLocaleString()}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="text-sm font-medium text-blue-800">Gross Margin</h4>
                        <p className="text-2xl font-bold text-blue-900">${grossMargin.toLocaleString()}</p>
                        <p className="text-sm text-blue-600 font-semibold">{grossMarginPercent.toFixed(1)}%</p>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Detailed Table */}
                    <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 border-b">
                            <h3 className="text-lg font-medium text-gray-900">Breakdown by Service</h3>
                        </div>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                <tr className="bg-gray-50 font-semibold"><td colSpan={2} className="px-4 py-2">Revenue</td></tr>
                                {Object.entries(breakdown.revenueByDiscipline).map(([key, val]) => (
                                    <tr key={key}>
                                        <td className="px-6 py-2 text-sm text-gray-900 ml-4 pl-8">{key}</td>
                                        <td className="px-6 py-2 text-sm text-right text-gray-900">${val.toLocaleString()}</td>
                                    </tr>
                                ))}
                                <tr className="bg-gray-50 font-semibold"><td colSpan={2} className="px-4 py-2">Direct Costs</td></tr>
                                {Object.entries(breakdown.costByDiscipline).map(([key, val]) => (
                                    <tr key={key}>
                                        <td className="px-6 py-2 text-sm text-gray-900 ml-4 pl-8">{key}</td>
                                        <td className="px-6 py-2 text-sm text-right text-gray-900">${val.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Right: Charts */}
                    <div className="bg-white border rounded-lg shadow-sm p-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Profitability Visualization</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="amount" fill="#4F46E5" barSize={50} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const BalanceSheet = () => {
        if (!balanceSheet) return <div>Loading...</div>;
        // Group by type
        const grouped = balanceSheet.reduce((acc: any, item: any) => {
            acc[item.type] = acc[item.type] || [];
            acc[item.type].push(item);
            return acc;
        }, {});

        // Calculate Totals
        const totalAssets = grouped['Asset']?.reduce((sum: number, item: any) => sum + parseFloat(item.balance), 0) || 0;
        const totalLiabilities = grouped['Liability']?.reduce((sum: number, item: any) => sum + parseFloat(item.balance), 0) || 0;
        const totalEquity = grouped['Equity']?.reduce((sum: number, item: any) => sum + parseFloat(item.balance), 0) || 0;

        return (
            <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow border-l-4 border-indigo-500">
                        <h4 className="text-sm font-medium text-gray-500">Total Assets</h4>
                        <p className="text-2xl font-bold text-gray-900">${totalAssets.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
                        <h4 className="text-sm font-medium text-gray-500">Total Liabilities</h4>
                        <p className="text-2xl font-bold text-gray-900">${totalLiabilities.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
                        <h4 className="text-sm font-medium text-gray-500">Total Equity</h4>
                        <p className="text-2xl font-bold text-gray-900">${totalEquity.toLocaleString()}</p>
                    </div>
                </div>

                {/* Detailed Sections */}
                {['Asset', 'Liability', 'Equity'].map(type => (
                    <div key={type} className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">{type}s</h3>
                        </div>
                        <div className="px-4 py-5 sm:p-6">
                            <ul className="space-y-3">
                                {grouped[type]?.map((account: any) => (
                                    <li key={account.code} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2 last:border-0 hover:bg-gray-50 px-2 rounded">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-900">{account.name}</span>
                                            <span className="text-xs text-gray-500">{account.code} - {account.subtype}</span>
                                        </div>
                                        <span className="font-mono font-medium text-gray-900">${parseFloat(account.balance).toLocaleString()}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Financial Reports</h1>
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <ArrowDownTrayIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
                    Export PDF
                </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('pl')}
                        className={`${activeTab === 'pl'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Income Statement (P&L)
                    </button>
                    <button
                        onClick={() => setActiveTab('bs')}
                        className={`${activeTab === 'bs'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Balance Sheet
                    </button>
                </nav>
            </div>

            {/* Content Active */}
            {(loadingBS || loadingPL) ? (
                <div className="text-center py-10">Loading Financial Data...</div>
            ) : (
                activeTab === 'pl' ? <IncomeStatement /> : <BalanceSheet />
            )}
        </div>
    );
};

export default FinancialReports;
