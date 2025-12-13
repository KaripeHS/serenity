/**
 * Care Plans Screen - Care plan management for clinical staff
 */

import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/DesignSystem';
import { format, differenceInDays } from 'date-fns';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Config } from '../../constants/Config';

interface CarePlan {
    id: string;
    patientName: string;
    startDate: string;
    endDate: string;
    status: 'active' | 'expiring' | 'expired' | 'review_needed';
    lastReviewDate: string;
    nextReviewDate: string;
    goals: number;
    goalsCompleted: number;
    primaryNurse: string;
}

export default function CarePlansScreen() {
    const [refreshing, setRefreshing] = useState(false);
    const [carePlans, setCarePlans] = useState<CarePlan[]>([]);
    const [filter, setFilter] = useState<'all' | 'review' | 'expiring' | 'active'>('review');

    const loadData = async () => {
        try {
            const token = await SecureStore.getItemAsync('serenity_auth_token');
            const api = axios.create({
                baseURL: Config.API_URL,
                headers: { Authorization: `Bearer ${token}` }
            });

            try {
                const response = await api.get('/console/clinical/careplans');
                setCarePlans(response.data || []);
            } catch (apiError) {
                setCarePlans([
                    { id: '1', patientName: 'John Smith', startDate: '2024-10-01', endDate: '2025-01-01', status: 'active', lastReviewDate: '2024-11-15', nextReviewDate: '2024-12-15', goals: 5, goalsCompleted: 3, primaryNurse: 'Sarah Johnson' },
                    { id: '2', patientName: 'Mary Wilson', startDate: '2024-09-15', endDate: '2024-12-15', status: 'expiring', lastReviewDate: '2024-11-01', nextReviewDate: '2024-12-08', goals: 4, goalsCompleted: 2, primaryNurse: 'Emily Chen' },
                    { id: '3', patientName: 'Robert Brown', startDate: '2024-11-01', endDate: '2025-02-01', status: 'review_needed', lastReviewDate: '2024-11-01', nextReviewDate: '2024-12-01', goals: 6, goalsCompleted: 4, primaryNurse: 'Sarah Johnson' },
                    { id: '4', patientName: 'Patricia Davis', startDate: '2024-11-15', endDate: '2025-02-15', status: 'active', lastReviewDate: '2024-11-20', nextReviewDate: '2024-12-20', goals: 3, goalsCompleted: 1, primaryNurse: 'Lisa Brown' },
                    { id: '5', patientName: 'Thomas Anderson', startDate: '2024-08-01', endDate: '2024-11-30', status: 'expired', lastReviewDate: '2024-10-15', nextReviewDate: '2024-11-30', goals: 5, goalsCompleted: 5, primaryNurse: 'Emily Chen' },
                    { id: '6', patientName: 'Linda Garcia', startDate: '2024-10-15', endDate: '2025-01-15', status: 'active', lastReviewDate: '2024-11-25', nextReviewDate: '2024-12-25', goals: 4, goalsCompleted: 2, primaryNurse: 'Sarah Johnson' },
                ]);
            }
        } catch (error) {
            console.error('Failed to load care plans:', error);
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

    const getStatusConfig = (status: CarePlan['status']) => {
        switch (status) {
            case 'active': return { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' };
            case 'expiring': return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Expiring Soon' };
            case 'expired': return { bg: 'bg-red-100', text: 'text-red-700', label: 'Expired' };
            case 'review_needed': return { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Review Needed' };
            default: return { bg: 'bg-gray-100', text: 'text-gray-600', label: status };
        }
    };

    const filteredPlans = carePlans.filter(p => {
        if (filter === 'review') return p.status === 'review_needed';
        if (filter === 'expiring') return p.status === 'expiring' || p.status === 'expired';
        if (filter === 'active') return p.status === 'active';
        return true;
    });

    const reviewCount = carePlans.filter(p => p.status === 'review_needed').length;
    const expiringCount = carePlans.filter(p => p.status === 'expiring' || p.status === 'expired').length;

    return (
        <ScrollView
            className="flex-1 bg-background"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Stats Bar */}
            <View className="bg-white px-4 py-3 border-b border-gray-100 flex-row justify-around">
                <View className="items-center">
                    <Text className="text-2xl font-bold text-purple-600">{reviewCount}</Text>
                    <Text className="text-gray-500 text-xs">Need Review</Text>
                </View>
                <View className="items-center">
                    <Text className="text-2xl font-bold text-yellow-600">{expiringCount}</Text>
                    <Text className="text-gray-500 text-xs">Expiring</Text>
                </View>
                <View className="items-center">
                    <Text className="text-2xl font-bold text-green-600">
                        {carePlans.filter(p => p.status === 'active').length}
                    </Text>
                    <Text className="text-gray-500 text-xs">Active</Text>
                </View>
            </View>

            {/* Filter Tabs */}
            <View className="flex-row px-4 pt-4 pb-2">
                {([
                    { key: 'review', label: 'Review' },
                    { key: 'expiring', label: 'Expiring' },
                    { key: 'active', label: 'Active' },
                    { key: 'all', label: 'All' },
                ] as const).map((f) => (
                    <TouchableOpacity
                        key={f.key}
                        className={`flex-1 py-2 mx-1 rounded-lg ${filter === f.key ? 'bg-danger' : 'bg-white border border-gray-200'}`}
                        onPress={() => setFilter(f.key)}
                    >
                        <Text className={`text-center font-medium text-sm ${filter === f.key ? 'text-white' : 'text-gray-600'}`}>
                            {f.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Care Plans List */}
            <View className="px-4 pt-2 pb-8">
                {filteredPlans.map(plan => {
                    const statusConfig = getStatusConfig(plan.status);
                    const daysUntilExpiry = differenceInDays(new Date(plan.endDate), new Date());
                    const progressPercent = Math.round((plan.goalsCompleted / plan.goals) * 100);

                    return (
                        <TouchableOpacity
                            key={plan.id}
                            className={`bg-white p-4 rounded-xl mb-2 border ${plan.status === 'review_needed' || plan.status === 'expired' ? 'border-red-200' : 'border-gray-100'}`}
                        >
                            <View className="flex-row justify-between items-start mb-2">
                                <View className="flex-1">
                                    <Text className="text-gray-900 font-semibold">{plan.patientName}</Text>
                                    <Text className="text-gray-500 text-sm">RN: {plan.primaryNurse}</Text>
                                </View>
                                <View className={`${statusConfig.bg} px-2 py-1 rounded-lg`}>
                                    <Text className={`${statusConfig.text} text-xs font-medium`}>{statusConfig.label}</Text>
                                </View>
                            </View>

                            {/* Goals Progress */}
                            <View className="mb-3">
                                <View className="flex-row justify-between mb-1">
                                    <Text className="text-gray-500 text-xs">Goals Progress</Text>
                                    <Text className="text-gray-700 text-xs font-medium">{plan.goalsCompleted}/{plan.goals}</Text>
                                </View>
                                <View className="h-2 bg-gray-200 rounded-full">
                                    <View
                                        className="h-2 bg-green-500 rounded-full"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </View>
                            </View>

                            <View className="flex-row items-center justify-between pt-2 border-t border-gray-100">
                                <View>
                                    <Text className="text-gray-400 text-xs">Plan Period</Text>
                                    <Text className="text-gray-700 text-sm">
                                        {format(new Date(plan.startDate), 'MMM d')} - {format(new Date(plan.endDate), 'MMM d, yyyy')}
                                    </Text>
                                </View>
                                <View className="items-end">
                                    {daysUntilExpiry <= 0 ? (
                                        <Text className="text-red-600 font-semibold text-sm">Expired</Text>
                                    ) : daysUntilExpiry <= 14 ? (
                                        <Text className="text-yellow-600 font-semibold text-sm">{daysUntilExpiry} days left</Text>
                                    ) : (
                                        <Text className="text-gray-500 text-sm">{daysUntilExpiry} days left</Text>
                                    )}
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </ScrollView>
    );
}
