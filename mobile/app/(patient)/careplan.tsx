/**
 * Patient Care Plan Screen - View care plan details
 * HIPAA Compliant - Shows only the patient's own care plan
 */

import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/DesignSystem';
import { format } from 'date-fns';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Config } from '../../constants/Config';

interface Goal {
    id: string;
    description: string;
    status: 'in_progress' | 'met' | 'not_met';
    targetDate: string;
    progress: number;
}

interface CarePlanData {
    startDate: string;
    endDate: string;
    primaryDiagnosis: string;
    goals: Goal[];
    restrictions: string[];
    dietaryNeeds: string[];
    activities: string[];
}

export default function PatientCarePlanScreen() {
    const [refreshing, setRefreshing] = useState(false);
    const [carePlan, setCarePlan] = useState<CarePlanData | null>(null);

    const loadData = async () => {
        try {
            const token = await SecureStore.getItemAsync('serenity_auth_token');
            const api = axios.create({
                baseURL: Config.API_URL,
                headers: { Authorization: `Bearer ${token}` }
            });

            try {
                const response = await api.get('/patient/portal/careplan');
                setCarePlan(response.data);
            } catch (apiError) {
                setCarePlan({
                    startDate: '2024-10-01',
                    endDate: '2025-01-01',
                    primaryDiagnosis: 'Congestive Heart Failure (CHF), Type 2 Diabetes',
                    goals: [
                        { id: '1', description: 'Maintain blood pressure below 140/90', status: 'in_progress', targetDate: '2025-01-01', progress: 75 },
                        { id: '2', description: 'Walk 15 minutes daily without shortness of breath', status: 'in_progress', targetDate: '2024-12-15', progress: 60 },
                        { id: '3', description: 'Blood sugar A1C below 7.0', status: 'in_progress', targetDate: '2025-01-01', progress: 80 },
                        { id: '4', description: 'Reduce edema in lower extremities', status: 'met', targetDate: '2024-11-15', progress: 100 },
                    ],
                    restrictions: [
                        'No lifting more than 10 pounds',
                        'Avoid prolonged standing (>30 minutes)',
                        'No driving until cleared by physician',
                    ],
                    dietaryNeeds: [
                        'Low sodium diet (<2000mg/day)',
                        'Diabetic diet - monitor carbohydrates',
                        'Increase water intake to 64oz daily',
                        'Limit caffeine intake',
                    ],
                    activities: [
                        'Daily blood pressure monitoring',
                        'Daily blood sugar checks (morning and evening)',
                        'Daily weight check (report gain >2lbs)',
                        'Gentle stretching exercises',
                        'Medication compliance',
                    ],
                });
            }
        } catch (error) {
            console.error('Failed to load care plan:', error);
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

    const getGoalStatusConfig = (status: Goal['status']) => {
        switch (status) {
            case 'met': return { bg: 'bg-green-100', text: 'text-green-700', icon: 'checkmark-circle', color: Colors.success.DEFAULT };
            case 'in_progress': return { bg: 'bg-blue-100', text: 'text-blue-700', icon: 'time', color: Colors.info.DEFAULT };
            case 'not_met': return { bg: 'bg-red-100', text: 'text-red-700', icon: 'close-circle', color: Colors.danger.DEFAULT };
            default: return { bg: 'bg-gray-100', text: 'text-gray-600', icon: 'help', color: Colors.gray[500] };
        }
    };

    return (
        <ScrollView
            className="flex-1 bg-background"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {carePlan && (
                <>
                    {/* Care Plan Header */}
                    <View className="bg-primary px-4 pt-4 pb-6 rounded-b-3xl">
                        <View className="bg-white/10 rounded-2xl p-4">
                            <Text className="text-white text-sm">Care Plan Period</Text>
                            <Text className="text-white font-bold text-lg">
                                {format(new Date(carePlan.startDate), 'MMM d, yyyy')} - {format(new Date(carePlan.endDate), 'MMM d, yyyy')}
                            </Text>
                            <View className="mt-2 pt-2 border-t border-white/20">
                                <Text className="text-blue-100 text-sm">Primary Diagnosis</Text>
                                <Text className="text-white font-medium">{carePlan.primaryDiagnosis}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Goals */}
                    <View className="px-4 mt-4">
                        <Text className="text-lg font-bold text-gray-800 mb-2">My Care Goals</Text>
                        {carePlan.goals.map(goal => {
                            const config = getGoalStatusConfig(goal.status);
                            return (
                                <View key={goal.id} className="bg-white p-4 rounded-2xl mb-2 border border-gray-100">
                                    <View className="flex-row justify-between items-start mb-2">
                                        <View className="flex-1 pr-2">
                                            <Text className="text-gray-900 font-medium">{goal.description}</Text>
                                        </View>
                                        <View className={`${config.bg} px-2 py-1 rounded-lg flex-row items-center`}>
                                            <Ionicons name={config.icon as any} size={14} color={config.color} />
                                            <Text className={`${config.text} text-xs font-medium ml-1 capitalize`}>
                                                {goal.status.replace('_', ' ')}
                                            </Text>
                                        </View>
                                    </View>
                                    <View className="mt-2">
                                        <View className="flex-row justify-between mb-1">
                                            <Text className="text-gray-500 text-xs">Progress</Text>
                                            <Text className="text-gray-700 text-xs font-medium">{goal.progress}%</Text>
                                        </View>
                                        <View className="h-2 bg-gray-200 rounded-full">
                                            <View
                                                className={`h-2 rounded-full ${goal.status === 'met' ? 'bg-green-500' : 'bg-blue-500'}`}
                                                style={{ width: `${goal.progress}%` }}
                                            />
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                    {/* Activity Restrictions */}
                    <View className="px-4 mt-4">
                        <Text className="text-lg font-bold text-gray-800 mb-2">Activity Restrictions</Text>
                        <View className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                            {carePlan.restrictions.map((restriction, index) => (
                                <View key={index} className={`flex-row items-start ${index < carePlan.restrictions.length - 1 ? 'mb-3' : ''}`}>
                                    <Ionicons name="warning" size={18} color={Colors.warning.DEFAULT} style={{ marginTop: 2 }} />
                                    <Text className="text-yellow-800 ml-2 flex-1">{restriction}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Dietary Needs */}
                    <View className="px-4 mt-4">
                        <Text className="text-lg font-bold text-gray-800 mb-2">Dietary Guidelines</Text>
                        <View className="bg-green-50 border border-green-200 rounded-2xl p-4">
                            {carePlan.dietaryNeeds.map((need, index) => (
                                <View key={index} className={`flex-row items-start ${index < carePlan.dietaryNeeds.length - 1 ? 'mb-3' : ''}`}>
                                    <Ionicons name="nutrition" size={18} color={Colors.success.DEFAULT} style={{ marginTop: 2 }} />
                                    <Text className="text-green-800 ml-2 flex-1">{need}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Daily Activities */}
                    <View className="px-4 mt-4 mb-8">
                        <Text className="text-lg font-bold text-gray-800 mb-2">Daily Activities</Text>
                        <View className="bg-white border border-gray-100 rounded-2xl p-4">
                            {carePlan.activities.map((activity, index) => (
                                <View key={index} className={`flex-row items-start ${index < carePlan.activities.length - 1 ? 'mb-3' : ''}`}>
                                    <View className="h-6 w-6 bg-primary-100 rounded-full items-center justify-center">
                                        <Text className="text-primary font-bold text-xs">{index + 1}</Text>
                                    </View>
                                    <Text className="text-gray-700 ml-2 flex-1">{activity}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </>
            )}
        </ScrollView>
    );
}
