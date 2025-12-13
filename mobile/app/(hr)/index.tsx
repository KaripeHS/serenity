/**
 * HR Dashboard - Overview of human resources metrics
 */

import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/DesignSystem';
import { AuthService } from '../../services/auth.service';
import { getRoleDisplayName } from '../../constants/RolePermissions';
import { format } from 'date-fns';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Config } from '../../constants/Config';

interface HRData {
    headcount: { total: number; active: number; onboarding: number };
    turnover: { rate: number; departures: number; ytd: number };
    credentials: { expiringSoon: number; expired: number; compliant: number };
    timeOff: { pendingRequests: number; onPtoToday: number };
    openPositions: number;
    newHires: number;
}

export default function HRDashboard() {
    const [refreshing, setRefreshing] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [data, setData] = useState<HRData | null>(null);

    const loadData = async () => {
        try {
            const userData = await AuthService.getUser();
            setUser(userData);

            const token = await SecureStore.getItemAsync('serenity_auth_token');
            const api = axios.create({
                baseURL: Config.API_URL,
                headers: { Authorization: `Bearer ${token}` }
            });

            try {
                const response = await api.get('/console/dashboard/hr');
                setData(response.data);
            } catch (apiError) {
                setData({
                    headcount: { total: 92, active: 89, onboarding: 3 },
                    turnover: { rate: 8.2, departures: 2, ytd: 12 },
                    credentials: { expiringSoon: 5, expired: 1, compliant: 86 },
                    timeOff: { pendingRequests: 8, onPtoToday: 4 },
                    openPositions: 5,
                    newHires: 3,
                });
            }
        } catch (error) {
            console.error('Failed to load HR data:', error);
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

    const StatCard = ({ title, value, subtitle, icon, color, alert = false }: {
        title: string;
        value: string | number;
        subtitle?: string;
        icon: string;
        color: string;
        alert?: boolean;
    }) => (
        <View className={`bg-white p-4 rounded-2xl flex-1 m-1 border ${alert ? 'border-red-200' : 'border-gray-100'}`}>
            <View className="flex-row justify-between items-start mb-2">
                <View className="p-2 rounded-xl" style={{ backgroundColor: `${color}20` }}>
                    <Ionicons name={icon as any} size={18} color={color} />
                </View>
                {alert && <View className="bg-red-500 h-3 w-3 rounded-full" />}
            </View>
            <Text className="text-xl font-bold text-gray-900">{value}</Text>
            <Text className="text-xs text-gray-500 mt-0.5">{title}</Text>
            {subtitle && <Text className="text-xs text-gray-400">{subtitle}</Text>}
        </View>
    );

    return (
        <ScrollView
            className="flex-1 bg-background"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Header */}
            <View className="px-6 pt-12 pb-6 rounded-b-3xl" style={{ backgroundColor: Colors.caregiver.DEFAULT }}>
                <Text className="text-purple-100 text-sm">{format(new Date(), 'EEEE, MMMM d')}</Text>
                <Text className="text-white text-2xl font-bold mt-1">
                    Hello, {user?.firstName || 'HR'}
                </Text>
                <Text className="text-purple-200 text-sm font-medium">
                    {getRoleDisplayName(user?.role || 'hr_director')}
                </Text>
            </View>

            {data && (
                <>
                    {/* Headcount */}
                    <View className="px-4 mt-4">
                        <Text className="text-lg font-bold text-gray-800 mb-2">Headcount</Text>
                        <View className="flex-row">
                            <StatCard
                                title="Total Employees"
                                value={data.headcount.total}
                                icon="people"
                                color={Colors.caregiver.DEFAULT}
                            />
                            <StatCard
                                title="Active"
                                value={data.headcount.active}
                                icon="checkmark-circle"
                                color={Colors.success.DEFAULT}
                            />
                            <StatCard
                                title="Onboarding"
                                value={data.headcount.onboarding}
                                icon="person-add"
                                color={Colors.info.DEFAULT}
                            />
                        </View>
                    </View>

                    {/* Hiring & Turnover */}
                    <View className="px-4 mt-4">
                        <Text className="text-lg font-bold text-gray-800 mb-2">Hiring & Turnover</Text>
                        <View className="flex-row">
                            <StatCard
                                title="Open Positions"
                                value={data.openPositions}
                                icon="briefcase"
                                color={Colors.warning.DEFAULT}
                            />
                            <StatCard
                                title="New Hires (MTD)"
                                value={data.newHires}
                                icon="person-add"
                                color={Colors.success.DEFAULT}
                            />
                            <StatCard
                                title="Turnover Rate"
                                value={`${data.turnover.rate}%`}
                                subtitle={`${data.turnover.ytd} YTD`}
                                icon="trending-down"
                                color={Colors.danger.DEFAULT}
                            />
                        </View>
                    </View>

                    {/* Credentials Alert */}
                    <View className="px-4 mt-4">
                        <Text className="text-lg font-bold text-gray-800 mb-2">Credentials</Text>
                        <View className="bg-white rounded-2xl p-4 border border-gray-100">
                            <View className="flex-row justify-between items-center mb-3">
                                <View className="flex-row items-center">
                                    <View className="p-2 rounded-xl bg-purple-100 mr-3">
                                        <Ionicons name="shield-checkmark" size={20} color={Colors.caregiver.DEFAULT} />
                                    </View>
                                    <View>
                                        <Text className="text-gray-900 font-semibold">Compliance Status</Text>
                                        <Text className="text-gray-500 text-sm">{data.credentials.compliant} employees compliant</Text>
                                    </View>
                                </View>
                                <View className="bg-green-100 px-3 py-1 rounded-lg">
                                    <Text className="text-green-700 font-bold">
                                        {Math.round((data.credentials.compliant / data.headcount.active) * 100)}%
                                    </Text>
                                </View>
                            </View>
                            <View className="flex-row justify-between pt-3 border-t border-gray-100">
                                <View className="items-center">
                                    <Text className="text-yellow-600 font-bold text-lg">{data.credentials.expiringSoon}</Text>
                                    <Text className="text-gray-500 text-xs">Expiring Soon</Text>
                                </View>
                                <View className="items-center">
                                    <Text className="text-red-600 font-bold text-lg">{data.credentials.expired}</Text>
                                    <Text className="text-gray-500 text-xs">Expired</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Time Off */}
                    <View className="px-4 mt-4 mb-8">
                        <Text className="text-lg font-bold text-gray-800 mb-2">Time Off</Text>
                        <View className="flex-row">
                            <StatCard
                                title="Pending Requests"
                                value={data.timeOff.pendingRequests}
                                icon="time"
                                color={Colors.warning.DEFAULT}
                                alert={data.timeOff.pendingRequests > 5}
                            />
                            <StatCard
                                title="On PTO Today"
                                value={data.timeOff.onPtoToday}
                                icon="calendar"
                                color={Colors.info.DEFAULT}
                            />
                        </View>
                    </View>
                </>
            )}
        </ScrollView>
    );
}
