/**
 * Finance Reports Screen
 */

import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/DesignSystem';

interface Report {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'revenue' | 'expenses' | 'payroll' | 'ar' | 'tax';
}

const reports: Report[] = [
    { id: '1', name: 'Revenue Summary', description: 'MTD and YTD revenue breakdown', icon: 'trending-up', category: 'revenue' },
    { id: '2', name: 'Payer Mix Analysis', description: 'Revenue by payer source', icon: 'pie-chart', category: 'revenue' },
    { id: '3', name: 'Expense Report', description: 'Detailed expense categories', icon: 'receipt', category: 'expenses' },
    { id: '4', name: 'P&L Statement', description: 'Profit and loss summary', icon: 'stats-chart', category: 'revenue' },
    { id: '5', name: 'Payroll Summary', description: 'Wages, taxes, and deductions', icon: 'wallet', category: 'payroll' },
    { id: '6', name: 'AR Aging Report', description: 'Outstanding receivables by age', icon: 'time', category: 'ar' },
    { id: '7', name: 'Collections Report', description: 'Payment collection trends', icon: 'cash', category: 'ar' },
    { id: '8', name: 'Tax Summary', description: 'Quarterly tax obligations', icon: 'document-text', category: 'tax' },
    { id: '9', name: 'Budget vs Actual', description: 'Budget performance tracking', icon: 'analytics', category: 'expenses' },
    { id: '10', name: 'Cash Flow Statement', description: 'Cash inflows and outflows', icon: 'swap-horizontal', category: 'revenue' },
];

export default function ReportsScreen() {
    const [refreshing, setRefreshing] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    const categories = [
        { id: 'all', name: 'All' },
        { id: 'revenue', name: 'Revenue' },
        { id: 'expenses', name: 'Expenses' },
        { id: 'payroll', name: 'Payroll' },
        { id: 'ar', name: 'A/R' },
        { id: 'tax', name: 'Tax' },
    ];

    const filteredReports = selectedCategory === 'all'
        ? reports
        : reports.filter(r => r.category === selectedCategory);

    const getCategoryColor = (category: Report['category']) => {
        switch (category) {
            case 'revenue': return Colors.success.DEFAULT;
            case 'expenses': return Colors.danger.DEFAULT;
            case 'payroll': return Colors.info.DEFAULT;
            case 'ar': return Colors.warning.DEFAULT;
            case 'tax': return Colors.caregiver.DEFAULT;
            default: return Colors.gray[500];
        }
    };

    return (
        <ScrollView
            className="flex-1 bg-background"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Category Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 pt-4 pb-2">
                {categories.map((cat) => (
                    <TouchableOpacity
                        key={cat.id}
                        className={`px-4 py-2 mr-2 rounded-full ${selectedCategory === cat.id ? 'bg-success' : 'bg-white border border-gray-200'}`}
                        onPress={() => setSelectedCategory(cat.id)}
                    >
                        <Text className={`font-medium ${selectedCategory === cat.id ? 'text-white' : 'text-gray-600'}`}>
                            {cat.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Reports Grid */}
            <View className="px-4 pt-2 pb-8">
                <Text className="text-lg font-bold text-gray-800 mb-3">Available Reports</Text>
                {filteredReports.map(report => {
                    const color = getCategoryColor(report.category);
                    return (
                        <TouchableOpacity
                            key={report.id}
                            className="bg-white p-4 rounded-xl mb-2 border border-gray-100 flex-row items-center"
                        >
                            <View className="p-3 rounded-xl mr-4" style={{ backgroundColor: `${color}20` }}>
                                <Ionicons name={report.icon as any} size={24} color={color} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-gray-900 font-semibold">{report.name}</Text>
                                <Text className="text-gray-500 text-sm">{report.description}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Export Options */}
            <View className="px-4 pb-8">
                <Text className="text-lg font-bold text-gray-800 mb-3">Export Options</Text>
                <View className="flex-row">
                    <TouchableOpacity className="flex-1 bg-white p-4 rounded-xl mr-2 border border-gray-100 items-center">
                        <Ionicons name="document" size={28} color={Colors.danger.DEFAULT} />
                        <Text className="text-gray-700 font-medium text-sm mt-2">PDF</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-1 bg-white p-4 rounded-xl mx-1 border border-gray-100 items-center">
                        <Ionicons name="grid" size={28} color={Colors.success.DEFAULT} />
                        <Text className="text-gray-700 font-medium text-sm mt-2">Excel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-1 bg-white p-4 rounded-xl ml-2 border border-gray-100 items-center">
                        <Ionicons name="mail" size={28} color={Colors.info.DEFAULT} />
                        <Text className="text-gray-700 font-medium text-sm mt-2">Email</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}
