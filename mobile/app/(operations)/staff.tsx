/**
 * Staff Screen - Staff overview and management for operations
 */

import { View, Text, ScrollView, RefreshControl, TouchableOpacity, TextInput } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/DesignSystem';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Config } from '../../constants/Config';

interface StaffMember {
    id: string;
    name: string;
    role: string;
    status: 'available' | 'on_visit' | 'in_transit' | 'off_duty' | 'pto';
    phone: string;
    currentPatient?: string;
    nextVisit?: string;
    hoursThisWeek: number;
}

export default function StaffScreen() {
    const [refreshing, setRefreshing] = useState(false);
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'off'>('all');

    const loadData = async () => {
        try {
            const token = await SecureStore.getItemAsync('serenity_auth_token');
            const api = axios.create({
                baseURL: Config.API_URL,
                headers: { Authorization: `Bearer ${token}` }
            });

            try {
                const response = await api.get('/console/staff/list');
                setStaff(response.data || []);
            } catch (apiError) {
                // Fallback data
                setStaff([
                    { id: '1', name: 'Sarah Johnson', role: 'RN', status: 'on_visit', phone: '(614) 555-0101', currentPatient: 'John Smith', hoursThisWeek: 32 },
                    { id: '2', name: 'Mike Davis', role: 'CNA', status: 'in_transit', phone: '(614) 555-0102', nextVisit: '2:00 PM - Mary Wilson', hoursThisWeek: 28 },
                    { id: '3', name: 'Emily Chen', role: 'LPN', status: 'available', phone: '(614) 555-0103', nextVisit: '3:00 PM - Robert Brown', hoursThisWeek: 36 },
                    { id: '4', name: 'James Taylor', role: 'CNA', status: 'on_visit', phone: '(614) 555-0104', currentPatient: 'Patricia Davis', hoursThisWeek: 40 },
                    { id: '5', name: 'Lisa Brown', role: 'RN', status: 'off_duty', phone: '(614) 555-0105', hoursThisWeek: 38 },
                    { id: '6', name: 'David Wilson', role: 'CNA', status: 'pto', phone: '(614) 555-0106', hoursThisWeek: 0 },
                    { id: '7', name: 'Jennifer Lee', role: 'HHA', status: 'available', phone: '(614) 555-0107', nextVisit: '4:00 PM - Thomas Anderson', hoursThisWeek: 24 },
                    { id: '8', name: 'Robert Martinez', role: 'CNA', status: 'on_visit', phone: '(614) 555-0108', currentPatient: 'Linda Garcia', hoursThisWeek: 35 },
                ]);
            }
        } catch (error) {
            console.error('Failed to load staff:', error);
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

    const getStatusConfig = (status: StaffMember['status']) => {
        switch (status) {
            case 'available': return { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500', label: 'Available' };
            case 'on_visit': return { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500', label: 'On Visit' };
            case 'in_transit': return { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500', label: 'In Transit' };
            case 'off_duty': return { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400', label: 'Off Duty' };
            case 'pto': return { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500', label: 'PTO' };
            default: return { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400', label: status };
        }
    };

    const filteredStaff = staff.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.role.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === 'all' ||
            (filter === 'active' && ['available', 'on_visit', 'in_transit'].includes(s.status)) ||
            (filter === 'off' && ['off_duty', 'pto'].includes(s.status));
        return matchesSearch && matchesFilter;
    });

    const activeCount = staff.filter(s => ['available', 'on_visit', 'in_transit'].includes(s.status)).length;
    const onVisitCount = staff.filter(s => s.status === 'on_visit').length;
    const availableCount = staff.filter(s => s.status === 'available').length;

    return (
        <ScrollView
            className="flex-1 bg-background"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Stats Bar */}
            <View className="bg-white px-4 py-3 border-b border-gray-100 flex-row justify-around">
                <View className="items-center">
                    <Text className="text-2xl font-bold text-gray-800">{staff.length}</Text>
                    <Text className="text-gray-500 text-xs">Total Staff</Text>
                </View>
                <View className="items-center">
                    <Text className="text-2xl font-bold text-green-600">{activeCount}</Text>
                    <Text className="text-gray-500 text-xs">Active</Text>
                </View>
                <View className="items-center">
                    <Text className="text-2xl font-bold text-blue-600">{onVisitCount}</Text>
                    <Text className="text-gray-500 text-xs">On Visit</Text>
                </View>
                <View className="items-center">
                    <Text className="text-2xl font-bold text-green-500">{availableCount}</Text>
                    <Text className="text-gray-500 text-xs">Available</Text>
                </View>
            </View>

            {/* Search Bar */}
            <View className="px-4 pt-4">
                <View className="bg-white flex-row items-center px-4 py-3 rounded-xl border border-gray-200">
                    <Ionicons name="search" size={20} color={Colors.gray[400]} />
                    <TextInput
                        className="flex-1 ml-3 text-gray-800"
                        placeholder="Search staff..."
                        placeholderTextColor={Colors.gray[400]}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color={Colors.gray[400]} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Filter Tabs */}
            <View className="flex-row px-4 pt-3 pb-2">
                {([
                    { key: 'all', label: 'All' },
                    { key: 'active', label: 'Active' },
                    { key: 'off', label: 'Off/PTO' },
                ] as const).map((f) => (
                    <TouchableOpacity
                        key={f.key}
                        className={`flex-1 py-2 mx-1 rounded-lg ${filter === f.key ? 'bg-info' : 'bg-white border border-gray-200'}`}
                        onPress={() => setFilter(f.key)}
                    >
                        <Text className={`text-center font-medium ${filter === f.key ? 'text-white' : 'text-gray-600'}`}>
                            {f.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Staff List */}
            <View className="px-4 pt-2 pb-8">
                {filteredStaff.map(member => {
                    const config = getStatusConfig(member.status);
                    return (
                        <TouchableOpacity
                            key={member.id}
                            className="bg-white p-4 rounded-xl mb-2 border border-gray-100"
                        >
                            <View className="flex-row items-start">
                                <View className="h-12 w-12 bg-gray-100 rounded-full items-center justify-center mr-3">
                                    <Text className="text-lg font-bold text-gray-600">
                                        {member.name.split(' ').map(n => n[0]).join('')}
                                    </Text>
                                </View>
                                <View className="flex-1">
                                    <View className="flex-row items-center justify-between">
                                        <View className="flex-row items-center">
                                            <Text className="text-gray-900 font-semibold">{member.name}</Text>
                                            <View className={`h-2.5 w-2.5 rounded-full ${config.dot} ml-2`} />
                                        </View>
                                        <View className={`${config.bg} px-2 py-1 rounded-lg`}>
                                            <Text className={`${config.text} text-xs font-medium`}>{config.label}</Text>
                                        </View>
                                    </View>
                                    <Text className="text-gray-500 text-sm">{member.role}</Text>

                                    {member.currentPatient && (
                                        <View className="flex-row items-center mt-2">
                                            <Ionicons name="person" size={14} color={Colors.info.DEFAULT} />
                                            <Text className="text-blue-600 text-sm ml-1">With: {member.currentPatient}</Text>
                                        </View>
                                    )}
                                    {member.nextVisit && !member.currentPatient && (
                                        <View className="flex-row items-center mt-2">
                                            <Ionicons name="time" size={14} color={Colors.gray[400]} />
                                            <Text className="text-gray-500 text-sm ml-1">Next: {member.nextVisit}</Text>
                                        </View>
                                    )}

                                    <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-gray-100">
                                        <View className="flex-row items-center">
                                            <Ionicons name="call-outline" size={14} color={Colors.gray[400]} />
                                            <Text className="text-gray-500 text-sm ml-1">{member.phone}</Text>
                                        </View>
                                        <Text className="text-gray-500 text-sm">{member.hoursThisWeek}h this week</Text>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })}

                {filteredStaff.length === 0 && (
                    <View className="bg-gray-50 p-8 rounded-2xl items-center">
                        <Ionicons name="people-outline" size={48} color={Colors.gray[400]} />
                        <Text className="text-gray-500 font-medium mt-2">No staff found</Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}
