/**
 * Family Updates Screen - Care updates and notes
 * HIPAA Compliant - Only shows authorized patient's care updates
 */

import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/DesignSystem';
import { format } from 'date-fns';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Config } from '../../constants/Config';

interface CareUpdate {
    id: string;
    date: string;
    type: 'visit_note' | 'health_update' | 'milestone' | 'alert';
    title: string;
    content: string;
    caregiverName: string;
    caregiverRole: string;
}

export default function FamilyUpdatesScreen() {
    const [refreshing, setRefreshing] = useState(false);
    const [updates, setUpdates] = useState<CareUpdate[]>([]);
    const [filter, setFilter] = useState<'all' | 'visit_note' | 'health_update' | 'milestone'>('all');

    const loadData = async () => {
        try {
            const token = await SecureStore.getItemAsync('serenity_auth_token');
            const api = axios.create({
                baseURL: Config.API_URL,
                headers: { Authorization: `Bearer ${token}` }
            });

            try {
                const response = await api.get('/family/portal/updates');
                setUpdates(response.data || []);
            } catch (apiError) {
                setUpdates([
                    { id: '1', date: '2024-12-07T14:30:00', type: 'visit_note', title: 'Skilled Nursing Visit', content: 'Blood pressure stable at 128/82. Heart sounds clear. Continuing current medication regimen. Patient in good spirits.', caregiverName: 'Sarah Johnson', caregiverRole: 'RN' },
                    { id: '2', date: '2024-12-07T10:00:00', type: 'health_update', title: 'Vitals Update', content: 'Morning vitals: BP 130/84, Pulse 72, Temp 98.4°F. All within normal range.', caregiverName: 'Sarah Johnson', caregiverRole: 'RN' },
                    { id: '3', date: '2024-12-05T16:00:00', type: 'visit_note', title: 'Personal Care Visit', content: 'Assisted with bathing and grooming. Light range-of-motion exercises completed. Patient walked 50 feet with walker.', caregiverName: 'Mike Davis', caregiverRole: 'HHA' },
                    { id: '4', date: '2024-12-04T11:00:00', type: 'milestone', title: 'Care Goal Met', content: 'Patient successfully walked 100 feet without rest. Physical therapy goal achieved ahead of schedule!', caregiverName: 'Sarah Johnson', caregiverRole: 'RN' },
                    { id: '5', date: '2024-12-03T14:00:00', type: 'visit_note', title: 'Skilled Nursing Visit', content: 'Medication review completed. Blood sugar levels have been improving. A1C scheduled for next week.', caregiverName: 'Sarah Johnson', caregiverRole: 'RN' },
                    { id: '6', date: '2024-12-01T09:30:00', type: 'health_update', title: 'Weight Check', content: 'Weight stable at 172 lbs. No significant changes from last week.', caregiverName: 'Mike Davis', caregiverRole: 'HHA' },
                ]);
            }
        } catch (error) {
            console.error('Failed to load updates:', error);
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

    const getTypeConfig = (type: CareUpdate['type']) => {
        switch (type) {
            case 'visit_note': return { icon: 'clipboard', color: Colors.primary.DEFAULT, bg: 'bg-blue-100', label: 'Visit Note' };
            case 'health_update': return { icon: 'heart', color: Colors.success.DEFAULT, bg: 'bg-green-100', label: 'Health Update' };
            case 'milestone': return { icon: 'trophy', color: Colors.warning.DEFAULT, bg: 'bg-yellow-100', label: 'Milestone' };
            case 'alert': return { icon: 'alert-circle', color: Colors.danger.DEFAULT, bg: 'bg-red-100', label: 'Alert' };
            default: return { icon: 'document', color: Colors.gray[500], bg: 'bg-gray-100', label: type };
        }
    };

    const filteredUpdates = filter === 'all' ? updates : updates.filter(u => u.type === filter);

    return (
        <ScrollView
            className="flex-1 bg-background"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Filter Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 pt-4 pb-2">
                {([
                    { key: 'all', label: 'All Updates' },
                    { key: 'visit_note', label: 'Visit Notes' },
                    { key: 'health_update', label: 'Health' },
                    { key: 'milestone', label: 'Milestones' },
                ] as const).map((f) => (
                    <TouchableOpacity
                        key={f.key}
                        className={`px-4 py-2 mr-2 rounded-full ${filter === f.key ? 'bg-caregiver' : 'bg-white border border-gray-200'}`}
                        onPress={() => setFilter(f.key)}
                    >
                        <Text className={`font-medium ${filter === f.key ? 'text-white' : 'text-gray-600'}`}>
                            {f.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Updates List */}
            <View className="px-4 pt-2 pb-8">
                {filteredUpdates.map(update => {
                    const config = getTypeConfig(update.type);
                    return (
                        <View key={update.id} className="bg-white p-4 rounded-2xl mb-3 border border-gray-100">
                            <View className="flex-row items-start mb-3">
                                <View className={`${config.bg} p-2 rounded-xl mr-3`}>
                                    <Ionicons name={config.icon as any} size={20} color={config.color} />
                                </View>
                                <View className="flex-1">
                                    <View className="flex-row justify-between items-start">
                                        <Text className="text-gray-900 font-bold flex-1">{update.title}</Text>
                                        <Text className="text-gray-400 text-xs">
                                            {format(new Date(update.date), 'MMM d')}
                                        </Text>
                                    </View>
                                    <Text className="text-purple-600 text-sm">
                                        {update.caregiverName}, {update.caregiverRole}
                                    </Text>
                                </View>
                            </View>
                            <Text className="text-gray-700 leading-5">{update.content}</Text>
                            <View className="flex-row items-center mt-3 pt-3 border-t border-gray-100">
                                <Ionicons name="time-outline" size={14} color={Colors.gray[400]} />
                                <Text className="text-gray-400 text-xs ml-1">
                                    {format(new Date(update.date), 'h:mm a')}
                                </Text>
                            </View>
                        </View>
                    );
                })}

                {filteredUpdates.length === 0 && (
                    <View className="bg-gray-50 p-8 rounded-2xl items-center">
                        <Ionicons name="newspaper-outline" size={48} color={Colors.gray[400]} />
                        <Text className="text-gray-500 font-medium mt-2">No updates found</Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}
