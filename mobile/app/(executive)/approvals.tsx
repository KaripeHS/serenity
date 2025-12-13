/**
 * Executive Approvals Screen - Pending items requiring executive review
 */

import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/DesignSystem';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Config } from '../../constants/Config';
import { format } from 'date-fns';

interface ApprovalItem {
    id: string;
    type: 'expense' | 'timeoff' | 'hire' | 'contract' | 'policy';
    title: string;
    description: string;
    amount?: number;
    requestedBy: string;
    requestedAt: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'pending' | 'approved' | 'rejected';
}

export default function ApprovalsScreen() {
    const [refreshing, setRefreshing] = useState(false);
    const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');

    const loadData = async () => {
        try {
            const token = await SecureStore.getItemAsync('serenity_auth_token');
            const api = axios.create({
                baseURL: Config.API_URL,
                headers: { Authorization: `Bearer ${token}` }
            });

            try {
                const response = await api.get('/console/approvals/executive');
                setApprovals(response.data || []);
            } catch (apiError) {
                // Fallback data
                setApprovals([
                    {
                        id: '1',
                        type: 'expense',
                        title: 'Equipment Purchase',
                        description: 'New laptops for field staff',
                        amount: 12500,
                        requestedBy: 'John Smith',
                        requestedAt: new Date().toISOString(),
                        priority: 'medium',
                        status: 'pending',
                    },
                    {
                        id: '2',
                        type: 'hire',
                        title: 'New RN Hire',
                        description: 'Clinical team expansion',
                        requestedBy: 'Sarah Johnson',
                        requestedAt: new Date(Date.now() - 86400000).toISOString(),
                        priority: 'high',
                        status: 'pending',
                    },
                    {
                        id: '3',
                        type: 'timeoff',
                        title: 'Extended Leave Request',
                        description: '3 weeks family medical leave',
                        requestedBy: 'Mike Davis',
                        requestedAt: new Date(Date.now() - 172800000).toISOString(),
                        priority: 'low',
                        status: 'pending',
                    },
                    {
                        id: '4',
                        type: 'contract',
                        title: 'Vendor Contract Renewal',
                        description: 'Medical supplies vendor - 2 year term',
                        amount: 85000,
                        requestedBy: 'Finance Team',
                        requestedAt: new Date(Date.now() - 259200000).toISOString(),
                        priority: 'urgent',
                        status: 'pending',
                    },
                ]);
            }
        } catch (error) {
            console.error('Failed to load approvals:', error);
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

    const handleApprove = (item: ApprovalItem) => {
        Alert.alert(
            'Approve Request',
            `Are you sure you want to approve "${item.title}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Approve',
                    style: 'default',
                    onPress: async () => {
                        // API call would go here
                        setApprovals(prev => prev.map(a =>
                            a.id === item.id ? { ...a, status: 'approved' as const } : a
                        ));
                    }
                }
            ]
        );
    };

    const handleReject = (item: ApprovalItem) => {
        Alert.alert(
            'Reject Request',
            `Are you sure you want to reject "${item.title}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reject',
                    style: 'destructive',
                    onPress: async () => {
                        // API call would go here
                        setApprovals(prev => prev.map(a =>
                            a.id === item.id ? { ...a, status: 'rejected' as const } : a
                        ));
                    }
                }
            ]
        );
    };

    const getTypeIcon = (type: ApprovalItem['type']) => {
        switch (type) {
            case 'expense': return 'card-outline';
            case 'timeoff': return 'calendar-outline';
            case 'hire': return 'person-add-outline';
            case 'contract': return 'document-text-outline';
            case 'policy': return 'shield-outline';
            default: return 'help-outline';
        }
    };

    const getTypeColor = (type: ApprovalItem['type']) => {
        switch (type) {
            case 'expense': return Colors.success.DEFAULT;
            case 'timeoff': return Colors.info.DEFAULT;
            case 'hire': return Colors.caregiver.DEFAULT;
            case 'contract': return Colors.warning.DEFAULT;
            case 'policy': return Colors.primary.DEFAULT;
            default: return Colors.gray[500];
        }
    };

    const getPriorityBadge = (priority: ApprovalItem['priority']) => {
        const styles = {
            urgent: { bg: 'bg-red-100', text: 'text-red-700', label: 'Urgent' },
            high: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'High' },
            medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Medium' },
            low: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Low' },
        };
        return styles[priority];
    };

    const filteredApprovals = approvals.filter(a => {
        if (filter === 'pending') return a.status === 'pending';
        if (filter === 'completed') return a.status !== 'pending';
        return true;
    });

    const ApprovalCard = ({ item }: { item: ApprovalItem }) => {
        const priority = getPriorityBadge(item.priority);
        const typeColor = getTypeColor(item.type);

        return (
            <View className="bg-white mx-4 mb-3 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <View className="p-4">
                    <View className="flex-row items-start justify-between mb-3">
                        <View className="flex-row items-center flex-1">
                            <View className="p-2 rounded-xl mr-3" style={{ backgroundColor: `${typeColor}20` }}>
                                <Ionicons name={getTypeIcon(item.type) as any} size={20} color={typeColor} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-gray-900 font-semibold">{item.title}</Text>
                                <Text className="text-gray-500 text-sm">{item.description}</Text>
                            </View>
                        </View>
                        <View className={`${priority.bg} px-2 py-1 rounded-lg`}>
                            <Text className={`${priority.text} text-xs font-medium`}>{priority.label}</Text>
                        </View>
                    </View>

                    <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-row items-center">
                            <Ionicons name="person-outline" size={14} color={Colors.gray[400]} />
                            <Text className="text-gray-500 text-sm ml-1">{item.requestedBy}</Text>
                        </View>
                        <View className="flex-row items-center">
                            <Ionicons name="time-outline" size={14} color={Colors.gray[400]} />
                            <Text className="text-gray-500 text-sm ml-1">
                                {format(new Date(item.requestedAt), 'MMM d, yyyy')}
                            </Text>
                        </View>
                        {item.amount && (
                            <Text className="text-green-600 font-semibold">
                                ${item.amount.toLocaleString()}
                            </Text>
                        )}
                    </View>

                    {item.status === 'pending' ? (
                        <View className="flex-row gap-2">
                            <TouchableOpacity
                                className="flex-1 bg-red-50 py-3 rounded-xl flex-row justify-center items-center"
                                onPress={() => handleReject(item)}
                            >
                                <Ionicons name="close" size={18} color={Colors.danger.DEFAULT} />
                                <Text className="text-red-600 font-semibold ml-1">Reject</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="flex-1 bg-green-50 py-3 rounded-xl flex-row justify-center items-center"
                                onPress={() => handleApprove(item)}
                            >
                                <Ionicons name="checkmark" size={18} color={Colors.success.DEFAULT} />
                                <Text className="text-green-600 font-semibold ml-1">Approve</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View className={`py-2 px-3 rounded-xl ${item.status === 'approved' ? 'bg-green-100' : 'bg-red-100'}`}>
                            <Text className={`text-center font-medium ${item.status === 'approved' ? 'text-green-700' : 'text-red-700'}`}>
                                {item.status === 'approved' ? 'Approved' : 'Rejected'}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const pendingCount = approvals.filter(a => a.status === 'pending').length;

    return (
        <ScrollView
            className="flex-1 bg-background"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Filter Tabs */}
            <View className="flex-row px-4 pt-4 pb-2">
                {(['pending', 'completed', 'all'] as const).map((f) => (
                    <TouchableOpacity
                        key={f}
                        className={`flex-1 py-2 mx-1 rounded-lg ${filter === f ? 'bg-primary' : 'bg-white border border-gray-200'}`}
                        onPress={() => setFilter(f)}
                    >
                        <Text className={`text-center font-medium ${filter === f ? 'text-white' : 'text-gray-600'}`}>
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                            {f === 'pending' && pendingCount > 0 && ` (${pendingCount})`}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Approval Cards */}
            <View className="pt-2 pb-8">
                {filteredApprovals.length > 0 ? (
                    filteredApprovals.map(item => <ApprovalCard key={item.id} item={item} />)
                ) : (
                    <View className="mx-4 bg-gray-50 p-8 rounded-2xl items-center">
                        <Ionicons name="checkmark-circle" size={48} color={Colors.success.DEFAULT} />
                        <Text className="text-gray-600 font-medium mt-2">No items to review</Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}
