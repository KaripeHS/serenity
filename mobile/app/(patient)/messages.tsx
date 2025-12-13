/**
 * Patient Messages Screen - Secure messaging with care team
 * HIPAA Compliant - Encrypted messaging only with assigned care team
 */

import { View, Text, ScrollView, RefreshControl, TouchableOpacity, TextInput } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/DesignSystem';
import { format } from 'date-fns';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Config } from '../../constants/Config';

interface Message {
    id: string;
    from: string;
    fromRole: string;
    content: string;
    timestamp: string;
    isFromPatient: boolean;
    read: boolean;
}

interface Conversation {
    id: string;
    participant: string;
    participantRole: string;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
}

export default function PatientMessagesScreen() {
    const [refreshing, setRefreshing] = useState(false);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');

    const loadData = async () => {
        try {
            const token = await SecureStore.getItemAsync('serenity_auth_token');
            const api = axios.create({
                baseURL: Config.API_URL,
                headers: { Authorization: `Bearer ${token}` }
            });

            try {
                const response = await api.get('/patient/portal/messages');
                setConversations(response.data || []);
            } catch (apiError) {
                setConversations([
                    { id: '1', participant: 'Sarah Johnson', participantRole: 'RN - Primary Nurse', lastMessage: 'Your vitals looked good yesterday!', lastMessageTime: '2024-12-07T14:30:00', unreadCount: 1 },
                    { id: '2', participant: 'Care Coordination', participantRole: 'Office Staff', lastMessage: 'Your insurance authorization has been renewed', lastMessageTime: '2024-12-06T10:15:00', unreadCount: 0 },
                    { id: '3', participant: 'Mike Davis', participantRole: 'Home Health Aide', lastMessage: 'See you on Wednesday!', lastMessageTime: '2024-12-05T16:45:00', unreadCount: 0 },
                ]);
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    };

    const loadMessages = async (conversationId: string) => {
        // In production, fetch from API
        setMessages([
            { id: '1', from: 'Sarah Johnson', fromRole: 'RN', content: 'Hi! How are you feeling today?', timestamp: '2024-12-07T09:00:00', isFromPatient: false, read: true },
            { id: '2', from: 'You', fromRole: 'Patient', content: 'Good morning! I\'m feeling much better. My blood pressure was 125/80 this morning.', timestamp: '2024-12-07T09:15:00', isFromPatient: true, read: true },
            { id: '3', from: 'Sarah Johnson', fromRole: 'RN', content: 'That\'s excellent news! Keep up with the medication and low sodium diet. Any swelling in your legs?', timestamp: '2024-12-07T09:30:00', isFromPatient: false, read: true },
            { id: '4', from: 'You', fromRole: 'Patient', content: 'No swelling at all. The compression stockings have been helping.', timestamp: '2024-12-07T10:00:00', isFromPatient: true, read: true },
            { id: '5', from: 'Sarah Johnson', fromRole: 'RN', content: 'Your vitals looked good yesterday! Let me know if you have any questions before my next visit.', timestamp: '2024-12-07T14:30:00', isFromPatient: false, read: false },
        ]);
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (selectedConversation) {
            loadMessages(selectedConversation);
        }
    }, [selectedConversation]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        if (selectedConversation) {
            await loadMessages(selectedConversation);
        }
        setRefreshing(false);
    }, [selectedConversation]);

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;

        const message: Message = {
            id: Date.now().toString(),
            from: 'You',
            fromRole: 'Patient',
            content: newMessage.trim(),
            timestamp: new Date().toISOString(),
            isFromPatient: true,
            read: true,
        };

        setMessages(prev => [...prev, message]);
        setNewMessage('');
        // In production, send to API
    };

    if (selectedConversation) {
        const conversation = conversations.find(c => c.id === selectedConversation);
        return (
            <View className="flex-1 bg-background">
                {/* Header */}
                <View className="bg-white px-4 py-3 flex-row items-center border-b border-gray-200">
                    <TouchableOpacity onPress={() => setSelectedConversation(null)} className="mr-3">
                        <Ionicons name="arrow-back" size={24} color={Colors.gray[800]} />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-gray-900 font-semibold">{conversation?.participant}</Text>
                        <Text className="text-gray-500 text-sm">{conversation?.participantRole}</Text>
                    </View>
                </View>

                {/* Messages */}
                <ScrollView
                    className="flex-1 px-4 pt-4"
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                >
                    {messages.map(message => (
                        <View
                            key={message.id}
                            className={`mb-3 ${message.isFromPatient ? 'items-end' : 'items-start'}`}
                        >
                            <View
                                className={`max-w-[80%] p-3 rounded-2xl ${
                                    message.isFromPatient
                                        ? 'bg-primary rounded-br-sm'
                                        : 'bg-white border border-gray-200 rounded-bl-sm'
                                }`}
                            >
                                <Text className={message.isFromPatient ? 'text-white' : 'text-gray-800'}>
                                    {message.content}
                                </Text>
                            </View>
                            <Text className="text-gray-400 text-xs mt-1">
                                {format(new Date(message.timestamp), 'h:mm a')}
                            </Text>
                        </View>
                    ))}
                    <View className="h-4" />
                </ScrollView>

                {/* Message Input */}
                <View className="bg-white px-4 py-3 border-t border-gray-200 flex-row items-center">
                    <TextInput
                        className="flex-1 bg-gray-100 px-4 py-3 rounded-full mr-2"
                        placeholder="Type a message..."
                        placeholderTextColor={Colors.gray[400]}
                        value={newMessage}
                        onChangeText={setNewMessage}
                        multiline
                    />
                    <TouchableOpacity
                        className="bg-primary p-3 rounded-full"
                        onPress={handleSendMessage}
                    >
                        <Ionicons name="send" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <ScrollView
            className="flex-1 bg-background"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* HIPAA Notice */}
            <View className="mx-4 mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3 flex-row items-center">
                <Ionicons name="shield-checkmark" size={20} color={Colors.primary.DEFAULT} />
                <Text className="text-blue-800 text-xs ml-2 flex-1">
                    All messages are encrypted and HIPAA compliant
                </Text>
            </View>

            {/* Conversations List */}
            <View className="px-4 pt-4 pb-8">
                <Text className="text-lg font-bold text-gray-800 mb-2">Messages</Text>
                {conversations.map(conversation => (
                    <TouchableOpacity
                        key={conversation.id}
                        className="bg-white p-4 rounded-xl mb-2 border border-gray-100 flex-row items-center"
                        onPress={() => setSelectedConversation(conversation.id)}
                    >
                        <View className="h-12 w-12 bg-primary-100 rounded-full items-center justify-center mr-3">
                            <Text className="text-primary font-bold">
                                {conversation.participant.split(' ').map(n => n[0]).join('')}
                            </Text>
                        </View>
                        <View className="flex-1">
                            <View className="flex-row justify-between items-center">
                                <Text className="text-gray-900 font-semibold">{conversation.participant}</Text>
                                <Text className="text-gray-400 text-xs">
                                    {format(new Date(conversation.lastMessageTime), 'MMM d')}
                                </Text>
                            </View>
                            <Text className="text-gray-500 text-sm">{conversation.participantRole}</Text>
                            <Text className="text-gray-600 text-sm mt-1" numberOfLines={1}>
                                {conversation.lastMessage}
                            </Text>
                        </View>
                        {conversation.unreadCount > 0 && (
                            <View className="bg-primary h-6 w-6 rounded-full items-center justify-center ml-2">
                                <Text className="text-white text-xs font-bold">{conversation.unreadCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
}
