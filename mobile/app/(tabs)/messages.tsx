
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Mock Data for Phase 33 Visualization
const CONVERSATIONS = [
    {
        id: '1',
        name: 'Office Dispatch',
        lastMessage: 'Please confirm Mrs. Doe\'s schedule change.',
        time: '10:30 AM',
        unread: 2,
        avatar: null // Default icon
    },
    {
        id: '2',
        name: 'Mary Smith (RN)',
        lastMessage: 'Updated care plan for John is live.',
        time: 'Yesterday',
        unread: 0,
        avatar: null
    }
];

export default function MessagesScreen() {
    const router = useRouter();

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity className="flex-row items-center p-4 bg-white border-b border-gray-100 active:bg-gray-50">
            <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-4">
                <FontAwesome5 name="user-nurse" size={20} color="#2563EB" />
            </View>
            <View className="flex-1">
                <View className="flex-row justify-between mb-1">
                    <Text className="font-bold text-gray-900 text-base">{item.name}</Text>
                    <Text className="text-xs text-gray-500">{item.time}</Text>
                </View>
                <Text className="text-gray-600 text-sm" numberOfLines={1}>{item.lastMessage}</Text>
            </View>
            {item.unread > 0 && (
                <View className="w-6 h-6 bg-red-500 rounded-full items-center justify-center ml-2">
                    <Text className="text-white text-xs font-bold">{item.unread}</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-gray-50">
            <View className="p-4 bg-white shadow-sm mb-2">
                <Text className="text-2xl font-bold text-gray-800">Messages</Text>
            </View>

            <FlatList
                data={CONVERSATIONS}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingBottom: 20 }}
            />

            <TouchableOpacity className="absolute bottom-6 right-6 w-14 h-14 bg-blue-600 rounded-full items-center justify-center shadow-lg">
                <FontAwesome5 name="edit" size={20} color="white" />
            </TouchableOpacity>
        </View>
    );
}
