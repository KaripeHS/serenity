import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useRef } from 'react';
import { MessageService } from '../../services/message.service';
import { AuthService } from '../../services/auth.service';
import { format } from 'date-fns';

export default function ConversationScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams(); // conversationId

    // Determine conversationId (it might be passed as query param or path param)
    const conversationId = Array.isArray(id) ? id[0] : id;

    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        loadData();
        // Poll for new messages every 10 seconds (Simple real-time simulation)
        const interval = setInterval(loadMessages, 10000);
        return () => clearInterval(interval);
    }, [conversationId]);

    const loadData = async () => {
        const user = await AuthService.getUser();
        setCurrentUser(user);
        await loadMessages();
    };

    const loadMessages = async () => {
        if (!conversationId) return;
        try {
            const data = await MessageService.getMessages(conversationId);
            setMessages(data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    };

    const handleSend = async () => {
        if (!inputText.trim() || !conversationId) return;

        try {
            const tempId = Date.now().toString();
            // Optimistic Update
            const newMessage = {
                id: tempId,
                content: inputText,
                senderId: currentUser?.id,
                isMe: true,
                createdAt: new Date().toISOString(),
                sending: true
            };

            setMessages(prev => [...prev, newMessage]);
            setInputText('');

            // Actual API Call
            await MessageService.sendMessage(conversationId, newMessage.content);

            // Refresh to get real ID and server timestamp
            await loadMessages();

        } catch (error) {
            console.error('Failed to send message:', error);
            // Show error state (simplification: remove optimistic message or show error icon)
        }
    };

    const renderMessage = ({ item }: { item: any }) => {
        const isMe = item.isMe;

        return (
            <View className={`flex-row mb-4 ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && (
                    <View className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center mr-2 self-end">
                        <FontAwesome5 name="user" size={12} color="#6B7280" />
                    </View>
                )}
                <View
                    className={`px-4 py-3 rounded-2xl max-w-[75%] ${isMe ? 'bg-blue-600 rounded-br-none' : 'bg-white rounded-bl-none shadow-sm'
                        }`}
                >
                    <Text className={`text-base ${isMe ? 'text-white' : 'text-gray-800'}`}>
                        {item.content}
                    </Text>
                    <Text className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                        {format(new Date(item.createdAt), 'h:mm a')} {item.sending && '• Sending...'}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white px-4 py-3 border-b border-gray-100 flex-row items-center justify-between shadow-sm">
                <TouchableOpacity onPress={() => router.back()} className="p-2">
                    <Ionicons name="chevron-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <View className="items-center">
                    <Text className="font-bold text-gray-900 text-lg">Chat</Text>
                    <Text className="text-xs text-green-600 font-medium">Online</Text>
                </View>
                <View className="w-10" />
            </View>

            {/* Messages List */}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 16 }}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                className="flex-1"
                ListEmptyComponent={
                    !loading ? (
                        <View className="items-center justify-center py-10">
                            <Text className="text-gray-400">No messages yet. Start the conversation!</Text>
                        </View>
                    ) : null
                }
            />

            {/* Input Area */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <View className="bg-white px-4 py-3 border-t border-gray-100 flex-row items-center pb-8">
                    <TouchableOpacity className="mr-3">
                        <Ionicons name="add-circle-outline" size={28} color="#6B7280" />
                    </TouchableOpacity>

                    <TextInput
                        className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-base text-gray-800 mr-3"
                        placeholder="Type a message..."
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        maxLength={500}
                    />

                    <TouchableOpacity
                        onPress={handleSend}
                        disabled={!inputText.trim()}
                        className={`w-10 h-10 rounded-full items-center justify-center ${inputText.trim() ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                    >
                        <Ionicons name="send" size={18} color="white" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
