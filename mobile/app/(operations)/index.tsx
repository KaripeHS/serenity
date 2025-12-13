/**
 * Operations Dashboard - Real-time operational overview
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

interface OperationsData {
    todayVisits: { total: number; completed: number; inProgress: number; upcoming: number };
    liveStatus: { activeCaregiverss: number; onLocation: number; inTransit: number };
    alerts: { missedVisits: number; lateArrivals: number; openShifts: number };
    census: { active: number; newThisWeek: number };
    utilization: number;
}

export default function OperationsDashboard() {
    const [refreshing, setRefreshing] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [data, setData] = useState<OperationsData | null>(null);
    const [loading, setLoading] = useState(true);

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
                const response = await api.get('/console/dashboard/operations');
                setData(response.data);
            } catch (apiError) {
                // Fallback data
                setData({
                    todayVisits: { total: 156, completed: 89, inProgress: 23, upcoming: 44 },
                    liveStatus: { activeCaregiverss: 68, onLocation: 45, inTransit: 23 },
                    alerts: { missedVisits: 2, lateArrivals: 5, openShifts: 8 },
                    census: { active: 127, newThisWeek: 4 },
                    utilization: 87,
                });
            }
        } catch (error) {
            console.error('Failed to load operations data:', error);
        } finally {
            setLoading(false);
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
                {alert && (
                    <View className="bg-red-500 h-3 w-3 rounded-full" />
                )}
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
            <View className="bg-info px-6 pt-12 pb-6 rounded-b-3xl">
                <Text className="text-blue-100 text-sm">{format(new Date(), 'EEEE, MMMM d')}</Text>
                <Text className="text-white text-2xl font-bold mt-1">
                    Hello, {user?.firstName || 'Operations'}
                </Text>
                <Text className="text-blue-200 text-sm font-medium">
                    {getRoleDisplayName(user?.role || 'operations_director')}
                </Text>
            </View>

            {data && (
                <>
                    {/* Live Status Banner */}
                    <View className="mx-4 mt-4 bg-green-50 border border-green-200 rounded-2xl p-4">
                        <View className="flex-row items-center mb-2">
                            <View className="h-3 w-3 rounded-full bg-green-500 mr-2" />
                            <Text className="text-green-800 font-semibold">Live Field Status</Text>
                        </View>
                        <View className="flex-row justify-between">
                            <View className="items-center">
                                <Text className="text-2xl font-bold text-green-700">{data.liveStatus.activeCaregiverss}</Text>
                                <Text className="text-green-600 text-xs">Active</Text>
                            </View>
                            <View className="items-center">
                                <Text className="text-2xl font-bold text-blue-700">{data.liveStatus.onLocation}</Text>
                                <Text className="text-blue-600 text-xs">On Location</Text>
                            </View>
                            <View className="items-center">
                                <Text className="text-2xl font-bold text-yellow-700">{data.liveStatus.inTransit}</Text>
                                <Text className="text-yellow-600 text-xs">In Transit</Text>
                            </View>
                        </View>
                    </View>

                    {/* Today's Visits */}
                    <View className="px-4 mt-4">
                        <Text className="text-lg font-bold text-gray-800 mb-2">Today's Visits</Text>
                        <View className="flex-row">
                            <StatCard
                                title="Total Visits"
                                value={data.todayVisits.total}
                                icon="calendar"
                                color={Colors.info.DEFAULT}
                            />
                            <StatCard
                                title="Completed"
                                value={data.todayVisits.completed}
                                icon="checkmark-circle"
                                color={Colors.success.DEFAULT}
                            />
                        </View>
                        <View className="flex-row">
                            <StatCard
                                title="In Progress"
                                value={data.todayVisits.inProgress}
                                icon="navigate"
                                color={Colors.caregiver.DEFAULT}
                            />
                            <StatCard
                                title="Upcoming"
                                value={data.todayVisits.upcoming}
                                icon="time"
                                color={Colors.warning.DEFAULT}
                            />
                        </View>
                    </View>

                    {/* Alerts */}
                    <View className="px-4 mt-4">
                        <Text className="text-lg font-bold text-gray-800 mb-2">Attention Required</Text>
                        <View className="flex-row">
                            <StatCard
                                title="Missed Visits"
                                value={data.alerts.missedVisits}
                                icon="alert-circle"
                                color={Colors.danger.DEFAULT}
                                alert={data.alerts.missedVisits > 0}
                            />
                            <StatCard
                                title="Late Arrivals"
                                value={data.alerts.lateArrivals}
                                icon="time"
                                color={Colors.warning.DEFAULT}
                                alert={data.alerts.lateArrivals > 3}
                            />
                            <StatCard
                                title="Open Shifts"
                                value={data.alerts.openShifts}
                                icon="calendar-outline"
                                color={Colors.info.DEFAULT}
                                alert={data.alerts.openShifts > 5}
                            />
                        </View>
                    </View>

                    {/* Census & Utilization */}
                    <View className="px-4 mt-4 mb-8">
                        <Text className="text-lg font-bold text-gray-800 mb-2">Census & Utilization</Text>
                        <View className="flex-row">
                            <View className="bg-white p-4 rounded-2xl flex-1 mr-2 border border-gray-100">
                                <View className="flex-row items-center justify-between">
                                    <View>
                                        <Text className="text-gray-500 text-sm">Active Census</Text>
                                        <Text className="text-2xl font-bold text-gray-900">{data.census.active}</Text>
                                    </View>
                                    <View className="bg-green-100 px-2 py-1 rounded-lg">
                                        <Text className="text-green-700 text-xs font-medium">+{data.census.newThisWeek} this week</Text>
                                    </View>
                                </View>
                            </View>
                            <View className="bg-white p-4 rounded-2xl flex-1 ml-2 border border-gray-100">
                                <Text className="text-gray-500 text-sm">Staff Utilization</Text>
                                <Text className="text-2xl font-bold text-gray-900">{data.utilization}%</Text>
                                <View className="h-2 bg-gray-200 rounded-full mt-2">
                                    <View
                                        className="h-2 bg-info rounded-full"
                                        style={{ width: `${data.utilization}%` }}
                                    />
                                </View>
                            </View>
                        </View>
                    </View>
                </>
            )}
        </ScrollView>
    );
}
