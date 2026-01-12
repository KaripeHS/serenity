import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { financeService } from '../../services/finance.service';
import {
    ArrowDownTrayIcon,
    ChartBarIcon,
    CurrencyDollarIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    CalendarIcon,
    DocumentChartBarIcon,
    BanknotesIcon,
    BuildingOffice2Icon,
    ScaleIcon,
    ClockIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
} from 'recharts';

// Mock data for enhanced reports
const mockMonthlyRevenue = [
    { month: 'Jul', revenue: 125000, expenses: 98000, profit: 27000 },
    { month: 'Aug', revenue: 132000, expenses: 102000, profit: 30000 },
    { month: 'Sep', revenue: 128000, expenses: 99000, profit: 29000 },
    { month: 'Oct', revenue: 145000, expenses: 108000, profit: 37000 },
    { month: 'Nov', revenue: 152000, expenses: 112000, profit: 40000 },
    { month: 'Dec', revenue: 168000, expenses: 118000, profit: 50000 },
];

const mockServiceRevenue = [
    { name: 'Skilled Nursing', value: 245000, color: '#4F46E5' },
    { name: 'Personal Care', value: 178000, color: '#10B981' },
    { name: 'Home Health Aide', value: 134000, color: '#F59E0B' },
    { name: 'Physical Therapy', value: 89000, color: '#EC4899' },
    { name: 'Occupational Therapy', value: 67000, color: '#8B5CF6' },
];

const mockExpenseBreakdown = [
    { category: 'Payroll', amount: 425000, percentage: 65 },
    { category: 'Benefits', amount: 78000, percentage: 12 },
    { category: 'Supplies', amount: 45000, percentage: 7 },
    { category: 'Insurance', amount: 38000, percentage: 6 },
    { category: 'Technology', amount: 26000, percentage: 4 },
    { category: 'Other', amount: 39000, percentage: 6 },
];

const mockCashFlow = [
    { month: 'Jul', inflow: 135000, outflow: 112000 },
    { month: 'Aug', inflow: 142000, outflow: 118000 },
    { month: 'Sep', inflow: 138000, outflow: 115000 },
    { month: 'Oct', inflow: 155000, outflow: 122000 },
    { month: 'Nov', inflow: 162000, outflow: 128000 },
    { month: 'Dec', inflow: 178000, outflow: 135000 },
];

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#6B7280'];

export const FinancialReports: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'pl' | 'bs' | 'cashflow' | 'budget'>('overview');
    const [dateRange, setDateRange] = useState('ytd');

    // Queries
    const { data: balanceSheet, isLoading: loadingBS } = useQuery({
        queryKey: ['balanceSheet'],
        queryFn: () => financeService.getBalanceSheet()
    });

    const { data: marginReport, isLoading: loadingPL } = useQuery({
        queryKey: ['grossMargin'],
        queryFn: () => financeService.getGrossMarginReport()
    });

    // Calculate totals from mock data
    const totalRevenue = mockServiceRevenue.reduce((sum, s) => sum + s.value, 0);
    const totalExpenses = mockExpenseBreakdown.reduce((sum, e) => sum + e.amount, 0);
    const netIncome = totalRevenue - totalExpenses;
    const profitMargin = ((netIncome / totalRevenue) * 100).toFixed(1);

    const tabs = [
        { id: 'overview', label: 'Overview', icon: ChartBarIcon },
        { id: 'pl', label: 'Profit & Loss', icon: CurrencyDollarIcon },
        { id: 'bs', label: 'Balance Sheet', icon: ScaleIcon },
        { id: 'cashflow', label: 'Cash Flow', icon: BanknotesIcon },
        { id: 'budget', label: 'Budget vs Actual', icon: DocumentChartBarIcon },
    ];

    // --- Tab Content Components ---

    const Overview = () => (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('pl')}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                            <p className="text-2xl font-bold text-green-600">${totalRevenue.toLocaleString()}</p>
                            <div className="flex items-center gap-1 mt-1">
                                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                                <span className="text-sm text-green-600">+12.5% vs last year</span>
                            </div>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('pl')}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Expenses</p>
                            <p className="text-2xl font-bold text-red-600">${totalExpenses.toLocaleString()}</p>
                            <div className="flex items-center gap-1 mt-1">
                                <ArrowTrendingUpIcon className="h-4 w-4 text-red-500" />
                                <span className="text-sm text-red-600">+8.2% vs last year</span>
                            </div>
                        </div>
                        <div className="p-3 bg-red-100 rounded-lg">
                            <ArrowTrendingDownIcon className="h-6 w-6 text-red-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('pl')}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Net Income</p>
                            <p className="text-2xl font-bold text-blue-600">${netIncome.toLocaleString()}</p>
                            <p className="text-sm text-gray-500 mt-1">{profitMargin}% margin</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <ChartBarIcon className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('cashflow')}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Cash Position</p>
                            <p className="text-2xl font-bold text-purple-600">$287,450</p>
                            <p className="text-sm text-gray-500 mt-1">Available balance</p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <BanknotesIcon className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue & Profit Trend</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={mockMonthlyRevenue}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                                <Legend />
                                <Area type="monotone" dataKey="revenue" stackId="1" stroke="#10B981" fill="#D1FAE5" name="Revenue" />
                                <Area type="monotone" dataKey="profit" stackId="2" stroke="#4F46E5" fill="#E0E7FF" name="Profit" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Revenue by Service */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Service</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={mockServiceRevenue}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={2}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    labelLine={false}
                                >
                                    {mockServiceRevenue.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Expense Breakdown */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
                <div className="space-y-4">
                    {mockExpenseBreakdown.map((expense, idx) => (
                        <div key={expense.category} className="flex items-center gap-4">
                            <div className="w-32 text-sm font-medium text-gray-700">{expense.category}</div>
                            <div className="flex-1">
                                <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ width: `${expense.percentage}%`, backgroundColor: COLORS[idx % COLORS.length] }}
                                    />
                                </div>
                            </div>
                            <div className="w-24 text-right text-sm font-semibold text-gray-900">
                                ${expense.amount.toLocaleString()}
                            </div>
                            <div className="w-12 text-right text-sm text-gray-500">
                                {expense.percentage}%
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const IncomeStatement = () => {
        const plData = marginReport || { totalRevenue: 0, totalCOGS: 0, grossMargin: 0, grossMarginPercent: 0, breakdown: { revenueByDiscipline: {}, costByDiscipline: {} } };
        const { totalRevenue: tr, totalCOGS, grossMargin, grossMarginPercent, breakdown } = plData;

        return (
            <div className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                        <h4 className="text-sm font-medium text-green-800">Total Revenue</h4>
                        <p className="text-2xl font-bold text-green-900">${(tr || totalRevenue).toLocaleString()}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                        <h4 className="text-sm font-medium text-red-800">Cost of Revenue</h4>
                        <p className="text-2xl font-bold text-red-900">${(totalCOGS || totalExpenses).toLocaleString()}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                        <h4 className="text-sm font-medium text-blue-800">Gross Margin</h4>
                        <p className="text-2xl font-bold text-blue-900">${(grossMargin || netIncome).toLocaleString()}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                        <h4 className="text-sm font-medium text-purple-800">Margin %</h4>
                        <p className="text-2xl font-bold text-purple-900">{grossMarginPercent || profitMargin}%</p>
                    </div>
                </div>

                {/* Chart and Table */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Detailed Table */}
                    <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
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
                                <tr className="bg-green-50 font-semibold"><td colSpan={2} className="px-4 py-2">Revenue</td></tr>
                                {mockServiceRevenue.map(service => (
                                    <tr key={service.name} className="hover:bg-gray-50">
                                        <td className="px-6 py-2 text-sm text-gray-900 pl-8">{service.name}</td>
                                        <td className="px-6 py-2 text-sm text-right text-gray-900">${service.value.toLocaleString()}</td>
                                    </tr>
                                ))}
                                <tr className="bg-red-50 font-semibold"><td colSpan={2} className="px-4 py-2">Expenses</td></tr>
                                {mockExpenseBreakdown.map(expense => (
                                    <tr key={expense.category} className="hover:bg-gray-50">
                                        <td className="px-6 py-2 text-sm text-gray-900 pl-8">{expense.category}</td>
                                        <td className="px-6 py-2 text-sm text-right text-gray-900">${expense.amount.toLocaleString()}</td>
                                    </tr>
                                ))}
                                <tr className="bg-blue-50 font-bold">
                                    <td className="px-6 py-3 text-sm">Net Income</td>
                                    <td className="px-6 py-3 text-sm text-right text-blue-700">${netIncome.toLocaleString()}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Chart */}
                    <div className="bg-white border rounded-xl shadow-sm p-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Performance</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={mockMonthlyRevenue}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                                    <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                                    <Legend />
                                    <Bar dataKey="revenue" fill="#10B981" name="Revenue" />
                                    <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
                                    <Bar dataKey="profit" fill="#4F46E5" name="Profit" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const BalanceSheetTab = () => {
        const bs = balanceSheet || [];
        const grouped = bs.reduce((acc: any, item: any) => {
            acc[item.type] = acc[item.type] || [];
            acc[item.type].push(item);
            return acc;
        }, {});

        const totalAssets = grouped['Asset']?.reduce((sum: number, item: any) => sum + parseFloat(item.balance), 0) || 245000;
        const totalLiabilities = grouped['Liability']?.reduce((sum: number, item: any) => sum + parseFloat(item.balance), 0) || 89000;
        const totalEquity = grouped['Equity']?.reduce((sum: number, item: any) => sum + parseFloat(item.balance), 0) || 156000;

        return (
            <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-indigo-500 hover:shadow-md transition-shadow cursor-pointer">
                        <div className="flex items-center gap-3 mb-2">
                            <BuildingOffice2Icon className="h-6 w-6 text-indigo-600" />
                            <h4 className="text-sm font-medium text-gray-500">Total Assets</h4>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">${totalAssets.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-red-500 hover:shadow-md transition-shadow cursor-pointer">
                        <div className="flex items-center gap-3 mb-2">
                            <ClockIcon className="h-6 w-6 text-red-600" />
                            <h4 className="text-sm font-medium text-gray-500">Total Liabilities</h4>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">${totalLiabilities.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-green-500 hover:shadow-md transition-shadow cursor-pointer">
                        <div className="flex items-center gap-3 mb-2">
                            <CheckCircleIcon className="h-6 w-6 text-green-600" />
                            <h4 className="text-sm font-medium text-gray-500">Total Equity</h4>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">${totalEquity.toLocaleString()}</p>
                    </div>
                </div>

                {/* Detailed Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Assets */}
                    <div className="bg-white shadow-sm rounded-xl border overflow-hidden">
                        <div className="px-4 py-4 bg-indigo-50 border-b">
                            <h3 className="text-lg font-semibold text-indigo-900">Assets</h3>
                        </div>
                        <div className="p-4">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-gray-700">Cash & Equivalents</span>
                                    <span className="font-semibold">$125,000</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-gray-700">Accounts Receivable</span>
                                    <span className="font-semibold">$78,000</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-gray-700">Equipment</span>
                                    <span className="font-semibold">$32,000</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-gray-700">Other Assets</span>
                                    <span className="font-semibold">$10,000</span>
                                </div>
                                <div className="flex justify-between items-center py-2 bg-indigo-50 px-2 rounded">
                                    <span className="font-bold text-indigo-900">Total Assets</span>
                                    <span className="font-bold text-indigo-900">${totalAssets.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Liabilities & Equity */}
                    <div className="bg-white shadow-sm rounded-xl border overflow-hidden">
                        <div className="px-4 py-4 bg-red-50 border-b">
                            <h3 className="text-lg font-semibold text-red-900">Liabilities & Equity</h3>
                        </div>
                        <div className="p-4">
                            <div className="space-y-3">
                                <p className="text-sm font-semibold text-gray-500 uppercase">Liabilities</p>
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-gray-700">Accounts Payable</span>
                                    <span className="font-semibold">$45,000</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-gray-700">Accrued Expenses</span>
                                    <span className="font-semibold">$28,000</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-gray-700">Notes Payable</span>
                                    <span className="font-semibold">$16,000</span>
                                </div>
                                <p className="text-sm font-semibold text-gray-500 uppercase mt-4">Equity</p>
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-gray-700">Retained Earnings</span>
                                    <span className="font-semibold">$156,000</span>
                                </div>
                                <div className="flex justify-between items-center py-2 bg-green-50 px-2 rounded">
                                    <span className="font-bold text-green-900">Total L + E</span>
                                    <span className="font-bold text-green-900">${(totalLiabilities + totalEquity).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const CashFlowTab = () => (
        <div className="space-y-6">
            {/* Cash Flow Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                    <h4 className="text-sm font-medium text-green-800">Cash Inflows</h4>
                    <p className="text-2xl font-bold text-green-900">$910,000</p>
                    <p className="text-sm text-green-700">Last 6 months</p>
                </div>
                <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                    <h4 className="text-sm font-medium text-red-800">Cash Outflows</h4>
                    <p className="text-2xl font-bold text-red-900">$630,000</p>
                    <p className="text-sm text-red-700">Last 6 months</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <h4 className="text-sm font-medium text-blue-800">Net Cash Flow</h4>
                    <p className="text-2xl font-bold text-blue-900">$280,000</p>
                    <p className="text-sm text-blue-700">Positive trend</p>
                </div>
            </div>

            {/* Cash Flow Chart */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Cash Flow Trend</h3>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={mockCashFlow}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                            <Legend />
                            <Line type="monotone" dataKey="inflow" stroke="#10B981" strokeWidth={2} name="Inflows" />
                            <Line type="monotone" dataKey="outflow" stroke="#EF4444" strokeWidth={2} name="Outflows" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Cash Flow Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Operating Activities</h4>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Collections from Clients</span>
                            <span className="text-green-600 font-medium">+$650,000</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Payments to Suppliers</span>
                            <span className="text-red-600 font-medium">-$125,000</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Payroll Payments</span>
                            <span className="text-red-600 font-medium">-$380,000</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between font-semibold">
                            <span>Net Operating</span>
                            <span className="text-green-600">$145,000</span>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Investing Activities</h4>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Equipment Purchases</span>
                            <span className="text-red-600 font-medium">-$25,000</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Software Licenses</span>
                            <span className="text-red-600 font-medium">-$8,000</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between font-semibold">
                            <span>Net Investing</span>
                            <span className="text-red-600">-$33,000</span>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Financing Activities</h4>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Loan Proceeds</span>
                            <span className="text-green-600 font-medium">+$50,000</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Loan Repayments</span>
                            <span className="text-red-600 font-medium">-$12,000</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between font-semibold">
                            <span>Net Financing</span>
                            <span className="text-green-600">$38,000</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const BudgetTab = () => {
        const budgetData = [
            { category: 'Revenue', budget: 750000, actual: 713000, variance: -37000 },
            { category: 'Payroll', budget: 400000, actual: 425000, variance: 25000 },
            { category: 'Benefits', budget: 80000, actual: 78000, variance: -2000 },
            { category: 'Supplies', budget: 50000, actual: 45000, variance: -5000 },
            { category: 'Insurance', budget: 35000, actual: 38000, variance: 3000 },
            { category: 'Technology', budget: 30000, actual: 26000, variance: -4000 },
        ];

        return (
            <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b">
                        <h3 className="text-lg font-medium text-gray-900">Budget vs Actual (YTD)</h3>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Budget</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actual</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Variance</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {budgetData.map(row => {
                                const isOver = row.category === 'Revenue' ? row.variance < 0 : row.variance > 0;
                                const pct = Math.abs((row.variance / row.budget) * 100).toFixed(1);
                                return (
                                    <tr key={row.category} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">{row.category}</td>
                                        <td className="px-6 py-4 text-right text-gray-700">${row.budget.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right text-gray-700">${row.actual.toLocaleString()}</td>
                                        <td className={`px-6 py-4 text-right font-semibold ${isOver ? 'text-red-600' : 'text-green-600'}`}>
                                            {row.variance > 0 ? '+' : ''}{row.variance.toLocaleString()} ({pct}%)
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isOver ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                {isOver ? 'Over' : 'Under'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Utilization</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={budgetData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                                <YAxis type="category" dataKey="category" width={80} />
                                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                                <Legend />
                                <Bar dataKey="budget" fill="#E5E7EB" name="Budget" />
                                <Bar dataKey="actual" fill="#4F46E5" name="Actual" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
                    <p className="text-gray-500 mt-1">Comprehensive financial analysis and reporting</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={dateRange}
                        onChange={e => setDateRange(e.target.value)}
                        className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="ytd">Year to Date</option>
                        <option value="q4">Q4 2025</option>
                        <option value="q3">Q3 2025</option>
                        <option value="lastyear">Last Year</option>
                    </select>
                    <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                        <ArrowDownTrayIcon className="h-5 w-5 mr-2 text-gray-500" />
                        Export PDF
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex gap-4">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === tab.id
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <tab.icon className="h-5 w-5" />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content */}
            {(loadingBS || loadingPL) ? (
                <div className="text-center py-10">
                    <div className="inline-flex items-center gap-2">
                        <div className="h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        Loading Financial Data...
                    </div>
                </div>
            ) : (
                <>
                    {activeTab === 'overview' && <Overview />}
                    {activeTab === 'pl' && <IncomeStatement />}
                    {activeTab === 'bs' && <BalanceSheetTab />}
                    {activeTab === 'cashflow' && <CashFlowTab />}
                    {activeTab === 'budget' && <BudgetTab />}
                </>
            )}
        </div>
    );
};

export default FinancialReports;
