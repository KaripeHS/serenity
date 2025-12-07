
import { View, Text, FlatList } from 'react-native';

const SCHEDULE_DATA = [
    { id: '1', time: '08:00 AM', patient: 'Alice Smith', type: 'Wound Care', status: 'Completed' },
    { id: '2', time: '10:00 AM', patient: 'John Doe', type: 'PT Session', status: 'Scheduled' },
    { id: '3', time: '02:00 PM', patient: 'Robert Johnson', type: 'Checkup', status: 'Pending' },
];

export default function ScheduleScreen() {
    return (
        <View className="flex-1 bg-gray-50 p-4">
            <Text className="text-2xl font-bold text-gray-900 mb-6">Today's Schedule</Text>

            <FlatList
                data={SCHEDULE_DATA}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-3 flex-row items-center">
                        <View className="mr-4 items-center w-16">
                            <Text className="font-bold text-gray-800">{item.time.split(' ')[0]}</Text>
                            <Text className="text-xs text-gray-500">{item.time.split(' ')[1]}</Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-lg font-bold text-gray-900">{item.patient}</Text>
                            <Text className="text-gray-600 text-sm">{item.type}</Text>
                        </View>
                        <View className={`px-2 py-1 rounded ${item.status === 'Completed' ? 'bg-green-100' : 'bg-blue-100'}`}>
                            <Text className={`text-xs font-bold ${item.status === 'Completed' ? 'text-green-700' : 'text-blue-700'}`}>
                                {item.status}
                            </Text>
                        </View>
                    </View>
                )}
            />
        </View>
    );
}
