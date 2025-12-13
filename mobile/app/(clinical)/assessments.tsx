/**
 * Assessments Screen - Clinical assessments management
 */

import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/DesignSystem';
import { format, differenceInDays } from 'date-fns';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Config } from '../../constants/Config';

interface Assessment {
    id: string;
    patientName: string;
    assessmentType: string;
    dueDate: string;
    status: 'due' | 'overdue' | 'completed' | 'in_progress';
    assignedTo: string;
    completedDate?: string;
    priority: 'normal' | 'high' | 'urgent';
}

export default function AssessmentsScreen() {
    const [refreshing, setRefreshing] = useState(false);
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [filter, setFilter] = useState<'all' | 'due' | 'overdue' | 'completed'>('due');

    const loadData = async () => {
        try {
            const token = await SecureStore.getItemAsync('serenity_auth_token');
            const api = axios.create({
                baseURL: Config.API_URL,
                headers: { Authorization: `Bearer ${token}` }
            });

            try {
                const response = await api.get('/console/clinical/assessments');
                setAssessments(response.data || []);
            } catch (apiError) {
                setAssessments([
                    { id: '1', patientName: 'John Smith', assessmentType: 'OASIS Start of Care', dueDate: '2024-12-10', status: 'due', assignedTo: 'Sarah Johnson', priority: 'high' },
                    { id: '2', patientName: 'Mary Wilson', assessmentType: '30-Day Recertification', dueDate: '2024-12-05', status: 'overdue', assignedTo: 'Emily Chen', priority: 'urgent' },
                    { id: '3', patientName: 'Robert Brown', assessmentType: 'Supervisory Visit', dueDate: '2024-12-08', status: 'due', assignedTo: 'Sarah Johnson', priority: 'normal' },
                    { id: '4', patientName: 'Patricia Davis', assessmentType: 'Wound Assessment', dueDate: '2024-12-11', status: 'due', assignedTo: 'Lisa Brown', priority: 'high' },
                    { id: '5', patientName: 'Linda Martinez', assessmentType: 'Initial Assessment', dueDate: '2024-12-09', status: 'in_progress', assignedTo: 'Sarah Johnson', priority: 'urgent' },
                    { id: '6', patientName: 'Thomas Anderson', assessmentType: 'Fall Risk Assessment', dueDate: '2024-12-03', status: 'completed', assignedTo: 'Emily Chen', completedDate: '2024-12-03', priority: 'normal' },
                    { id: '7', patientName: 'John Smith', assessmentType: 'Medication Review', dueDate: '2024-12-02', status: 'completed', assignedTo: 'Sarah Johnson', completedDate: '2024-12-02', priority: 'normal' },
                ]);
            }
        } catch (error) {
            console.error('Failed to load assessments:', error);
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

    const getStatusConfig = (status: Assessment['status']) => {
        switch (status) {
            case 'due': return { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: 'time', color: Colors.warning.DEFAULT };
            case 'overdue': return { bg: 'bg-red-100', text: 'text-red-700', icon: 'alert-circle', color: Colors.danger.DEFAULT };
            case 'completed': return { bg: 'bg-green-100', text: 'text-green-700', icon: 'checkmark-circle', color: Colors.success.DEFAULT };
            case 'in_progress': return { bg: 'bg-blue-100', text: 'text-blue-700', icon: 'create', color: Colors.info.DEFAULT };
            default: return { bg: 'bg-gray-100', text: 'text-gray-600', icon: 'help', color: Colors.gray[500] };
        }
    };

    const getPriorityConfig = (priority: Assessment['priority']) => {
        switch (priority) {
            case 'urgent': return { bg: 'bg-red-500', text: 'text-white' };
            case 'high': return { bg: 'bg-orange-100', text: 'text-orange-700' };
            case 'normal': return { bg: 'bg-gray-100', text: 'text-gray-600' };
            default: return { bg: 'bg-gray-100', text: 'text-gray-600' };
        }
    };

    const filteredAssessments = assessments.filter(a => {
        if (filter === 'due') return a.status === 'due' || a.status === 'in_progress';
        if (filter === 'overdue') return a.status === 'overdue';
        if (filter === 'completed') return a.status === 'completed';
        return true;
    });

    const dueCount = assessments.filter(a => a.status === 'due' || a.status === 'in_progress').length;
    const overdueCount = assessments.filter(a => a.status === 'overdue').length;

    return (
        <ScrollView
            className="flex-1 bg-background"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Stats Bar */}
            <View className="bg-white px-4 py-3 border-b border-gray-100 flex-row justify-around">
                <View className="items-center">
                    <Text className="text-2xl font-bold text-yellow-600">{dueCount}</Text>
                    <Text className="text-gray-500 text-xs">Due</Text>
                </View>
                <View className="items-center">
                    <Text className="text-2xl font-bold text-red-600">{overdueCount}</Text>
                    <Text className="text-gray-500 text-xs">Overdue</Text>
                </View>
                <View className="items-center">
                    <Text className="text-2xl font-bold text-green-600">
                        {assessments.filter(a => a.status === 'completed').length}
                    </Text>
                    <Text className="text-gray-500 text-xs">Completed</Text>
                </View>
            </View>

            {/* Filter Tabs */}
            <View className="flex-row px-4 pt-4 pb-2">
                {([
                    { key: 'due', label: 'Due' },
                    { key: 'overdue', label: 'Overdue' },
                    { key: 'completed', label: 'Completed' },
                    { key: 'all', label: 'All' },
                ] as const).map((f) => (
                    <TouchableOpacity
                        key={f.key}
                        className={`flex-1 py-2 mx-1 rounded-lg ${filter === f.key ? 'bg-danger' : 'bg-white border border-gray-200'}`}
                        onPress={() => setFilter(f.key)}
                    >
                        <Text className={`text-center font-medium text-sm ${filter === f.key ? 'text-white' : 'text-gray-600'}`}>
                            {f.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Assessments List */}
            <View className="px-4 pt-2 pb-8">
                {filteredAssessments.map(assessment => {
                    const statusConfig = getStatusConfig(assessment.status);
                    const priorityConfig = getPriorityConfig(assessment.priority);
                    const daysUntilDue = differenceInDays(new Date(assessment.dueDate), new Date());

                    return (
                        <TouchableOpacity
                            key={assessment.id}
                            className={`bg-white p-4 rounded-xl mb-2 border ${assessment.status === 'overdue' ? 'border-red-200' : 'border-gray-100'}`}
                        >
                            <View className="flex-row justify-between items-start mb-2">
                                <View className="flex-1">
                                    <View className="flex-row items-center">
                                        <Text className="text-gray-900 font-semibold">{assessment.assessmentType}</Text>
                                        {assessment.priority !== 'normal' && (
                                            <View className={`${priorityConfig.bg} px-1.5 py-0.5 rounded ml-2`}>
                                                <Text className={`${priorityConfig.text} text-xs font-medium capitalize`}>
                                                    {assessment.priority}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text className="text-gray-500 text-sm">{assessment.patientName}</Text>
                                </View>
                                <View className={`${statusConfig.bg} px-2 py-1 rounded-lg flex-row items-center`}>
                                    <Ionicons name={statusConfig.icon as any} size={14} color={statusConfig.color} />
                                    <Text className={`${statusConfig.text} text-xs font-medium ml-1 capitalize`}>
                                        {assessment.status.replace('_', ' ')}
                                    </Text>
                                </View>
                            </View>

                            <View className="flex-row items-center mb-2">
                                <Ionicons name="person-outline" size={14} color={Colors.gray[400]} />
                                <Text className="text-gray-500 text-sm ml-1">{assessment.assignedTo}</Text>
                            </View>

                            <View className="flex-row items-center justify-between pt-2 border-t border-gray-100">
                                <View className="flex-row items-center">
                                    <Ionicons name="calendar-outline" size={14} color={Colors.gray[400]} />
                                    <Text className="text-gray-600 text-sm ml-1">
                                        {assessment.status === 'completed'
                                            ? `Completed: ${format(new Date(assessment.completedDate!), 'MMM d')}`
                                            : `Due: ${format(new Date(assessment.dueDate), 'MMM d, yyyy')}`}
                                    </Text>
                                </View>
                                {assessment.status !== 'completed' && (
                                    <Text className={`font-medium text-sm ${daysUntilDue < 0 ? 'text-red-600' : daysUntilDue <= 2 ? 'text-yellow-600' : 'text-gray-500'}`}>
                                        {daysUntilDue < 0
                                            ? `${Math.abs(daysUntilDue)} days overdue`
                                            : daysUntilDue === 0
                                            ? 'Due today'
                                            : `${daysUntilDue} days left`}
                                    </Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </ScrollView>
    );
}
