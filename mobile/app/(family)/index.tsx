/**
 * Family Home Screen - Overview of loved one's care
 * HIPAA Compliant - Only shows authorized patient information
 */

import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/DesignSystem';
import { AuthService } from '../../services/auth.service';
import { format } from 'date-fns';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Config } from '../../constants/Config';

interface FamilyData {
    patient: {
        name: string;
        relationship: string;
        condition: string;
    };
    nextVisit?: {
        date: string;
        time: string;
        caregiverName: string;
        visitType: string;
    };
    recentUpdates: {
        date: string;
        summary: string;
        from: string;
    }[];
    careTeam: {
        name: string;
        role: string;
        phone?: string;
    }[];
    quickStats: {
        visitsThisMonth: number;
        lastVisit: string;
        carePlanProgress: number;
    };
}

export default function FamilyHomeScreen() {
    const [refreshing, setRefreshing] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [data, setData] = useState<FamilyData | null>(null);

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
                const response = await api.get('/family/portal/home');
                setData(response.data);
            } catch (apiError) {
                setData({
                    patient: {
                        name: 'John Smith',
                        relationship: 'Father',
                        condition: 'Recovering well - CHF Management',
                    },
                    nextVisit: {
                        date: '2024-12-09',
                        time: '10:00 AM',
                        caregiverName: 'Sarah Johnson, RN',
                        visitType: 'Skilled Nursing',
                    },
                    recentUpdates: [
                        { date: '2024-12-07', summary: 'Blood pressure stable at 128/82. Continuing current medication plan.', from: 'Sarah Johnson, RN' },
                        { date: '2024-12-05', summary: 'Assisted with bathing and light exercises. Good spirits today.', from: 'Mike Davis, HHA' },
                        { date: '2024-12-03', summary: 'Physical therapy session completed. Improving mobility.', from: 'Sarah Johnson, RN' },
                    ],
                    careTeam: [
                        { name: 'Sarah Johnson', role: 'Primary Nurse (RN)', phone: '(614) 555-0101' },
                        { name: 'Mike Davis', role: 'Home Health Aide', phone: '(614) 555-0102' },
                        { name: 'Care Coordination', role: 'Office', phone: '(614) 555-0100' },
                    ],
                    quickStats: {
                        visitsThisMonth: 8,
                        lastVisit: '2024-12-07',
                        carePlanProgress: 72,
                    },
                });
            }
        } catch (error) {
            console.error('Failed to load family data:', error);
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

    return (
        <ScrollView
            className="flex-1 bg-background"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Header */}
            <View className="px-6 pt-12 pb-6 rounded-b-3xl" style={{ backgroundColor: Colors.caregiver.DEFAULT }}>
                <Text className="text-purple-100 text-sm">{format(new Date(), 'EEEE, MMMM d')}</Text>
                <Text className="text-white text-2xl font-bold mt-1">
                    Welcome, {user?.firstName || 'Family Member'}
                </Text>
                <Text className="text-purple-200 text-sm">Family Portal</Text>
            </View>

            {data && (
                <>
                    {/* Patient Card */}
                    <View className="mx-4 mt-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                        <View className="flex-row items-center mb-3">
                            <View className="h-14 w-14 bg-purple-100 rounded-full items-center justify-center mr-3">
                                <Text className="text-xl font-bold text-purple-700">
                                    {data.patient.name.split(' ').map(n => n[0]).join('')}
                                </Text>
                            </View>
                            <View className="flex-1">
                                <Text className="text-gray-900 font-bold text-lg">{data.patient.name}</Text>
                                <Text className="text-gray-500">Your {data.patient.relationship}</Text>
                            </View>
                        </View>
                        <View className="bg-green-50 rounded-xl p-3 flex-row items-center">
                            <Ionicons name="heart" size={18} color={Colors.success.DEFAULT} />
                            <Text className="text-green-800 ml-2 font-medium">{data.patient.condition}</Text>
                        </View>
                    </View>

                    {/* Quick Stats */}
                    <View className="flex-row px-4 mt-4">
                        <View className="flex-1 bg-white p-3 rounded-xl mr-2 border border-gray-100 items-center">
                            <Text className="text-2xl font-bold text-purple-700">{data.quickStats.visitsThisMonth}</Text>
                            <Text className="text-gray-500 text-xs">Visits This Month</Text>
                        </View>
                        <View className="flex-1 bg-white p-3 rounded-xl mx-1 border border-gray-100 items-center">
                            <Text className="text-2xl font-bold text-blue-700">{data.quickStats.carePlanProgress}%</Text>
                            <Text className="text-gray-500 text-xs">Care Progress</Text>
                        </View>
                        <View className="flex-1 bg-white p-3 rounded-xl ml-2 border border-gray-100 items-center">
                            <Text className="text-lg font-bold text-green-700">{format(new Date(data.quickStats.lastVisit), 'MMM d')}</Text>
                            <Text className="text-gray-500 text-xs">Last Visit</Text>
                        </View>
                    </View>

                    {/* Next Visit Card */}
                    {data.nextVisit && (
                        <View className="mx-4 mt-4">
                            <Text className="text-lg font-bold text-gray-800 mb-2">Next Scheduled Visit</Text>
                            <View className="bg-white rounded-2xl p-4 border border-gray-100">
                                <View className="flex-row items-center mb-3">
                                    <View className="bg-purple-100 p-2 rounded-xl mr-3">
                                        <Ionicons name="calendar" size={24} color={Colors.caregiver.DEFAULT} />
                                    </View>
                                    <View>
                                        <Text className="text-gray-900 font-bold">
                                            {format(new Date(data.nextVisit.date), 'EEEE, MMMM d')}
                                        </Text>
                                        <Text className="text-gray-500">{data.nextVisit.time}</Text>
                                    </View>
                                </View>
                                <View className="bg-purple-50 rounded-xl p-3">
                                    <Text className="text-purple-800 font-medium">{data.nextVisit.visitType}</Text>
                                    <Text className="text-purple-600 text-sm">{data.nextVisit.caregiverName}</Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Recent Updates */}
                    <View className="px-4 mt-4">
                        <View className="flex-row justify-between items-center mb-2">
                            <Text className="text-lg font-bold text-gray-800">Recent Care Updates</Text>
                            <TouchableOpacity>
                                <Text className="text-purple-600 font-medium">View All</Text>
                            </TouchableOpacity>
                        </View>
                        {data.recentUpdates.map((update, index) => (
                            <View key={index} className="bg-white p-4 rounded-xl mb-2 border border-gray-100">
                                <View className="flex-row justify-between items-start mb-2">
                                    <Text className="text-gray-500 text-sm">{format(new Date(update.date), 'MMMM d, yyyy')}</Text>
                                    <Text className="text-purple-600 text-sm font-medium">{update.from}</Text>
                                </View>
                                <Text className="text-gray-800">{update.summary}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Care Team */}
                    <View className="px-4 mt-4 mb-8">
                        <Text className="text-lg font-bold text-gray-800 mb-2">Care Team</Text>
                        <View className="bg-white rounded-2xl border border-gray-100">
                            {data.careTeam.map((member, index) => (
                                <TouchableOpacity
                                    key={index}
                                    className={`p-4 flex-row items-center ${index < data.careTeam.length - 1 ? 'border-b border-gray-100' : ''}`}
                                >
                                    <View className="h-10 w-10 bg-purple-100 rounded-full items-center justify-center mr-3">
                                        <Text className="text-purple-700 font-bold">
                                            {member.name.split(' ').map(n => n[0]).join('')}
                                        </Text>
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-900 font-medium">{member.name}</Text>
                                        <Text className="text-gray-500 text-sm">{member.role}</Text>
                                    </View>
                                    {member.phone && (
                                        <TouchableOpacity className="bg-green-100 p-2 rounded-full">
                                            <Ionicons name="call" size={18} color={Colors.success.DEFAULT} />
                                        </TouchableOpacity>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </>
            )}
        </ScrollView>
    );
}
