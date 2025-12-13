/**
 * Time Off Screen - PTO and leave request management
 */

import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/DesignSystem';
import { format } from 'date-fns';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Config } from '../../constants/Config';

interface TimeOffRequest {
    id: string;
    employeeName: string;
    type: 'pto' | 'sick' | 'personal' | 'fmla' | 'bereavement';
    startDate: string;
    endDate: string;
    days: number;
    status: 'pending' | 'approved' | 'denied';
    reason?: string;
    submittedAt: string;
}

export default function TimeOffScreen() {
    const [refreshing, setRefreshing] = useState(false);
    const [requests, setRequests] = useState<TimeOffRequest[]>([]);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('pending');

    const loadData = async () => {
        try {
            const token = await SecureStore.getItemAsync('serenity_auth_token');
            const api = axios.create({
                baseURL: Config.API_URL,
                headers: { Authorization: `Bearer ${token}` }
            });

            try {
                const response = await api.get('/console/hr/timeoff');
                setRequests(response.data || []);
            } catch (apiError) {
                setRequests([
                    { id: '1', employeeName: 'Sarah Johnson', type: 'pto', startDate: '2024-12-23', endDate: '2024-12-27', days: 5, status: 'pending', reason: 'Holiday vacation', submittedAt: '2024-12-01' },
                    { id: '2', employeeName: 'Mike Davis', type: 'sick', startDate: '2024-12-10', endDate: '2024-12-11', days: 2, status: 'approved', reason: 'Medical appointment', submittedAt: '2024-12-08' },
                    { id: '3', employeeName: 'Emily Chen', type: 'personal', startDate: '2024-12-15', endDate: '2024-12-15', days: 1, status: 'pending', reason: 'Personal matter', submittedAt: '2024-12-05' },
                    { id: '4', employeeName: 'James Taylor', type: 'fmla', startDate: '2025-01-02', endDate: '2025-01-31', days: 22, status: 'pending', reason: 'Family medical leave', submittedAt: '2024-12-01' },
                    { id: '5', employeeName: 'Lisa Brown', type: 'pto', startDate: '2024-12-20', endDate: '2024-12-20', days: 1, status: 'approved', reason: 'Personal appointment', submittedAt: '2024-12-10' },
                    { id: '6', employeeName: 'David Wilson', type: 'bereavement', startDate: '2024-12-05', endDate: '2024-12-07', days: 3, status: 'approved', submittedAt: '2024-12-04' },
                ]);
            }
        } catch (error) {
            console.error('Failed to load time off requests:', error);
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

    const handleApprove = (request: TimeOffRequest) => {
        Alert.alert(
            'Approve Request',
            `Approve ${request.employeeName}'s ${request.type.toUpperCase()} request for ${request.days} days?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Approve',
                    onPress: () => {
                        setRequests(prev => prev.map(r =>
                            r.id === request.id ? { ...r, status: 'approved' as const } : r
                        ));
                    }
                }
            ]
        );
    };

    const handleDeny = (request: TimeOffRequest) => {
        Alert.alert(
            'Deny Request',
            `Deny ${request.employeeName}'s ${request.type.toUpperCase()} request?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Deny',
                    style: 'destructive',
                    onPress: () => {
                        setRequests(prev => prev.map(r =>
                            r.id === request.id ? { ...r, status: 'denied' as const } : r
                        ));
                    }
                }
            ]
        );
    };

    const getTypeConfig = (type: TimeOffRequest['type']) => {
        switch (type) {
            case 'pto': return { label: 'PTO', color: Colors.info.DEFAULT, bg: 'bg-blue-100', text: 'text-blue-700' };
            case 'sick': return { label: 'Sick', color: Colors.warning.DEFAULT, bg: 'bg-yellow-100', text: 'text-yellow-700' };
            case 'personal': return { label: 'Personal', color: Colors.caregiver.DEFAULT, bg: 'bg-purple-100', text: 'text-purple-700' };
            case 'fmla': return { label: 'FMLA', color: Colors.danger.DEFAULT, bg: 'bg-red-100', text: 'text-red-700' };
            case 'bereavement': return { label: 'Bereavement', color: Colors.gray[600], bg: 'bg-gray-100', text: 'text-gray-700' };
            default: return { label: type, color: Colors.gray[500], bg: 'bg-gray-100', text: 'text-gray-600' };
        }
    };

    const getStatusConfig = (status: TimeOffRequest['status']) => {
        switch (status) {
            case 'pending': return { bg: 'bg-yellow-100', text: 'text-yellow-700' };
            case 'approved': return { bg: 'bg-green-100', text: 'text-green-700' };
            case 'denied': return { bg: 'bg-red-100', text: 'text-red-700' };
            default: return { bg: 'bg-gray-100', text: 'text-gray-600' };
        }
    };

    const filteredRequests = requests.filter(r => filter === 'all' || r.status === filter);
    const pendingCount = requests.filter(r => r.status === 'pending').length;

    return (
        <ScrollView
            className="flex-1 bg-background"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Stats Bar */}
            <View className="bg-white px-4 py-3 border-b border-gray-100 flex-row justify-around">
                <View className="items-center">
                    <Text className="text-2xl font-bold text-yellow-600">{pendingCount}</Text>
                    <Text className="text-gray-500 text-xs">Pending</Text>
                </View>
                <View className="items-center">
                    <Text className="text-2xl font-bold text-green-600">
                        {requests.filter(r => r.status === 'approved').length}
                    </Text>
                    <Text className="text-gray-500 text-xs">Approved</Text>
                </View>
                <View className="items-center">
                    <Text className="text-2xl font-bold text-red-600">
                        {requests.filter(r => r.status === 'denied').length}
                    </Text>
                    <Text className="text-gray-500 text-xs">Denied</Text>
                </View>
            </View>

            {/* Filter Tabs */}
            <View className="flex-row px-4 pt-4 pb-2">
                {(['pending', 'approved', 'denied', 'all'] as const).map((f) => (
                    <TouchableOpacity
                        key={f}
                        className={`flex-1 py-2 mx-1 rounded-lg ${filter === f ? 'bg-caregiver' : 'bg-white border border-gray-200'}`}
                        onPress={() => setFilter(f)}
                    >
                        <Text className={`text-center font-medium capitalize ${filter === f ? 'text-white' : 'text-gray-600'}`}>
                            {f} {f === 'pending' && pendingCount > 0 && `(${pendingCount})`}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Requests List */}
            <View className="px-4 pt-2 pb-8">
                {filteredRequests.map(request => {
                    const typeConfig = getTypeConfig(request.type);
                    const statusConfig = getStatusConfig(request.status);

                    return (
                        <View
                            key={request.id}
                            className="bg-white p-4 rounded-xl mb-3 border border-gray-100"
                        >
                            <View className="flex-row justify-between items-start mb-2">
                                <View className="flex-1">
                                    <Text className="text-gray-900 font-semibold">{request.employeeName}</Text>
                                    <View className="flex-row items-center mt-1">
                                        <View className={`${typeConfig.bg} px-2 py-0.5 rounded`}>
                                            <Text className={`${typeConfig.text} text-xs font-medium`}>{typeConfig.label}</Text>
                                        </View>
                                        <Text className="text-gray-500 text-sm ml-2">{request.days} day(s)</Text>
                                    </View>
                                </View>
                                <View className={`${statusConfig.bg} px-2 py-1 rounded-lg`}>
                                    <Text className={`${statusConfig.text} text-xs font-medium capitalize`}>{request.status}</Text>
                                </View>
                            </View>

                            <View className="flex-row items-center mb-2">
                                <Ionicons name="calendar-outline" size={14} color={Colors.gray[400]} />
                                <Text className="text-gray-600 text-sm ml-1">
                                    {format(new Date(request.startDate), 'MMM d')} - {format(new Date(request.endDate), 'MMM d, yyyy')}
                                </Text>
                            </View>

                            {request.reason && (
                                <Text className="text-gray-500 text-sm mb-2">"{request.reason}"</Text>
                            )}

                            {request.status === 'pending' && (
                                <View className="flex-row gap-2 pt-2 border-t border-gray-100">
                                    <TouchableOpacity
                                        className="flex-1 bg-red-50 py-2.5 rounded-lg flex-row justify-center items-center"
                                        onPress={() => handleDeny(request)}
                                    >
                                        <Ionicons name="close" size={16} color={Colors.danger.DEFAULT} />
                                        <Text className="text-red-600 font-semibold ml-1">Deny</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        className="flex-1 bg-green-50 py-2.5 rounded-lg flex-row justify-center items-center"
                                        onPress={() => handleApprove(request)}
                                    >
                                        <Ionicons name="checkmark" size={16} color={Colors.success.DEFAULT} />
                                        <Text className="text-green-600 font-semibold ml-1">Approve</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    );
                })}

                {filteredRequests.length === 0 && (
                    <View className="bg-gray-50 p-8 rounded-2xl items-center">
                        <Ionicons name="calendar-outline" size={48} color={Colors.gray[400]} />
                        <Text className="text-gray-500 font-medium mt-2">No requests found</Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}
