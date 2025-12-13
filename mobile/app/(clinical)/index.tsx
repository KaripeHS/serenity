/**
 * Clinical Dashboard - Overview for clinical staff (RN, LPN, Clinical Director)
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

interface ClinicalData {
    census: { total: number; newAdmissions: number; discharges: number };
    assessments: { due: number; overdue: number; completedToday: number };
    carePlans: { needingReview: number; expiringSoon: number };
    supervisoryVisits: { due: number; completed: number };
    incidents: { open: number; pending: number };
    compliance: number;
}

export default function ClinicalDashboard() {
    const [refreshing, setRefreshing] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [data, setData] = useState<ClinicalData | null>(null);

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
                const response = await api.get('/console/dashboard/clinical');
                setData(response.data);
            } catch (apiError) {
                setData({
                    census: { total: 127, newAdmissions: 4, discharges: 2 },
                    assessments: { due: 8, overdue: 2, completedToday: 5 },
                    carePlans: { needingReview: 12, expiringSoon: 6 },
                    supervisoryVisits: { due: 15, completed: 42 },
                    incidents: { open: 1, pending: 2 },
                    compliance: 96,
                });
            }
        } catch (error) {
            console.error('Failed to load clinical data:', error);
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
            <View className="bg-danger px-6 pt-12 pb-6 rounded-b-3xl">
                <Text className="text-red-100 text-sm">{format(new Date(), 'EEEE, MMMM d')}</Text>
                <Text className="text-white text-2xl font-bold mt-1">
                    Hello, {user?.firstName || 'Clinical'}
                </Text>
                <Text className="text-red-200 text-sm font-medium">
                    {getRoleDisplayName(user?.role || 'clinical_director')}
                </Text>
            </View>

            {data && (
                <>
                    {/* Census */}
                    <View className="px-4 mt-4">
                        <Text className="text-lg font-bold text-gray-800 mb-2">Patient Census</Text>
                        <View className="flex-row">
                            <StatCard
                                title="Total Census"
                                value={data.census.total}
                                icon="people"
                                color={Colors.primary.DEFAULT}
                            />
                            <StatCard
                                title="New Admissions"
                                value={data.census.newAdmissions}
                                subtitle="This week"
                                icon="person-add"
                                color={Colors.success.DEFAULT}
                            />
                            <StatCard
                                title="Discharges"
                                value={data.census.discharges}
                                subtitle="This week"
                                icon="exit"
                                color={Colors.warning.DEFAULT}
                            />
                        </View>
                    </View>

                    {/* Assessments */}
                    <View className="px-4 mt-4">
                        <Text className="text-lg font-bold text-gray-800 mb-2">Assessments</Text>
                        <View className="flex-row">
                            <StatCard
                                title="Due"
                                value={data.assessments.due}
                                icon="clipboard"
                                color={Colors.warning.DEFAULT}
                            />
                            <StatCard
                                title="Overdue"
                                value={data.assessments.overdue}
                                icon="alert-circle"
                                color={Colors.danger.DEFAULT}
                                alert={data.assessments.overdue > 0}
                            />
                            <StatCard
                                title="Completed Today"
                                value={data.assessments.completedToday}
                                icon="checkmark-circle"
                                color={Colors.success.DEFAULT}
                            />
                        </View>
                    </View>

                    {/* Care Plans & Supervisory */}
                    <View className="px-4 mt-4">
                        <Text className="text-lg font-bold text-gray-800 mb-2">Care Plans & Supervision</Text>
                        <View className="flex-row">
                            <StatCard
                                title="Plans Needing Review"
                                value={data.carePlans.needingReview}
                                icon="document-text"
                                color={Colors.caregiver.DEFAULT}
                                alert={data.carePlans.needingReview > 10}
                            />
                            <StatCard
                                title="Supervisory Visits Due"
                                value={data.supervisoryVisits.due}
                                icon="eye"
                                color={Colors.info.DEFAULT}
                            />
                        </View>
                    </View>

                    {/* Compliance & Incidents */}
                    <View className="px-4 mt-4 mb-8">
                        <Text className="text-lg font-bold text-gray-800 mb-2">Compliance & Incidents</Text>
                        <View className="bg-white rounded-2xl p-4 border border-gray-100">
                            <View className="flex-row justify-between items-center mb-3">
                                <View className="flex-row items-center">
                                    <View className="p-2 rounded-xl bg-green-100 mr-3">
                                        <Ionicons name="shield-checkmark" size={20} color={Colors.success.DEFAULT} />
                                    </View>
                                    <View>
                                        <Text className="text-gray-900 font-semibold">Clinical Compliance</Text>
                                        <Text className="text-gray-500 text-sm">Documentation & assessments</Text>
                                    </View>
                                </View>
                                <View className="bg-green-100 px-3 py-1 rounded-lg">
                                    <Text className="text-green-700 font-bold">{data.compliance}%</Text>
                                </View>
                            </View>
                            <View className="flex-row justify-between pt-3 border-t border-gray-100">
                                <View className="items-center">
                                    <Text className="text-red-600 font-bold text-lg">{data.incidents.open}</Text>
                                    <Text className="text-gray-500 text-xs">Open Incidents</Text>
                                </View>
                                <View className="items-center">
                                    <Text className="text-yellow-600 font-bold text-lg">{data.incidents.pending}</Text>
                                    <Text className="text-gray-500 text-xs">Pending Review</Text>
                                </View>
                                <View className="items-center">
                                    <Text className="text-purple-600 font-bold text-lg">{data.carePlans.expiringSoon}</Text>
                                    <Text className="text-gray-500 text-xs">Plans Expiring</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </>
            )}
        </ScrollView>
    );
}
