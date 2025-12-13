import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { VisitService } from '../../services/visit.service';
import { format } from 'date-fns';

export default function ScheduleScreen() {
    const router = useRouter();
    const [schedule, setSchedule] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadSchedule = async () => {
        try {
            const shifts = await VisitService.getTodaysShifts();
            console.log('Shifts fetched:', shifts.length);

            // Transform API data to UI model
            const uiShifts = shifts.map((s: any) => {
                const start = new Date(s.scheduledStart);
                const end = new Date(s.scheduledEnd);
                const durationMs = end.getTime() - start.getTime();
                const durationMins = Math.round(durationMs / 60000);

                return {
                    id: s.id,
                    time: format(start, 'hh:mm a'),
                    patient: s.patient.name,
                    type: s.type || 'Visit',
                    status: s.status,
                    duration: `${durationMins}m`
                };
            });
            setSchedule(uiShifts);
        } catch (error) {
            console.error('Failed to load schedule:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSchedule();
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadSchedule();
        setRefreshing(false);
    }, []);

    const renderItem = ({ item, index }: { item: any; index: number }) => {
        const isLast = index === schedule.length - 1;
        const isCompleted = item.status === 'completed';

        return (
            <View className="flex-row">
                {/* Timeline Column */}
                <View className="mr-4 items-center">
                    <View className={`w-3 h-3 rounded-full ${isCompleted ? 'bg-success' : 'bg-primary'} z-10`} />
                    {!isLast && <View className="w-0.5 flex-1 bg-gray-200 my-1" />}
                </View>

                {/* Content Card */}
                <TouchableOpacity
                    onPress={() => router.push(`/visit/${item.id}/details`)}
                    className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6"
                >
                    <View className="flex-row justify-between mb-2">
                        <Text className="font-bold text-gray-900 text-lg">{item.time}</Text>
                        <View className={`px-2 py-1 rounded-lg ${isCompleted ? 'bg-green-100' : 'bg-blue-100'}`}>
                            <Text className={`text-xs font-bold uppercase ${isCompleted ? 'text-green-700' : 'text-blue-700'}`}>
                                {item.status}
                            </Text>
                        </View>
                    </View>

                    <Text className="text-gray-900 font-semibold text-base mb-1">{item.patient}</Text>
                    <View className="flex-row items-center space-x-2">
                        <Ionicons name="medkit-outline" size={14} color="#6b7280" />
                        <Text className="text-gray-500 text-sm">{item.type} • {item.duration}</Text>
                    </View>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View className="flex-1 bg-background pt-8">
            <View className="px-6 py-4 bg-white shadow-sm z-10 rounded-b-3xl mb-4">
                <Text className="text-2xl font-bold text-gray-900">My Schedule</Text>
                <Text className="text-gray-500 font-medium">{format(new Date(), 'EEEE, MMM d')}</Text>
            </View>

            <FlatList
                data={schedule}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 24 }}
                className="flex-1"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    !loading ? (
                        <View className="items-center justify-center py-20">
                            <Text className="text-gray-400">No visits scheduled for today.</Text>
                        </View>
                    ) : null
                }
            />
        </View>
    );
}
