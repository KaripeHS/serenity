/**
 * Scheduling Screen - Staff scheduling and shift management
 */

import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/DesignSystem';
import { format, addDays, startOfWeek } from 'date-fns';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Config } from '../../constants/Config';

interface Shift {
    id: string;
    caregiverName: string;
    patientName: string;
    startTime: string;
    endTime: string;
    status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
    location: string;
}

interface DaySchedule {
    date: string;
    shifts: Shift[];
    openShifts: number;
}

export default function SchedulingScreen() {
    const [refreshing, setRefreshing] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [weekSchedule, setWeekSchedule] = useState<DaySchedule[]>([]);
    const [todayShifts, setTodayShifts] = useState<Shift[]>([]);

    const loadData = async () => {
        try {
            const token = await SecureStore.getItemAsync('serenity_auth_token');
            const api = axios.create({
                baseURL: Config.API_URL,
                headers: { Authorization: `Bearer ${token}` }
            });

            try {
                const response = await api.get('/console/scheduling/week', {
                    params: { date: format(selectedDate, 'yyyy-MM-dd') }
                });
                setWeekSchedule(response.data.schedule || []);
                setTodayShifts(response.data.todayShifts || []);
            } catch (apiError) {
                // Fallback data
                const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
                const schedule: DaySchedule[] = [];
                for (let i = 0; i < 7; i++) {
                    const date = addDays(weekStart, i);
                    schedule.push({
                        date: format(date, 'yyyy-MM-dd'),
                        shifts: [],
                        openShifts: Math.floor(Math.random() * 5),
                    });
                }
                setWeekSchedule(schedule);
                setTodayShifts([
                    { id: '1', caregiverName: 'Sarah Johnson', patientName: 'John Smith', startTime: '08:00', endTime: '12:00', status: 'completed', location: 'Columbus, OH' },
                    { id: '2', caregiverName: 'Mike Davis', patientName: 'Mary Wilson', startTime: '09:00', endTime: '13:00', status: 'in_progress', location: 'Dublin, OH' },
                    { id: '3', caregiverName: 'Emily Chen', patientName: 'Robert Brown', startTime: '13:00', endTime: '17:00', status: 'confirmed', location: 'Westerville, OH' },
                    { id: '4', caregiverName: 'James Taylor', patientName: 'Patricia Davis', startTime: '14:00', endTime: '18:00', status: 'scheduled', location: 'Hilliard, OH' },
                    { id: '5', caregiverName: 'Open Shift', patientName: 'Linda Martinez', startTime: '15:00', endTime: '19:00', status: 'cancelled', location: 'Grove City, OH' },
                ]);
            }
        } catch (error) {
            console.error('Failed to load scheduling data:', error);
        }
    };

    useEffect(() => {
        loadData();
    }, [selectedDate]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, [selectedDate]);

    const getStatusStyle = (status: Shift['status']) => {
        switch (status) {
            case 'completed': return { bg: 'bg-green-100', text: 'text-green-700', icon: 'checkmark-circle' };
            case 'in_progress': return { bg: 'bg-blue-100', text: 'text-blue-700', icon: 'navigate' };
            case 'confirmed': return { bg: 'bg-purple-100', text: 'text-purple-700', icon: 'checkmark' };
            case 'scheduled': return { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: 'time' };
            case 'cancelled': return { bg: 'bg-red-100', text: 'text-red-700', icon: 'close-circle' };
            default: return { bg: 'bg-gray-100', text: 'text-gray-600', icon: 'help' };
        }
    };

    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });

    return (
        <ScrollView
            className="flex-1 bg-background"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Week Selector */}
            <View className="bg-white px-4 py-4 border-b border-gray-100">
                <View className="flex-row justify-between items-center mb-3">
                    <TouchableOpacity onPress={() => setSelectedDate(addDays(selectedDate, -7))}>
                        <Ionicons name="chevron-back" size={24} color={Colors.gray[600]} />
                    </TouchableOpacity>
                    <Text className="text-lg font-bold text-gray-800">
                        {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
                    </Text>
                    <TouchableOpacity onPress={() => setSelectedDate(addDays(selectedDate, 7))}>
                        <Ionicons name="chevron-forward" size={24} color={Colors.gray[600]} />
                    </TouchableOpacity>
                </View>

                {/* Day Pills */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {weekSchedule.map((day, index) => {
                        const date = new Date(day.date);
                        const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                        const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                        return (
                            <TouchableOpacity
                                key={day.date}
                                className={`items-center px-4 py-2 mr-2 rounded-xl ${isSelected ? 'bg-info' : isToday ? 'bg-blue-50' : 'bg-gray-50'}`}
                                onPress={() => setSelectedDate(date)}
                            >
                                <Text className={`text-xs ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                                    {format(date, 'EEE')}
                                </Text>
                                <Text className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                                    {format(date, 'd')}
                                </Text>
                                {day.openShifts > 0 && (
                                    <View className={`mt-1 px-1.5 py-0.5 rounded ${isSelected ? 'bg-white/20' : 'bg-red-100'}`}>
                                        <Text className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-red-600'}`}>
                                            {day.openShifts} open
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Quick Actions */}
            <View className="px-4 pt-4">
                <View className="flex-row">
                    <TouchableOpacity className="flex-1 bg-info p-3 rounded-xl mr-2 flex-row items-center justify-center">
                        <Ionicons name="add-circle" size={20} color="#fff" />
                        <Text className="text-white font-semibold ml-2">Add Shift</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-1 bg-white p-3 rounded-xl ml-2 flex-row items-center justify-center border border-gray-200">
                        <Ionicons name="swap-horizontal" size={20} color={Colors.info.DEFAULT} />
                        <Text className="text-info font-semibold ml-2">Swap Shifts</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Today's Shifts */}
            <View className="px-4 pt-4 pb-8">
                <Text className="text-lg font-bold text-gray-800 mb-2">
                    {format(selectedDate, 'EEEE')} Shifts
                </Text>
                {todayShifts.map(shift => {
                    const style = getStatusStyle(shift.status);
                    return (
                        <TouchableOpacity
                            key={shift.id}
                            className="bg-white p-4 rounded-xl mb-2 border border-gray-100"
                        >
                            <View className="flex-row justify-between items-start mb-2">
                                <View className="flex-1">
                                    <Text className="text-gray-900 font-semibold">{shift.caregiverName}</Text>
                                    <Text className="text-gray-500 text-sm">Patient: {shift.patientName}</Text>
                                </View>
                                <View className={`${style.bg} px-2 py-1 rounded-lg flex-row items-center`}>
                                    <Ionicons name={style.icon as any} size={12} color={Colors.gray[600]} />
                                    <Text className={`${style.text} text-xs font-medium ml-1 capitalize`}>
                                        {shift.status.replace('_', ' ')}
                                    </Text>
                                </View>
                            </View>
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center">
                                    <Ionicons name="time-outline" size={14} color={Colors.gray[400]} />
                                    <Text className="text-gray-600 text-sm ml-1">{shift.startTime} - {shift.endTime}</Text>
                                </View>
                                <View className="flex-row items-center">
                                    <Ionicons name="location-outline" size={14} color={Colors.gray[400]} />
                                    <Text className="text-gray-500 text-sm ml-1">{shift.location}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </ScrollView>
    );
}
