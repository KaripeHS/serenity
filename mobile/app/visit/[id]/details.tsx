
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { VisitService } from '../../../services/visit.service';
import { FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VisitDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [visit, setVisit] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDetails();
    }, [id]);

    async function loadDetails() {
        try {
            const data = await VisitService.getVisitDetails(id as string);
            setVisit(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#2563EB" /></View>;
    if (!visit) return <View className="flex-1 justify-center items-center"><Text>Visit not found</Text></View>;

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="bg-white p-4 border-b border-gray-200 flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <FontAwesome5 name="arrow-left" size={20} color="#4B5563" />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-gray-900">Patient Details</Text>
            </View>

            <ScrollView className="p-4">
                {/* Patient Info Card */}
                <View className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-4">
                    <View className="flex-row items-center mb-4">
                        <View className="h-12 w-12 bg-blue-100 rounded-full items-center justify-center mr-3">
                            <FontAwesome5 name="user" size={20} color="#2563EB" />
                        </View>
                        <View>
                            <Text className="text-xl font-bold text-gray-900">{visit.patient.name}</Text>
                            <Text className="text-gray-500">DOB: {visit.patient.dob}</Text>
                        </View>
                    </View>

                    <View className="space-y-3">
                        <View className="flex-row items-start">
                            <FontAwesome5 name="map-marker-alt" size={16} color="#6B7280" style={{ width: 24, marginTop: 2 }} />
                            <Text className="text-gray-700 flex-1">{visit.patient.address}</Text>
                        </View>
                        <View className="flex-row items-start">
                            <FontAwesome5 name="phone" size={16} color="#6B7280" style={{ width: 24, marginTop: 2 }} />
                            <Text className="text-gray-700 flex-1">{visit.patient.emergencyContact.name}</Text>
                        </View>
                        <View className="flex-row items-start">
                            <FontAwesome5 name="allergies" size={16} color="#EF4444" style={{ width: 24, marginTop: 2 }} />
                            <Text className="text-red-600 flex-1 font-medium">Allergies: {visit.patient.allergies.join(', ')}</Text>
                        </View>
                    </View>
                </View>

                {/* Plan of Care */}
                <Text className="text-lg font-bold text-gray-900 mb-2">Care Plan Tasks</Text>
                <View className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-4">
                    {visit.carePlan.tasks.map((task: any) => (
                        <View key={task.id} className="flex-row items-center mb-3 last:mb-0">
                            <FontAwesome5 name="check-circle" size={18} color="#9CA3AF" className="mr-3" />
                            <Text className="text-gray-700 font-medium ml-3 flex-1">{task.text}</Text>
                            {task.required && <View className="bg-red-100 px-2 py-0.5 rounded"><Text className="text-red-600 text-[10px] font-bold">REQ</Text></View>}
                        </View>
                    ))}
                </View>

                {/* Medications */}
                <Text className="text-lg font-bold text-gray-900 mb-2">Medications</Text>
                <View className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6">
                    {visit.carePlan.meds.map((med: any, index: number) => (
                        <View key={index} className="flex-row items-center mb-3 last:mb-0 border-b border-gray-50 last:border-0 pb-2 last:pb-0">
                            <FontAwesome5 name="pills" size={16} color="#4B5563" />
                            <View className="ml-3 flex-1">
                                <Text className="text-gray-900 font-bold">{med.name} <Text className="font-normal text-gray-500">({med.dosage})</Text></Text>
                                <Text className="text-gray-500 text-sm">{med.frequency}</Text>
                            </View>
                        </View>
                    ))}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}
