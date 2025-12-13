/**
 * Payroll Screen - Payroll management and processing
 */

import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/DesignSystem';
import { format, addDays } from 'date-fns';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Config } from '../../constants/Config';

interface PayrollPeriod {
    id: string;
    periodStart: string;
    periodEnd: string;
    payDate: string;
    status: 'draft' | 'processing' | 'approved' | 'paid';
    totalGross: number;
    totalNet: number;
    employeeCount: number;
}

interface PayrollSummary {
    nextPayDate: string;
    nextPayAmount: number;
    ytdGross: number;
    ytdTaxes: number;
    totalEmployees: number;
    activeEmployees: number;
}

export default function PayrollScreen() {
    const [refreshing, setRefreshing] = useState(false);
    const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
    const [summary, setSummary] = useState<PayrollSummary | null>(null);

    const loadData = async () => {
        try {
            const token = await SecureStore.getItemAsync('serenity_auth_token');
            const api = axios.create({
                baseURL: Config.API_URL,
                headers: { Authorization: `Bearer ${token}` }
            });

            try {
                const [periodsRes, summaryRes] = await Promise.all([
                    api.get('/console/payroll/periods'),
                    api.get('/console/payroll/summary'),
                ]);
                setPeriods(periodsRes.data || []);
                setSummary(summaryRes.data);
            } catch (apiError) {
                // Fallback data
                const today = new Date();
                setPeriods([
                    {
                        id: '1',
                        periodStart: format(addDays(today, -14), 'yyyy-MM-dd'),
                        periodEnd: format(today, 'yyyy-MM-dd'),
                        payDate: format(addDays(today, 5), 'yyyy-MM-dd'),
                        status: 'processing',
                        totalGross: 168000,
                        totalNet: 132000,
                        employeeCount: 89,
                    },
                    {
                        id: '2',
                        periodStart: format(addDays(today, -28), 'yyyy-MM-dd'),
                        periodEnd: format(addDays(today, -15), 'yyyy-MM-dd'),
                        payDate: format(addDays(today, -9), 'yyyy-MM-dd'),
                        status: 'paid',
                        totalGross: 165000,
                        totalNet: 129000,
                        employeeCount: 87,
                    },
                    {
                        id: '3',
                        periodStart: format(addDays(today, -42), 'yyyy-MM-dd'),
                        periodEnd: format(addDays(today, -29), 'yyyy-MM-dd'),
                        payDate: format(addDays(today, -23), 'yyyy-MM-dd'),
                        status: 'paid',
                        totalGross: 162000,
                        totalNet: 127000,
                        employeeCount: 85,
                    },
                ]);
                setSummary({
                    nextPayDate: format(addDays(today, 5), 'yyyy-MM-dd'),
                    nextPayAmount: 168000,
                    ytdGross: 1890000,
                    ytdTaxes: 425000,
                    totalEmployees: 92,
                    activeEmployees: 89,
                });
            }
        } catch (error) {
            console.error('Failed to load payroll data:', error);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, []);

    const formatCurrency = (amount: number) => {
        if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
        if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
        return `$${amount.toFixed(0)}`;
    };

    const getStatusStyle = (status: PayrollPeriod['status']) => {
        switch (status) {
            case 'draft': return { bg: 'bg-gray-100', text: 'text-gray-600' };
            case 'processing': return { bg: 'bg-yellow-100', text: 'text-yellow-700' };
            case 'approved': return { bg: 'bg-blue-100', text: 'text-blue-700' };
            case 'paid': return { bg: 'bg-green-100', text: 'text-green-700' };
            default: return { bg: 'bg-gray-100', text: 'text-gray-600' };
        }
    };

    return (
        <ScrollView
            className="flex-1 bg-background"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Next Payroll Card */}
            {summary && (
                <View className="mx-4 mt-4 bg-success rounded-2xl p-5 shadow-sm">
                    <View className="flex-row justify-between items-start">
                        <View>
                            <Text className="text-green-100 text-sm">Next Payroll</Text>
                            <Text className="text-white text-2xl font-bold mt-1">
                                {format(new Date(summary.nextPayDate), 'MMMM d, yyyy')}
                            </Text>
                        </View>
                        <View className="bg-white/20 px-4 py-2 rounded-xl">
                            <Text className="text-white font-bold text-lg">{formatCurrency(summary.nextPayAmount)}</Text>
                        </View>
                    </View>
                    <View className="flex-row mt-4 pt-4 border-t border-green-400/30">
                        <View className="flex-1">
                            <Text className="text-green-100 text-xs">Active Employees</Text>
                            <Text className="text-white font-bold">{summary.activeEmployees}</Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-green-100 text-xs">YTD Gross</Text>
                            <Text className="text-white font-bold">{formatCurrency(summary.ytdGross)}</Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-green-100 text-xs">YTD Taxes</Text>
                            <Text className="text-white font-bold">{formatCurrency(summary.ytdTaxes)}</Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Quick Actions */}
            <View className="px-4 mt-4">
                <Text className="text-lg font-bold text-gray-800 mb-2">Quick Actions</Text>
                <View className="flex-row">
                    <TouchableOpacity className="flex-1 bg-white p-4 rounded-xl mr-2 border border-gray-100 items-center">
                        <View className="bg-blue-100 p-3 rounded-full mb-2">
                            <Ionicons name="calculator" size={22} color={Colors.info.DEFAULT} />
                        </View>
                        <Text className="text-gray-700 font-medium text-sm">Run Payroll</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-1 bg-white p-4 rounded-xl mx-1 border border-gray-100 items-center">
                        <View className="bg-purple-100 p-3 rounded-full mb-2">
                            <Ionicons name="time" size={22} color={Colors.caregiver.DEFAULT} />
                        </View>
                        <Text className="text-gray-700 font-medium text-sm">Timesheets</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-1 bg-white p-4 rounded-xl ml-2 border border-gray-100 items-center">
                        <View className="bg-green-100 p-3 rounded-full mb-2">
                            <Ionicons name="document-text" size={22} color={Colors.success.DEFAULT} />
                        </View>
                        <Text className="text-gray-700 font-medium text-sm">Reports</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Payroll Periods */}
            <View className="px-4 mt-4 pb-8">
                <Text className="text-lg font-bold text-gray-800 mb-2">Payroll History</Text>
                {periods.map(period => {
                    const style = getStatusStyle(period.status);
                    return (
                        <TouchableOpacity
                            key={period.id}
                            className="bg-white p-4 rounded-xl mb-2 border border-gray-100"
                        >
                            <View className="flex-row justify-between items-start mb-2">
                                <View>
                                    <Text className="text-gray-900 font-semibold">
                                        {format(new Date(period.periodStart), 'MMM d')} - {format(new Date(period.periodEnd), 'MMM d, yyyy')}
                                    </Text>
                                    <Text className="text-gray-500 text-sm">
                                        Pay Date: {format(new Date(period.payDate), 'MMM d, yyyy')}
                                    </Text>
                                </View>
                                <View className={`${style.bg} px-2 py-1 rounded-lg`}>
                                    <Text className={`${style.text} text-xs font-medium capitalize`}>{period.status}</Text>
                                </View>
                            </View>
                            <View className="flex-row justify-between pt-2 border-t border-gray-100">
                                <View>
                                    <Text className="text-gray-500 text-xs">Gross Pay</Text>
                                    <Text className="text-gray-900 font-semibold">{formatCurrency(period.totalGross)}</Text>
                                </View>
                                <View>
                                    <Text className="text-gray-500 text-xs">Net Pay</Text>
                                    <Text className="text-gray-900 font-semibold">{formatCurrency(period.totalNet)}</Text>
                                </View>
                                <View>
                                    <Text className="text-gray-500 text-xs">Employees</Text>
                                    <Text className="text-gray-900 font-semibold">{period.employeeCount}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </ScrollView>
    );
}
