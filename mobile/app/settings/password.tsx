import { View, Text, TextInput, TouchableOpacity, Alert, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SettingsService } from '../../services/settings.service';

export default function ChangePasswordScreen() {
    const router = useRouter();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'All fields are required.');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match.');
            return;
        }

        if (newPassword.length < 8) {
            Alert.alert('Error', 'New password must be at least 8 characters long.');
            return;
        }

        setLoading(true);
        try {
            await SettingsService.changePassword(currentPassword, newPassword);
            Alert.alert('Success', 'Your password has been updated.', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            const msg = error.response?.data?.error || 'Failed to update password. Please check your current password.';
            Alert.alert('Error', msg);
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
                <Text className="font-bold text-gray-900 text-lg">Change Password</Text>
                <View className="w-10" />
            </View>

            <View className="flex-1 p-6">
                <Text className="text-gray-500 mb-6">
                    Use a strong password with at least 8 characters.
                </Text>

                <View className="space-y-4">
                    <View>
                        <Text className="text-gray-700 font-medium mb-1">Current Password</Text>
                        <TextInput
                            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
                            secureTextEntry
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            placeholder="Enter current password"
                        />
                    </View>

                    <View>
                        <Text className="text-gray-700 font-medium mb-1">New Password</Text>
                        <TextInput
                            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
                            secureTextEntry
                            value={newPassword}
                            onChangeText={setNewPassword}
                            placeholder="Min. 8 characters"
                        />
                    </View>

                    <View>
                        <Text className="text-gray-700 font-medium mb-1">Confirm New Password</Text>
                        <TextInput
                            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
                            secureTextEntry
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="Re-enter new password"
                        />
                    </View>
                </View>

                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={loading}
                    className={`mt-8 py-4 rounded-xl items-center shadow-md ${loading ? 'bg-blue-400' : 'bg-blue-600'
                        }`}
                >
                    <Text className="text-white font-bold text-lg">
                        {loading ? 'Updating...' : 'Update Password'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
