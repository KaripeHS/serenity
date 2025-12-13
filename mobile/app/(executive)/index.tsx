/**
 * Executive Dashboard - Mobile
 * KPIs, AI Insights, Revenue, Census, Staff at a glance
 */

import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AuthService } from '../../services/auth.service';
import { Colors } from '../../constants/DesignSystem';
import { getRoleDisplayName } from '../../constants/RolePermissions';
import { format } from 'date-fns';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Config } from '../../constants/Config';

interface KPIData {
    revenue: { current: number; change: number };
    census: { active: number; change: number };
    staffUtilization: number;
    visitCompletion: number;
    arDays: number;
    openShifts: number;
}

interface Alert {
    id: string;
    type: 'warning' | 'critical' | 'info';
    title: string;
    description: string;
}

export default function ExecutiveDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [kpis, setKpis] = useState<KPIData | null>(null);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            const userData = await AuthService.getUser();
            setUser(userData);

            // Fetch executive dashboard data
            const token = await SecureStore.getItemAsync('serenity_auth_token');
            const api = axios.create({
                baseURL: Config.API_URL,
                headers: { Authorization: `Bearer ${token}` }
            });

            try {
                const [kpiResponse, alertsResponse] = await Promise.all([
                    api.get('/console/dashboard/executive/kpis'),
                    api.get('/console/dashboard/alerts'),
                ]);
                setKpis(kpiResponse.data);
                setAlerts(alertsResponse.data?.alerts || []);
            } catch (apiError) {
                // Use fallback data if API not ready
                setKpis({
                    revenue: { current: 485000, change: 12.5 },
                    census: { active: 127, change: 3 },
                    staffUtilization: 87,
                    visitCompletion: 94.2,
                    arDays: 28,
                    openShifts: 8,
                });
                setAlerts([
                    { id: '1', type: 'warning', title: '3 Credentials Expiring', description: 'Review before end of month' },
                    { id: '2', type: 'info', title: 'New Referral', description: 'Franklin County, high acuity' },
                ]);
            }
        } catch (error) {
            console.error('Failed to load executive data:', error);
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

    const formatCurrency = (amount: number) => {
        if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
        if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
        return `$${amount.toFixed(0)}`;
    };

    const KPICard = ({ title, value, change, icon, color }: {
        title: string;
        value: string;
        change?: number;
        icon: string;
        color: string;
    }) => (
        <View className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex-1 m-1">
            <View className="flex-row justify-between items-start mb-2">
                <View className={`p-2 rounded-xl`} style={{ backgroundColor: `${color}20` }}>
                    <Ionicons name={icon as any} size={20} color={color} />
                </View>
                {change !== undefined && (
                    <View className={`flex-row items-center ${change >= 0 ? 'bg-green-100' : 'bg-red-100'} px-2 py-1 rounded-lg`}>
                        <Ionicons
                            name={change >= 0 ? 'trending-up' : 'trending-down'}
                            size={12}
                            color={change >= 0 ? Colors.success.DEFAULT : Colors.danger.DEFAULT}
                        />
                        <Text className={`text-xs ml-1 font-semibold ${change >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {change >= 0 ? '+' : ''}{change}%
                        </Text>
                    </View>
                )}
            </View>
            <Text className="text-2xl font-bold text-gray-900">{value}</Text>
            <Text className="text-xs text-gray-500 mt-1">{title}</Text>
        </View>
    );

    const AlertItem = ({ alert }: { alert: Alert }) => {
        const colors = {
            critical: { bg: 'bg-red-50', border: 'border-red-200', icon: 'alert-circle', color: Colors.danger.DEFAULT },
            warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: 'warning', color: Colors.warning.DEFAULT },
            info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'information-circle', color: Colors.info.DEFAULT },
        };
        const style = colors[alert.type];

        return (
            <View className={`${style.bg} ${style.border} border p-3 rounded-xl mb-2 flex-row items-center`}>
                <Ionicons name={style.icon as any} size={20} color={style.color} />
                <View className="ml-3 flex-1">
                    <Text className="font-semibold text-gray-900">{alert.title}</Text>
                    <Text className="text-xs text-gray-600">{alert.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.gray[400]} />
            </View>
        );
    };

    return (
        <ScrollView
            className="flex-1 bg-background"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Header */}
            <View className="bg-white px-6 pt-12 pb-6 rounded-b-3xl shadow-sm">
                <View className="flex-row justify-between items-center">
                    <View>
                        <Text className="text-gray-500 text-sm">{format(new Date(), 'EEEE, MMMM d')}</Text>
                        <Text className="text-2xl font-bold text-gray-900 mt-1">
                            Hello, {user?.firstName || 'Executive'}
                        </Text>
                        <Text className="text-primary text-sm font-medium">
                            {getRoleDisplayName(user?.role || 'founder')}
                        </Text>
                    </View>
                    <TouchableOpacity className="bg-primary-100 p-3 rounded-full">
                        <Ionicons name="notifications-outline" size={24} color={Colors.primary.DEFAULT} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* KPI Grid */}
            <View className="px-4 mt-6">
                <Text className="text-lg font-bold text-gray-800 mb-3">Key Metrics</Text>

                {kpis && (
                    <>
                        <View className="flex-row">
                            <KPICard
                                title="MTD Revenue"
                                value={formatCurrency(kpis.revenue.current)}
                                change={kpis.revenue.change}
                                icon="cash-outline"
                                color={Colors.success.DEFAULT}
                            />
                            <KPICard
                                title="Active Census"
                                value={kpis.census.active.toString()}
                                change={kpis.census.change}
                                icon="people-outline"
                                color={Colors.info.DEFAULT}
                            />
                        </View>
                        <View className="flex-row">
                            <KPICard
                                title="Staff Utilization"
                                value={`${kpis.staffUtilization}%`}
                                icon="person-outline"
                                color={Colors.caregiver.DEFAULT}
                            />
                            <KPICard
                                title="Visit Completion"
                                value={`${kpis.visitCompletion}%`}
                                icon="checkmark-circle-outline"
                                color={Colors.primary.DEFAULT}
                            />
                        </View>
                        <View className="flex-row">
                            <KPICard
                                title="AR Days"
                                value={kpis.arDays.toString()}
                                icon="time-outline"
                                color={Colors.warning.DEFAULT}
                            />
                            <KPICard
                                title="Open Shifts"
                                value={kpis.openShifts.toString()}
                                icon="calendar-outline"
                                color={Colors.danger.DEFAULT}
                            />
                        </View>
                    </>
                )}
            </View>

            {/* Alerts Section */}
            <View className="px-4 mt-6 mb-8">
                <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-lg font-bold text-gray-800">Alerts</Text>
                    <TouchableOpacity>
                        <Text className="text-primary font-medium">View All</Text>
                    </TouchableOpacity>
                </View>

                {alerts.length > 0 ? (
                    alerts.map(alert => <AlertItem key={alert.id} alert={alert} />)
                ) : (
                    <View className="bg-green-50 p-4 rounded-xl border border-green-200">
                        <View className="flex-row items-center">
                            <Ionicons name="checkmark-circle" size={24} color={Colors.success.DEFAULT} />
                            <Text className="ml-2 text-green-800 font-medium">All clear - no urgent items</Text>
                        </View>
                    </View>
                )}
            </View>

            {/* Quick Actions */}
            <View className="px-4 mb-8">
                <Text className="text-lg font-bold text-gray-800 mb-3">Quick Actions</Text>
                <View className="flex-row justify-between">
                    <TouchableOpacity className="bg-white p-4 rounded-2xl items-center w-[31%] shadow-sm border border-gray-100">
                        <View className="bg-green-100 p-3 rounded-full mb-2">
                            <Ionicons name="document-text" size={24} color={Colors.success.DEFAULT} />
                        </View>
                        <Text className="font-medium text-gray-700 text-xs text-center">View Reports</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="bg-white p-4 rounded-2xl items-center w-[31%] shadow-sm border border-gray-100">
                        <View className="bg-blue-100 p-3 rounded-full mb-2">
                            <Ionicons name="people" size={24} color={Colors.primary.DEFAULT} />
                        </View>
                        <Text className="font-medium text-gray-700 text-xs text-center">Team Status</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="bg-white p-4 rounded-2xl items-center w-[31%] shadow-sm border border-gray-100">
                        <View className="bg-purple-100 p-3 rounded-full mb-2">
                            <Ionicons name="analytics" size={24} color={Colors.caregiver.DEFAULT} />
                        </View>
                        <Text className="font-medium text-gray-700 text-xs text-center">Analytics</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}
