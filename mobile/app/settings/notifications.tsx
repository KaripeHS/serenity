import { View, Text, TouchableOpacity, Switch, SafeAreaView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SettingsService } from '../../services/settings.service';

export default function NotificationSettingsScreen() {
    const router = useRouter();
    // In a real app, initialize these from current user preferences (fetch on mount)
    // For now, defaulting to true to simulate an active state.
    const [pushEnabled, setPushEnabled] = useState(true);
    const [emailEnabled, setEmailEnabled] = useState(true);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            await SettingsService.updateNotificationPreferences(pushEnabled, emailEnabled);
            Alert.alert('Saved', 'Your preferences have been updated.');
        } catch (error) {
            Alert.alert('Error', 'Failed to save preferences.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white px-4 py-3 border-b border-gray-100 flex-row items-center justify-between shadow-sm">
                <TouchableOpacity onPress={() => router.back()} className="p-2">
                    <Ionicons name="chevron-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text className="font-bold text-gray-900 text-lg">Notifications</Text>
                <View className="w-10" />
            </View>

            <View className="flex-1 p-6">
                <Text className="text-gray-500 mb-6">
                    Manage how you receive alerts and updates.
                </Text>

                <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-6">
                    <View className="flex-row items-center justify-between">
                        <View className="flex-1 pr-4">
                            <Text className="text-lg font-semibold text-gray-900">Push Notifications</Text>
                            <Text className="text-gray-500 text-sm">
                                Receive instant alerts for schedule changes, messages, and urgent updates.
                            </Text>
                        </View>
                        <Switch
                            trackColor={{ false: '#767577', true: '#2563EB' }}
                            thumbColor={pushEnabled ? '#f4f3f4' : '#f4f3f4'}
                            onValueChange={setPushEnabled}
                            value={pushEnabled}
                        />
                    </View>

                    <View className="h-[1px] bg-gray-100" />

                    <View className="flex-row items-center justify-between">
                        <View className="flex-1 pr-4">
                            <Text className="text-lg font-semibold text-gray-900">Email Notifications</Text>
                            <Text className="text-gray-500 text-sm">
                                Receive daily summaries, pay statements, and official announcements.
                            </Text>
                        </View>
                        <Switch
                            trackColor={{ false: '#767577', true: '#2563EB' }}
                            thumbColor={emailEnabled ? '#f4f3f4' : '#f4f3f4'}
                            onValueChange={setEmailEnabled}
                            value={emailEnabled}
                        />
                    </View>
                </View>

                <TouchableOpacity
                    onPress={handleSave}
                    disabled={loading}
                    className={`mt-8 py-4 rounded-xl items-center shadow-md ${loading ? 'bg-blue-400' : 'bg-blue-600'
                        }`}
                >
                    <Text className="text-white font-bold text-lg">
                        {loading ? 'Saving...' : 'Save Preferences'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
