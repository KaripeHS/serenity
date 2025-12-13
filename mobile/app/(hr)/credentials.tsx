/**
 * Credentials Screen - Employee credentials and compliance tracking
 */

import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/DesignSystem';
import { format, differenceInDays } from 'date-fns';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Config } from '../../constants/Config';

interface Credential {
    id: string;
    employeeName: string;
    credentialType: string;
    issueDate: string;
    expirationDate: string;
    status: 'valid' | 'expiring' | 'expired';
    documentUrl?: string;
}

export default function CredentialsScreen() {
    const [refreshing, setRefreshing] = useState(false);
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [filter, setFilter] = useState<'all' | 'valid' | 'expiring' | 'expired'>('all');

    const loadData = async () => {
        try {
            const token = await SecureStore.getItemAsync('serenity_auth_token');
            const api = axios.create({
                baseURL: Config.API_URL,
                headers: { Authorization: `Bearer ${token}` }
            });

            try {
                const response = await api.get('/console/hr/credentials');
                setCredentials(response.data || []);
            } catch (apiError) {
                const today = new Date();
                setCredentials([
                    { id: '1', employeeName: 'Sarah Johnson', credentialType: 'RN License', issueDate: '2022-03-15', expirationDate: '2025-03-15', status: 'valid' },
                    { id: '2', employeeName: 'Sarah Johnson', credentialType: 'CPR Certification', issueDate: '2024-01-10', expirationDate: '2025-01-10', status: 'expiring' },
                    { id: '3', employeeName: 'Mike Davis', credentialType: 'CNA Certification', issueDate: '2023-06-20', expirationDate: '2025-06-20', status: 'valid' },
                    { id: '4', employeeName: 'Mike Davis', credentialType: 'Background Check', issueDate: '2023-06-15', expirationDate: '2024-12-15', status: 'expiring' },
                    { id: '5', employeeName: 'Emily Chen', credentialType: 'LPN License', issueDate: '2022-11-10', expirationDate: '2024-11-10', status: 'expired' },
                    { id: '6', employeeName: 'Emily Chen', credentialType: 'TB Test', issueDate: '2024-05-20', expirationDate: '2025-05-20', status: 'valid' },
                    { id: '7', employeeName: 'James Taylor', credentialType: 'CNA Certification', issueDate: '2024-11-01', expirationDate: '2026-11-01', status: 'valid' },
                    { id: '8', employeeName: 'Lisa Brown', credentialType: 'First Aid', issueDate: '2024-02-14', expirationDate: '2025-02-14', status: 'expiring' },
                ]);
            }
        } catch (error) {
            console.error('Failed to load credentials:', error);
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

    const getStatusConfig = (status: Credential['status']) => {
        switch (status) {
            case 'valid': return { bg: 'bg-green-100', text: 'text-green-700', icon: 'checkmark-circle', color: Colors.success.DEFAULT };
            case 'expiring': return { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: 'warning', color: Colors.warning.DEFAULT };
            case 'expired': return { bg: 'bg-red-100', text: 'text-red-700', icon: 'alert-circle', color: Colors.danger.DEFAULT };
            default: return { bg: 'bg-gray-100', text: 'text-gray-600', icon: 'help', color: Colors.gray[500] };
        }
    };

    const getDaysUntilExpiration = (expirationDate: string) => {
        return differenceInDays(new Date(expirationDate), new Date());
    };

    const filteredCredentials = credentials.filter(c => filter === 'all' || c.status === filter);

    const validCount = credentials.filter(c => c.status === 'valid').length;
    const expiringCount = credentials.filter(c => c.status === 'expiring').length;
    const expiredCount = credentials.filter(c => c.status === 'expired').length;

    return (
        <ScrollView
            className="flex-1 bg-background"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Stats Bar */}
            <View className="bg-white px-4 py-3 border-b border-gray-100 flex-row justify-around">
                <View className="items-center">
                    <Text className="text-2xl font-bold text-green-600">{validCount}</Text>
                    <Text className="text-gray-500 text-xs">Valid</Text>
                </View>
                <View className="items-center">
                    <Text className="text-2xl font-bold text-yellow-600">{expiringCount}</Text>
                    <Text className="text-gray-500 text-xs">Expiring</Text>
                </View>
                <View className="items-center">
                    <Text className="text-2xl font-bold text-red-600">{expiredCount}</Text>
                    <Text className="text-gray-500 text-xs">Expired</Text>
                </View>
                <View className="items-center">
                    <Text className="text-2xl font-bold text-gray-600">{credentials.length}</Text>
                    <Text className="text-gray-500 text-xs">Total</Text>
                </View>
            </View>

            {/* Filter Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 pt-4 pb-2">
                {(['all', 'expiring', 'expired', 'valid'] as const).map((f) => (
                    <TouchableOpacity
                        key={f}
                        className={`px-4 py-2 mr-2 rounded-full ${filter === f ? 'bg-caregiver' : 'bg-white border border-gray-200'}`}
                        onPress={() => setFilter(f)}
                    >
                        <Text className={`font-medium capitalize ${filter === f ? 'text-white' : 'text-gray-600'}`}>
                            {f}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Credentials List */}
            <View className="px-4 pt-2 pb-8">
                {filteredCredentials.map(credential => {
                    const config = getStatusConfig(credential.status);
                    const daysLeft = getDaysUntilExpiration(credential.expirationDate);

                    return (
                        <TouchableOpacity
                            key={credential.id}
                            className={`bg-white p-4 rounded-xl mb-2 border ${credential.status === 'expired' ? 'border-red-200' : credential.status === 'expiring' ? 'border-yellow-200' : 'border-gray-100'}`}
                        >
                            <View className="flex-row justify-between items-start mb-2">
                                <View className="flex-1">
                                    <Text className="text-gray-900 font-semibold">{credential.credentialType}</Text>
                                    <Text className="text-gray-500 text-sm">{credential.employeeName}</Text>
                                </View>
                                <View className={`${config.bg} px-2 py-1 rounded-lg flex-row items-center`}>
                                    <Ionicons name={config.icon as any} size={14} color={config.color} />
                                    <Text className={`${config.text} text-xs font-medium ml-1 capitalize`}>{credential.status}</Text>
                                </View>
                            </View>

                            <View className="flex-row justify-between items-center pt-2 border-t border-gray-100">
                                <View>
                                    <Text className="text-gray-400 text-xs">Expiration Date</Text>
                                    <Text className="text-gray-700 font-medium">
                                        {format(new Date(credential.expirationDate), 'MMM d, yyyy')}
                                    </Text>
                                </View>
                                <View className="items-end">
                                    {daysLeft < 0 ? (
                                        <Text className="text-red-600 font-semibold">Expired</Text>
                                    ) : daysLeft <= 30 ? (
                                        <Text className="text-yellow-600 font-semibold">{daysLeft} days left</Text>
                                    ) : (
                                        <Text className="text-green-600 font-semibold">{daysLeft} days left</Text>
                                    )}
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })}

                {filteredCredentials.length === 0 && (
                    <View className="bg-gray-50 p-8 rounded-2xl items-center">
                        <Ionicons name="document-text-outline" size={48} color={Colors.gray[400]} />
                        <Text className="text-gray-500 font-medium mt-2">No credentials found</Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}
