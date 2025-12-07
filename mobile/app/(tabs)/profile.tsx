
import { View, Text, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Config } from '../../constants/Config';

interface CaregiverMetrics {
    overallScore: number; // 0-100
    tier: string; // 'Gold', 'Silver', 'Bronze'
    month: string;
}

interface CaregiverEarnings {
    estimatedEarnings: number;
    totalHours: number;
    month: string;
}

export default function ProfileScreen() {
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const [metrics, setMetrics] = useState<CaregiverMetrics | null>(null);
    const [earnings, setEarnings] = useState<CaregiverEarnings | null>(null);

    const fetchData = async () => {
        try {
            const token = await SecureStore.getItemAsync('serenity_auth_token');
            if (!token) return;

            const api = axios.create({
                baseURL: Config.API_URL,
                headers: { Authorization: `Bearer ${token}` }
            });

            // Parallel fetching
            const [metricsRes, earningsRes] = await Promise.all([
                // Mocking these calls for now as the backend routes exist but might fail auth in dev environment without proper seeding
                // In production line: api.get('/caregiver/me/metrics'),
                // In production line: api.get('/caregiver/me/earnings')
                // Simulating successful response for UI Verification
                Promise.resolve({ data: { overallScore: 94, tier: 'Gold', month: 'December' } }),
                Promise.resolve({ data: { estimatedEarnings: 1240.50, totalHours: 62, month: 'December' } })
            ]);

            setMetrics(metricsRes.data);
            setEarnings(earningsRes.data);

        } catch (error) {
            console.error('Failed to fetch profile stats', error);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData().finally(() => setRefreshing(false));
    }, []);

    // Initial load
    useState(() => {
        fetchData();
    });

    const handleLogout = async () => {
        await SecureStore.deleteItemAsync('serenity_auth_token');
        router.replace('/login');
    };

    return (
        <ScrollView
            className="flex-1 bg-gray-50"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <View className="bg-white pt-6 pb-6 items-center shadow-sm mb-4">
                <View className="h-24 w-24 bg-blue-100 rounded-full items-center justify-center mb-4">
                    <Text className="text-3xl font-bold text-blue-600">SM</Text>
                </View>
                <Text className="text-xl font-bold text-gray-900">Sarah Miller</Text>
                <Text className="text-gray-500 mb-4">Registered Nurse (RN)</Text>

                {/* Reliability Badge */}
                {metrics && (
                    <View className="bg-yellow-50 px-4 py-2 rounded-full border border-yellow-200 flex-row items-center">
                        <FontAwesome5 name="medal" size={14} color="#D97706" style={{ marginRight: 8 }} />
                        <Text className="text-yellow-800 font-bold">{metrics.tier} Member ({metrics.overallScore}%)</Text>
                    </View>
                )}
            </View>

            {/* Stats Grid */}
            <View className="flex-row px-4 mb-6 space-x-3">
                <View className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <Text className="text-gray-500 text-xs font-bold uppercase mb-1">Dec Earnings</Text>
                    <Text className="text-2xl font-bold text-green-700">
                        ${earnings?.estimatedEarnings?.toLocaleString() || '0.00'}
                    </Text>
                    <Text className="text-xs text-gray-400 mt-1">{earnings?.totalHours || 0} Hours</Text>
                </View>

                <View className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <Text className="text-gray-500 text-xs font-bold uppercase mb-1">Performance</Text>
                    <Text className="text-2xl font-bold text-blue-700">98%</Text>
                    <Text className="text-xs text-gray-400 mt-1">On-Time Arrival</Text>
                </View>
            </View>

            <View className="px-4 space-y-3 pb-8">
                <Text className="text-gray-500 font-bold ml-1 mb-1">SETTINGS</Text>

                <TouchableOpacity className="bg-white p-4 rounded-lg flex-row items-center shadow-sm">
                    <FontAwesome5 name="user-cog" size={20} color="#4B5563" style={{ width: 30 }} />
                    <Text className="flex-1 text-gray-800 font-medium">Account Settings</Text>
                    <FontAwesome5 name="chevron-right" size={16} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity className="bg-white p-4 rounded-lg flex-row items-center shadow-sm">
                    <FontAwesome5 name="bell" size={20} color="#4B5563" style={{ width: 30 }} />
                    <Text className="flex-1 text-gray-800 font-medium">Notifications</Text>
                    <FontAwesome5 name="chevron-right" size={16} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity className="bg-white p-4 rounded-lg flex-row items-center shadow-sm">
                    <FontAwesome5 name="file-contract" size={20} color="#4B5563" style={{ width: 30 }} />
                    <Text className="flex-1 text-gray-800 font-medium">My Documents</Text>
                    <FontAwesome5 name="chevron-right" size={16} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity
                    className="bg-white p-4 rounded-lg flex-row items-center shadow-sm mt-4 border-l-4 border-red-500"
                    onPress={handleLogout}
                >
                    <FontAwesome5 name="sign-out-alt" size={20} color="#DC2626" style={{ width: 30 }} />
                    <Text className="flex-1 text-red-600 font-medium">Sign Out</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}
