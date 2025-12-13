
import { View, Text, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { CaregiverService } from '../../services/caregiver.service';
import { AuthService } from '../../services/auth.service';

interface CaregiverMetrics {
    overallScore: number;
    tier: string;
    month: string;
    // Backend API matches this structure check
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
    const [user, setUser] = useState<any>(null);

    const fetchData = async () => {
        try {
            // Get User Info
            const currentUser = await AuthService.getUser();
            setUser(currentUser);

            // Parallel fetching of real data
            const [metricsData, earningsData] = await Promise.all([
                CaregiverService.getMetrics(),
                CaregiverService.getEarnings()
            ]);

            setMetrics(metricsData);
            setEarnings(earningsData);

        } catch (error) {
            console.error('Failed to fetch profile stats', error);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData().finally(() => setRefreshing(false));
    }, []);

    // Initial load
    useEffect(() => {
        fetchData();
    }, []);

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
                    <Text className="text-3xl font-bold text-blue-600">
                        {user?.firstName?.charAt(0) || user?.first_name?.charAt(0) || 'S'}
                        {user?.lastName?.charAt(0) || user?.last_name?.charAt(0) || 'M'}
                    </Text>
                </View>
                <Text className="text-xl font-bold text-gray-900">
                    {user ? `${user.firstName || user.first_name || ''} ${user.lastName || user.last_name || ''}`.trim() : 'Guest Caregiver'}
                </Text>
                <Text className="text-gray-500 mb-4">{user?.role || 'Caregiver'} ({user?.email || 'No Email'})</Text>

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

                <TouchableOpacity
                    className="bg-white p-4 rounded-lg flex-row items-center shadow-sm"
                    onPress={() => router.push('/settings/password')}
                >
                    <FontAwesome5 name="user-cog" size={20} color="#4B5563" style={{ width: 30 }} />
                    <Text className="flex-1 text-gray-800 font-medium">Account Settings (Change Password)</Text>
                    <FontAwesome5 name="chevron-right" size={16} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity
                    className="bg-white p-4 rounded-lg flex-row items-center shadow-sm"
                    onPress={() => router.push('/settings/notifications')}
                >
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
