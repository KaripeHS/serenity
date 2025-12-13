
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';
import { MessageService } from '../../services/message.service';
import { format } from 'date-fns';

export default function MessagesScreen() {
    const router = useRouter();
    const [conversations, setConversations] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadConversations = async () => {
        try {
            const data = await MessageService.getConversations();

            // Transform data for UI if needed
            const formatted = data.map((c: any) => ({
                id: c.id,
                name: `${c.otherUser?.firstName || 'Unknown'} ${c.otherUser?.lastName || ''}`.trim(),
                lastMessage: c.lastMessage || 'No messages yet',
                time: c.lastMessageAt ? format(new Date(c.lastMessageAt), 'h:mm a') : '',
                unread: 0, // Backend needs to provide this count
                avatar: c.otherUser?.role === 'caregiver' ? 'user-nurse' : 'headset',
                initials: `${c.otherUser?.firstName?.[0] || '?'}${c.otherUser?.lastName?.[0] || ''}`
            }));

            setConversations(formatted);
        } catch (error) {
            console.error('Failed to load conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadConversations();
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadConversations();
        setRefreshing(false);
    }, []);

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            onPress={() => router.push(`/messaging/${item.id}` as any)}
            className="flex-row items-center p-4 bg-white mb-3 rounded-2xl shadow-sm border border-gray-100"
        >
            <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${item.unread > 0 ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <Text className="text-lg font-bold text-gray-500">{item.initials}</Text>
            </View>
            <View className="flex-1">
                <View className="flex-row justify-between mb-1">
                    <Text className={`text-base ${item.unread > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                        {item.name}
                    </Text>
                    <Text className={`text-xs ${item.unread > 0 ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
                        {item.time}
                    </Text>
                </View>
                <Text
                    className={`text-sm ${item.unread > 0 ? 'text-gray-800 font-medium' : 'text-gray-500'}`}
                    numberOfLines={1}
                >
                    {item.lastMessage}
                </Text>
            </View>
            {item.unread > 0 && (
                <View className="w-3 h-3 bg-blue-600 rounded-full ml-2" />
            )}
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-background pt-8">
            <View className="px-6 py-4 bg-white shadow-sm z-10 rounded-b-3xl mb-4 flex-row justify-between items-center">
                <View>
                    <Text className="text-2xl font-bold text-gray-900">Messages</Text>
                    <Text className="text-gray-500 font-medium">Inbox</Text>
                </View>
                <TouchableOpacity className="bg-gray-50 p-2 rounded-full">
                    <Ionicons name="search" size={20} color="#6b7280" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={conversations}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 20 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    !loading ? (
                        <View className="items-center justify-center py-20">
                            <Text className="text-gray-400">No conversations found.</Text>
                        </View>
                    ) : null
                }
            />

            <TouchableOpacity className="absolute bottom-6 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg shadow-blue-300">
                <Ionicons name="create-outline" size={28} color="white" />
            </TouchableOpacity>
        </View>
    );
}
