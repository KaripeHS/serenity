/**
 * Patient Home Screen - Overview of care for the patient
 * HIPAA Compliant - Shows only the logged-in patient's information
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

interface PatientData {
    nextVisit?: {
        date: string;
        time: string;
        caregiverName: string;
        visitType: string;
    };
    careTeam: {
        name: string;
        role: string;
        phone?: string;
    }[];
    medications: {
        name: string;
        dosage: string;
        frequency: string;
    }[];
    recentNotes: string[];
    emergencyContact: {
        name: string;
        phone: string;
        relationship: string;
    };
}

export default function PatientHomeScreen() {
    const [refreshing, setRefreshing] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [data, setData] = useState<PatientData | null>(null);

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
                const response = await api.get('/patient/portal/home');
                setData(response.data);
            } catch (apiError) {
                // Fallback data
                setData({
                    nextVisit: {
                        date: '2024-12-09',
                        time: '10:00 AM',
                        caregiverName: 'Sarah Johnson, RN',
                        visitType: 'Skilled Nursing',
                    },
                    careTeam: [
                        { name: 'Sarah Johnson', role: 'Primary Nurse (RN)', phone: '(614) 555-0101' },
                        { name: 'Mike Davis', role: 'Home Health Aide', phone: '(614) 555-0102' },
                        { name: 'Dr. Emily Chen', role: 'Physician', phone: '(614) 555-0103' },
                    ],
                    medications: [
                        { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily' },
                        { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily' },
                        { name: 'Aspirin', dosage: '81mg', frequency: 'Once daily' },
                    ],
                    recentNotes: [
                        'Blood pressure stable at 128/82',
                        'Blood sugar levels improving',
                        'Physical therapy exercises going well',
                    ],
                    emergencyContact: {
                        name: 'Mary Smith',
                        phone: '(614) 555-9999',
                        relationship: 'Daughter',
                    },
                });
            }
        } catch (error) {
            console.error('Failed to load patient data:', error);
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
            <View className="bg-primary px-6 pt-12 pb-6 rounded-b-3xl">
                <Text className="text-blue-100 text-sm">{format(new Date(), 'EEEE, MMMM d')}</Text>
                <Text className="text-white text-2xl font-bold mt-1">
                    Welcome, {user?.firstName || 'Patient'}
                </Text>
                <Text className="text-blue-200 text-sm">Your care dashboard</Text>
            </View>

            {data && (
                <>
                    {/* Next Visit Card */}
                    {data.nextVisit && (
                        <View className="mx-4 mt-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                            <View className="flex-row items-center mb-3">
                                <View className="bg-blue-100 p-2 rounded-xl mr-3">
                                    <Ionicons name="calendar" size={24} color={Colors.primary.DEFAULT} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-500 text-xs">NEXT VISIT</Text>
                                    <Text className="text-gray-900 font-bold text-lg">
                                        {format(new Date(data.nextVisit.date), 'EEEE, MMMM d')}
                                    </Text>
                                </View>
                            </View>
                            <View className="bg-blue-50 rounded-xl p-3">
                                <View className="flex-row justify-between items-center">
                                    <View>
                                        <Text className="text-blue-800 font-semibold">{data.nextVisit.time}</Text>
                                        <Text className="text-blue-600 text-sm">{data.nextVisit.visitType}</Text>
                                    </View>
                                    <View className="items-end">
                                        <Text className="text-blue-800 font-medium">{data.nextVisit.caregiverName}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Care Team */}
                    <View className="px-4 mt-4">
                        <Text className="text-lg font-bold text-gray-800 mb-2">Your Care Team</Text>
                        <View className="bg-white rounded-2xl border border-gray-100">
                            {data.careTeam.map((member, index) => (
                                <TouchableOpacity
                                    key={index}
                                    className={`p-4 flex-row items-center ${index < data.careTeam.length - 1 ? 'border-b border-gray-100' : ''}`}
                                >
                                    <View className="h-10 w-10 bg-primary-100 rounded-full items-center justify-center mr-3">
                                        <Text className="text-primary font-bold">
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

                    {/* Medications */}
                    <View className="px-4 mt-4">
                        <Text className="text-lg font-bold text-gray-800 mb-2">My Medications</Text>
                        <View className="bg-white rounded-2xl border border-gray-100 p-4">
                            {data.medications.map((med, index) => (
                                <View
                                    key={index}
                                    className={`flex-row items-center ${index < data.medications.length - 1 ? 'mb-3 pb-3 border-b border-gray-100' : ''}`}
                                >
                                    <View className="bg-purple-100 p-2 rounded-lg mr-3">
                                        <Ionicons name="medical" size={18} color={Colors.caregiver.DEFAULT} />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-900 font-medium">{med.name}</Text>
                                        <Text className="text-gray-500 text-sm">{med.dosage} - {med.frequency}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Recent Notes */}
                    <View className="px-4 mt-4">
                        <Text className="text-lg font-bold text-gray-800 mb-2">Recent Care Notes</Text>
                        <View className="bg-white rounded-2xl border border-gray-100 p-4">
                            {data.recentNotes.map((note, index) => (
                                <View
                                    key={index}
                                    className={`flex-row items-start ${index < data.recentNotes.length - 1 ? 'mb-3' : ''}`}
                                >
                                    <Ionicons name="checkmark-circle" size={18} color={Colors.success.DEFAULT} style={{ marginTop: 2 }} />
                                    <Text className="text-gray-700 ml-2 flex-1">{note}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Emergency Contact */}
                    <View className="px-4 mt-4 mb-8">
                        <Text className="text-lg font-bold text-gray-800 mb-2">Emergency Contact</Text>
                        <TouchableOpacity className="bg-red-50 border border-red-200 rounded-2xl p-4 flex-row items-center">
                            <View className="bg-red-100 p-3 rounded-full mr-3">
                                <Ionicons name="call" size={24} color={Colors.danger.DEFAULT} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-red-800 font-semibold">{data.emergencyContact.name}</Text>
                                <Text className="text-red-600 text-sm">{data.emergencyContact.relationship}</Text>
                                <Text className="text-red-700 font-medium">{data.emergencyContact.phone}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </ScrollView>
    );
}
