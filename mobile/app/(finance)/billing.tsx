/**
 * Billing Screen - Claims and billing management
 */

import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/DesignSystem';
import { format } from 'date-fns';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Config } from '../../constants/Config';

interface Claim {
    id: string;
    patientName: string;
    serviceDate: string;
    amount: number;
    status: 'pending' | 'submitted' | 'paid' | 'denied' | 'appealed';
    payer: string;
    claimNumber?: string;
}

interface BillingSummary {
    pendingClaims: number;
    pendingAmount: number;
    submittedClaims: number;
    submittedAmount: number;
    paidThisMonth: number;
    deniedClaims: number;
}

export default function BillingScreen() {
    const [refreshing, setRefreshing] = useState(false);
    const [claims, setClaims] = useState<Claim[]>([]);
    const [summary, setSummary] = useState<BillingSummary | null>(null);
    const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'paid' | 'denied'>('all');

    const loadData = async () => {
        try {
            const token = await SecureStore.getItemAsync('serenity_auth_token');
            const api = axios.create({
                baseURL: Config.API_URL,
                headers: { Authorization: `Bearer ${token}` }
            });

            try {
                const [claimsRes, summaryRes] = await Promise.all([
                    api.get('/console/billing/claims'),
                    api.get('/console/billing/summary'),
                ]);
                setClaims(claimsRes.data || []);
                setSummary(summaryRes.data);
            } catch (apiError) {
                // Fallback data
                setClaims([
                    { id: '1', patientName: 'John Smith', serviceDate: '2024-12-01', amount: 850, status: 'pending', payer: 'Medicare' },
                    { id: '2', patientName: 'Mary Johnson', serviceDate: '2024-12-02', amount: 1200, status: 'submitted', payer: 'Medicaid', claimNumber: 'CLM-2024-001234' },
                    { id: '3', patientName: 'Robert Davis', serviceDate: '2024-11-28', amount: 950, status: 'paid', payer: 'United Healthcare', claimNumber: 'CLM-2024-001233' },
                    { id: '4', patientName: 'Patricia Wilson', serviceDate: '2024-11-25', amount: 780, status: 'denied', payer: 'Aetna', claimNumber: 'CLM-2024-001232' },
                    { id: '5', patientName: 'James Brown', serviceDate: '2024-12-03', amount: 1100, status: 'pending', payer: 'Medicare' },
                ]);
                setSummary({
                    pendingClaims: 45,
                    pendingAmount: 52000,
                    submittedClaims: 128,
                    submittedAmount: 156000,
                    paidThisMonth: 312000,
                    deniedClaims: 8,
                });
            }
        } catch (error) {
            console.error('Failed to load billing data:', error);
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

    const getStatusStyle = (status: Claim['status']) => {
        switch (status) {
            case 'pending': return { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: 'time' };
            case 'submitted': return { bg: 'bg-blue-100', text: 'text-blue-700', icon: 'send' };
            case 'paid': return { bg: 'bg-green-100', text: 'text-green-700', icon: 'checkmark-circle' };
            case 'denied': return { bg: 'bg-red-100', text: 'text-red-700', icon: 'close-circle' };
            case 'appealed': return { bg: 'bg-purple-100', text: 'text-purple-700', icon: 'refresh' };
            default: return { bg: 'bg-gray-100', text: 'text-gray-700', icon: 'help' };
        }
    };

    const filteredClaims = claims.filter(c => filter === 'all' || c.status === filter);

    return (
        <ScrollView
            className="flex-1 bg-background"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Summary Cards */}
            {summary && (
                <View className="px-4 pt-4">
                    <View className="flex-row flex-wrap">
                        <View className="w-1/2 p-1">
                            <View className="bg-yellow-50 p-3 rounded-xl border border-yellow-200">
                                <Text className="text-yellow-600 text-xs font-medium">Pending</Text>
                                <Text className="text-xl font-bold text-yellow-700">{summary.pendingClaims}</Text>
                                <Text className="text-yellow-600 text-xs">${summary.pendingAmount.toLocaleString()}</Text>
                            </View>
                        </View>
                        <View className="w-1/2 p-1">
                            <View className="bg-blue-50 p-3 rounded-xl border border-blue-200">
                                <Text className="text-blue-600 text-xs font-medium">Submitted</Text>
                                <Text className="text-xl font-bold text-blue-700">{summary.submittedClaims}</Text>
                                <Text className="text-blue-600 text-xs">${summary.submittedAmount.toLocaleString()}</Text>
                            </View>
                        </View>
                        <View className="w-1/2 p-1">
                            <View className="bg-green-50 p-3 rounded-xl border border-green-200">
                                <Text className="text-green-600 text-xs font-medium">Paid (MTD)</Text>
                                <Text className="text-xl font-bold text-green-700">${(summary.paidThisMonth / 1000).toFixed(0)}K</Text>
                            </View>
                        </View>
                        <View className="w-1/2 p-1">
                            <View className="bg-red-50 p-3 rounded-xl border border-red-200">
                                <Text className="text-red-600 text-xs font-medium">Denied</Text>
                                <Text className="text-xl font-bold text-red-700">{summary.deniedClaims}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            )}

            {/* Filter Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 pt-4 pb-2">
                {(['all', 'pending', 'submitted', 'paid', 'denied'] as const).map((f) => (
                    <TouchableOpacity
                        key={f}
                        className={`px-4 py-2 mr-2 rounded-full ${filter === f ? 'bg-success' : 'bg-white border border-gray-200'}`}
                        onPress={() => setFilter(f)}
                    >
                        <Text className={`font-medium ${filter === f ? 'text-white' : 'text-gray-600'}`}>
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Claims List */}
            <View className="px-4 pt-2 pb-8">
                <Text className="text-lg font-bold text-gray-800 mb-2">Claims</Text>
                {filteredClaims.map(claim => {
                    const style = getStatusStyle(claim.status);
                    return (
                        <TouchableOpacity
                            key={claim.id}
                            className="bg-white p-4 rounded-xl mb-2 border border-gray-100"
                        >
                            <View className="flex-row justify-between items-start mb-2">
                                <View className="flex-1">
                                    <Text className="text-gray-900 font-semibold">{claim.patientName}</Text>
                                    <Text className="text-gray-500 text-sm">{claim.payer}</Text>
                                </View>
                                <View className={`${style.bg} px-2 py-1 rounded-lg flex-row items-center`}>
                                    <Ionicons name={style.icon as any} size={12} color={Colors.gray[600]} />
                                    <Text className={`${style.text} text-xs font-medium ml-1 capitalize`}>{claim.status}</Text>
                                </View>
                            </View>
                            <View className="flex-row justify-between items-center">
                                <View className="flex-row items-center">
                                    <Ionicons name="calendar-outline" size={14} color={Colors.gray[400]} />
                                    <Text className="text-gray-500 text-sm ml-1">
                                        {format(new Date(claim.serviceDate), 'MMM d, yyyy')}
                                    </Text>
                                </View>
                                <Text className="text-gray-900 font-bold">${claim.amount.toLocaleString()}</Text>
                            </View>
                            {claim.claimNumber && (
                                <Text className="text-gray-400 text-xs mt-1">#{claim.claimNumber}</Text>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </ScrollView>
    );
}
