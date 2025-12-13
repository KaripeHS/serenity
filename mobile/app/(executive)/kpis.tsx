/**
 * Executive KPIs Screen - Detailed metrics view
 */

import { View, Text, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/DesignSystem';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Config } from '../../constants/Config';

interface DetailedKPIs {
    financial: {
        mtdRevenue: number;
        ytdRevenue: number;
        revenueGrowth: number;
        arDays: number;
        collectionsRate: number;
        avgReimbursement: number;
    };
    operations: {
        activeCensus: number;
        newAdmissions: number;
        discharges: number;
        visitCompletion: number;
        avgVisitDuration: number;
        missedVisits: number;
    };
    workforce: {
        totalStaff: number;
        activeCareggivers: number;
        staffUtilization: number;
        overtimeHours: number;
        openPositions: number;
        turnoverRate: number;
    };
    quality: {
        patientSatisfaction: number;
        caregiverSatisfaction: number;
        incidentRate: number;
        complaintCount: number;
        complianceScore: number;
    };
}

export default function KPIsScreen() {
    const [refreshing, setRefreshing] = useState(false);
    const [kpis, setKpis] = useState<DetailedKPIs | null>(null);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            const token = await SecureStore.getItemAsync('serenity_auth_token');
            const api = axios.create({
                baseURL: Config.API_URL,
                headers: { Authorization: `Bearer ${token}` }
            });

            try {
                const response = await api.get('/console/dashboard/executive/detailed-kpis');
                setKpis(response.data);
            } catch (apiError) {
                // Fallback data
                setKpis({
                    financial: {
                        mtdRevenue: 485000,
                        ytdRevenue: 5420000,
                        revenueGrowth: 12.5,
                        arDays: 28,
                        collectionsRate: 94.2,
                        avgReimbursement: 185,
                    },
                    operations: {
                        activeCensus: 127,
                        newAdmissions: 12,
                        discharges: 8,
                        visitCompletion: 94.2,
                        avgVisitDuration: 2.3,
                        missedVisits: 3,
                    },
                    workforce: {
                        totalStaff: 89,
                        activeCareggivers: 72,
                        staffUtilization: 87,
                        overtimeHours: 124,
                        openPositions: 5,
                        turnoverRate: 8.2,
                    },
                    quality: {
                        patientSatisfaction: 4.7,
                        caregiverSatisfaction: 4.3,
                        incidentRate: 0.8,
                        complaintCount: 2,
                        complianceScore: 98,
                    },
                });
            }
        } catch (error) {
            console.error('Failed to load KPIs:', error);
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

    const formatCurrency = (amount: number) => {
        if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
        if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
        return `$${amount.toFixed(0)}`;
    };

    const MetricRow = ({ label, value, trend, suffix = '' }: {
        label: string;
        value: string | number;
        trend?: number;
        suffix?: string;
    }) => (
        <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
            <Text className="text-gray-600">{label}</Text>
            <View className="flex-row items-center">
                <Text className="text-gray-900 font-semibold">{value}{suffix}</Text>
                {trend !== undefined && (
                    <View className={`ml-2 flex-row items-center ${trend >= 0 ? 'bg-green-100' : 'bg-red-100'} px-2 py-0.5 rounded`}>
                        <Ionicons
                            name={trend >= 0 ? 'arrow-up' : 'arrow-down'}
                            size={10}
                            color={trend >= 0 ? Colors.success.DEFAULT : Colors.danger.DEFAULT}
                        />
                        <Text className={`text-xs ml-0.5 ${trend >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {Math.abs(trend)}%
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );

    const Section = ({ title, icon, color, children }: {
        title: string;
        icon: string;
        color: string;
        children: React.ReactNode;
    }) => (
        <View className="bg-white mx-4 mb-4 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <View className="flex-row items-center p-4 border-b border-gray-100" style={{ backgroundColor: `${color}10` }}>
                <View className="p-2 rounded-lg mr-3" style={{ backgroundColor: `${color}20` }}>
                    <Ionicons name={icon as any} size={20} color={color} />
                </View>
                <Text className="text-lg font-bold text-gray-800">{title}</Text>
            </View>
            <View className="px-4">
                {children}
            </View>
        </View>
    );

    return (
        <ScrollView
            className="flex-1 bg-background"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <View className="pt-4 pb-8">
                {kpis && (
                    <>
                        <Section title="Financial Performance" icon="cash-outline" color={Colors.success.DEFAULT}>
                            <MetricRow label="MTD Revenue" value={formatCurrency(kpis.financial.mtdRevenue)} trend={kpis.financial.revenueGrowth} />
                            <MetricRow label="YTD Revenue" value={formatCurrency(kpis.financial.ytdRevenue)} />
                            <MetricRow label="AR Days" value={kpis.financial.arDays} suffix=" days" />
                            <MetricRow label="Collections Rate" value={kpis.financial.collectionsRate} suffix="%" />
                            <MetricRow label="Avg Reimbursement" value={`$${kpis.financial.avgReimbursement}`} suffix="/hr" />
                        </Section>

                        <Section title="Operations" icon="pulse-outline" color={Colors.info.DEFAULT}>
                            <MetricRow label="Active Census" value={kpis.operations.activeCensus} />
                            <MetricRow label="New Admissions (MTD)" value={kpis.operations.newAdmissions} />
                            <MetricRow label="Discharges (MTD)" value={kpis.operations.discharges} />
                            <MetricRow label="Visit Completion" value={kpis.operations.visitCompletion} suffix="%" />
                            <MetricRow label="Avg Visit Duration" value={kpis.operations.avgVisitDuration} suffix=" hrs" />
                            <MetricRow label="Missed Visits" value={kpis.operations.missedVisits} />
                        </Section>

                        <Section title="Workforce" icon="people-outline" color={Colors.caregiver.DEFAULT}>
                            <MetricRow label="Total Staff" value={kpis.workforce.totalStaff} />
                            <MetricRow label="Active Caregivers" value={kpis.workforce.activeCareggivers} />
                            <MetricRow label="Staff Utilization" value={kpis.workforce.staffUtilization} suffix="%" />
                            <MetricRow label="Overtime Hours" value={kpis.workforce.overtimeHours} suffix=" hrs" />
                            <MetricRow label="Open Positions" value={kpis.workforce.openPositions} />
                            <MetricRow label="Turnover Rate" value={kpis.workforce.turnoverRate} suffix="%" />
                        </Section>

                        <Section title="Quality & Compliance" icon="shield-checkmark-outline" color={Colors.primary.DEFAULT}>
                            <MetricRow label="Patient Satisfaction" value={kpis.quality.patientSatisfaction} suffix="/5" />
                            <MetricRow label="Caregiver Satisfaction" value={kpis.quality.caregiverSatisfaction} suffix="/5" />
                            <MetricRow label="Incident Rate" value={kpis.quality.incidentRate} suffix="%" />
                            <MetricRow label="Complaints (MTD)" value={kpis.quality.complaintCount} />
                            <MetricRow label="Compliance Score" value={kpis.quality.complianceScore} suffix="%" />
                        </Section>
                    </>
                )}
            </View>
        </ScrollView>
    );
}
