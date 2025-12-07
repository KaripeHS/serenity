
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useState } from 'react';
import { VisitService } from '../services/visit.service';
import { useRouter } from 'expo-router';

interface Visit {
    id: string;
    patientName: string;
    address: string;
    status: 'scheduled' | 'in_progress' | 'completed';
    scheduledStart: string;
    scheduledEnd: string;
}

interface ActiveVisitProps {
    visit: Visit;
    onStatusChange: () => void;
}

export function ActiveVisit({ visit, onStatusChange }: ActiveVisitProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleClockIn() {
        setLoading(true);
        try {
            await VisitService.clockIn(visit.id);
            Alert.alert('Success', 'Clocked In Successfully');
            onStatusChange();
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    }

    function handleClockOut() {
        // Navigate to completion screen -> Documentation
        router.push(`/visit/${visit.id}/complete`);
    }

    function viewDetails() {
        router.push(`/visit/${visit.id}/details`);
    }

    const isInProgress = visit.status === 'in_progress';

    return (
        <View className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6 active:bg-gray-50">
            <View className="flex-row justify-between mb-2">
                <Text className="text-gray-500 font-medium">
                    {new Date(visit.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                    {new Date(visit.scheduledEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <View className={`${isInProgress ? 'bg-green-100' : 'bg-blue-100'} px-2 py-1 rounded`}>
                    <Text className={`${isInProgress ? 'text-green-700' : 'text-blue-700'} text-xs font-bold uppercase`}>
                        {visit.status.replace('_', ' ')}
                    </Text>
                </View>
            </View>

            <Text className="text-xl font-bold text-gray-900 mb-1">{visit.patientName}</Text>
            <Text className="text-gray-600 mb-4">{visit.address}</Text>

            <View className="flex-row space-x-3">
                <TouchableOpacity
                    className={`${isInProgress ? 'bg-red-600' : 'bg-emerald-600'} px-4 py-3 rounded-lg flex-1 items-center flex-row justify-center space-x-2`}
                    onPress={isInProgress ? handleClockOut : handleClockIn}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <FontAwesome5 name={isInProgress ? "sign-out-alt" : "sign-in-alt"} size={16} color="white" />
                            <Text className="text-white font-bold text-lg">
                                {isInProgress ? 'End Visit' : 'Start Visit'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    className="bg-gray-100 p-3 rounded-lg justify-center"
                    onPress={viewDetails}
                >
                    <FontAwesome5 name="info-circle" size={24} color="#4B5563" />
                </TouchableOpacity>
            </View>

            {isInProgress && (
                <Text className="text-center text-xs text-gray-400 mt-2">
                    <FontAwesome5 name="satellite-dish" size={10} /> GPS Monitoring Active
                </Text>
            )}
        </View>
    );
}
