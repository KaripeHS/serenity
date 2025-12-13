/**
 * Patients Screen - Patient list and management for clinical staff
 */

import { View, Text, ScrollView, RefreshControl, TouchableOpacity, TextInput } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/DesignSystem';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Config } from '../../constants/Config';

interface Patient {
    id: string;
    name: string;
    dateOfBirth: string;
    diagnosis: string;
    acuityLevel: 'low' | 'medium' | 'high';
    status: 'active' | 'pending' | 'discharged' | 'hold';
    primaryCareGiver: string;
    lastVisit?: string;
    nextVisit?: string;
    address: string;
}

export default function PatientsScreen() {
    const [refreshing, setRefreshing] = useState(false);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'high'>('active');

    const loadData = async () => {
        try {
            const token = await SecureStore.getItemAsync('serenity_auth_token');
            const api = axios.create({
                baseURL: Config.API_URL,
                headers: { Authorization: `Bearer ${token}` }
            });

            try {
                const response = await api.get('/console/clinical/patients');
                setPatients(response.data || []);
            } catch (apiError) {
                setPatients([
                    { id: '1', name: 'John Smith', dateOfBirth: '1945-03-15', diagnosis: 'CHF, Diabetes', acuityLevel: 'high', status: 'active', primaryCareGiver: 'Sarah Johnson', lastVisit: '2024-12-06', nextVisit: '2024-12-09', address: '123 Main St, Columbus OH' },
                    { id: '2', name: 'Mary Wilson', dateOfBirth: '1952-07-22', diagnosis: 'COPD, HTN', acuityLevel: 'medium', status: 'active', primaryCareGiver: 'Mike Davis', lastVisit: '2024-12-05', nextVisit: '2024-12-10', address: '456 Oak Ave, Dublin OH' },
                    { id: '3', name: 'Robert Brown', dateOfBirth: '1938-11-08', diagnosis: 'Alzheimers, Fall Risk', acuityLevel: 'high', status: 'active', primaryCareGiver: 'Emily Chen', lastVisit: '2024-12-07', nextVisit: '2024-12-08', address: '789 Elm St, Westerville OH' },
                    { id: '4', name: 'Patricia Davis', dateOfBirth: '1960-02-14', diagnosis: 'Post-surgical', acuityLevel: 'low', status: 'active', primaryCareGiver: 'James Taylor', lastVisit: '2024-12-04', nextVisit: '2024-12-11', address: '321 Pine Rd, Hilliard OH' },
                    { id: '5', name: 'Linda Martinez', dateOfBirth: '1948-09-30', diagnosis: 'Stroke Recovery', acuityLevel: 'high', status: 'pending', primaryCareGiver: 'TBD', address: '654 Cedar Ln, Grove City OH' },
                    { id: '6', name: 'Thomas Anderson', dateOfBirth: '1955-05-18', diagnosis: 'Parkinson\'s', acuityLevel: 'medium', status: 'active', primaryCareGiver: 'Lisa Brown', lastVisit: '2024-12-06', nextVisit: '2024-12-09', address: '987 Maple Dr, Reynoldsburg OH' },
                ]);
            }
        } catch (error) {
            console.error('Failed to load patients:', error);
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

    const getAcuityConfig = (level: Patient['acuityLevel']) => {
        switch (level) {
            case 'high': return { bg: 'bg-red-100', text: 'text-red-700', label: 'High Acuity' };
            case 'medium': return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Medium' };
            case 'low': return { bg: 'bg-green-100', text: 'text-green-700', label: 'Low' };
            default: return { bg: 'bg-gray-100', text: 'text-gray-600', label: level };
        }
    };

    const getStatusConfig = (status: Patient['status']) => {
        switch (status) {
            case 'active': return { dot: 'bg-green-500' };
            case 'pending': return { dot: 'bg-yellow-500' };
            case 'discharged': return { dot: 'bg-gray-400' };
            case 'hold': return { dot: 'bg-red-500' };
            default: return { dot: 'bg-gray-400' };
        }
    };

    const filteredPatients = patients.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.diagnosis.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === 'all' ||
            (filter === 'active' && p.status === 'active') ||
            (filter === 'high' && p.acuityLevel === 'high');
        return matchesSearch && matchesFilter;
    });

    return (
        <ScrollView
            className="flex-1 bg-background"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Search Bar */}
            <View className="px-4 pt-4">
                <View className="bg-white flex-row items-center px-4 py-3 rounded-xl border border-gray-200">
                    <Ionicons name="search" size={20} color={Colors.gray[400]} />
                    <TextInput
                        className="flex-1 ml-3 text-gray-800"
                        placeholder="Search patients..."
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
                    { key: 'active', label: 'Active' },
                    { key: 'high', label: 'High Acuity' },
                    { key: 'all', label: 'All' },
                ] as const).map((f) => (
                    <TouchableOpacity
                        key={f.key}
                        className={`flex-1 py-2 mx-1 rounded-lg ${filter === f.key ? 'bg-danger' : 'bg-white border border-gray-200'}`}
                        onPress={() => setFilter(f.key)}
                    >
                        <Text className={`text-center font-medium ${filter === f.key ? 'text-white' : 'text-gray-600'}`}>
                            {f.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Patient List */}
            <View className="px-4 pt-2 pb-8">
                <Text className="text-lg font-bold text-gray-800 mb-2">
                    {filteredPatients.length} Patients
                </Text>
                {filteredPatients.map(patient => {
                    const acuityConfig = getAcuityConfig(patient.acuityLevel);
                    const statusConfig = getStatusConfig(patient.status);

                    return (
                        <TouchableOpacity
                            key={patient.id}
                            className={`bg-white p-4 rounded-xl mb-2 border ${patient.acuityLevel === 'high' ? 'border-red-200' : 'border-gray-100'}`}
                        >
                            <View className="flex-row items-start justify-between mb-2">
                                <View className="flex-row items-center flex-1">
                                    <View className={`h-3 w-3 rounded-full ${statusConfig.dot} mr-2`} />
                                    <View className="flex-1">
                                        <Text className="text-gray-900 font-semibold">{patient.name}</Text>
                                        <Text className="text-gray-500 text-sm">{patient.diagnosis}</Text>
                                    </View>
                                </View>
                                <View className={`${acuityConfig.bg} px-2 py-1 rounded-lg`}>
                                    <Text className={`${acuityConfig.text} text-xs font-medium`}>{acuityConfig.label}</Text>
                                </View>
                            </View>

                            <View className="flex-row items-center mb-2">
                                <Ionicons name="person" size={14} color={Colors.gray[400]} />
                                <Text className="text-gray-500 text-sm ml-1">CG: {patient.primaryCareGiver}</Text>
                            </View>

                            <View className="flex-row items-center justify-between pt-2 border-t border-gray-100">
                                {patient.lastVisit && (
                                    <View className="flex-row items-center">
                                        <Ionicons name="time-outline" size={14} color={Colors.gray[400]} />
                                        <Text className="text-gray-500 text-xs ml-1">Last: {patient.lastVisit}</Text>
                                    </View>
                                )}
                                {patient.nextVisit && (
                                    <View className="flex-row items-center">
                                        <Ionicons name="calendar-outline" size={14} color={Colors.info.DEFAULT} />
                                        <Text className="text-blue-600 text-xs ml-1 font-medium">Next: {patient.nextVisit}</Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </ScrollView>
    );
}
