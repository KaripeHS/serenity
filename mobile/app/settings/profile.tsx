/**
 * Edit Profile Screen
 */

import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/DesignSystem';
import { AuthService } from '../../services/auth.service';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Config } from '../../constants/Config';

export default function EditProfileScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        const userData = await AuthService.getUser();
        if (userData) {
            setUser(userData);
            setFirstName(userData.firstName || userData.first_name || '');
            setLastName(userData.lastName || userData.last_name || '');
            setPhone(userData.phone || '');
            setAddress(userData.address || '');
        }
    };

    const handleSave = async () => {
        if (!firstName || !lastName) {
            Alert.alert('Error', 'First and last name are required');
            return;
        }

        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync('serenity_auth_token');
            const api = axios.create({
                baseURL: Config.API_URL,
                headers: { Authorization: `Bearer ${token}` }
            });

            await api.put('/user/profile', {
                firstName,
                lastName,
                phone,
                address,
            });

            Alert.alert('Success', 'Profile updated successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView className="flex-1 bg-background">
            <View className="px-4 pt-4">
                {/* Profile Picture */}
                <View className="items-center mb-6">
                    <View className="h-24 w-24 bg-primary-100 rounded-full items-center justify-center mb-3">
                        <Text className="text-3xl font-bold text-primary">
                            {firstName.charAt(0) || 'U'}{lastName.charAt(0) || 'S'}
                        </Text>
                    </View>
                    <TouchableOpacity>
                        <Text className="text-primary font-medium">Change Photo</Text>
                    </TouchableOpacity>
                </View>

                {/* Form Fields */}
                <View className="mb-4">
                    <Text className="text-gray-700 font-medium mb-2">First Name *</Text>
                    <View className="bg-white border border-gray-200 rounded-xl px-4">
                        <TextInput
                            className="py-4"
                            placeholder="Enter first name"
                            placeholderTextColor={Colors.gray[400]}
                            value={firstName}
                            onChangeText={setFirstName}
                        />
                    </View>
                </View>

                <View className="mb-4">
                    <Text className="text-gray-700 font-medium mb-2">Last Name *</Text>
                    <View className="bg-white border border-gray-200 rounded-xl px-4">
                        <TextInput
                            className="py-4"
                            placeholder="Enter last name"
                            placeholderTextColor={Colors.gray[400]}
                            value={lastName}
                            onChangeText={setLastName}
                        />
                    </View>
                </View>

                <View className="mb-4">
                    <Text className="text-gray-700 font-medium mb-2">Email</Text>
                    <View className="bg-gray-100 border border-gray-200 rounded-xl px-4 flex-row items-center">
                        <TextInput
                            className="flex-1 py-4 text-gray-500"
                            value={user?.email || ''}
                            editable={false}
                        />
                        <Ionicons name="lock-closed" size={16} color={Colors.gray[400]} />
                    </View>
                    <Text className="text-gray-400 text-xs mt-1">Email cannot be changed</Text>
                </View>

                <View className="mb-4">
                    <Text className="text-gray-700 font-medium mb-2">Phone Number</Text>
                    <View className="bg-white border border-gray-200 rounded-xl px-4">
                        <TextInput
                            className="py-4"
                            placeholder="Enter phone number"
                            placeholderTextColor={Colors.gray[400]}
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />
                    </View>
                </View>

                <View className="mb-6">
                    <Text className="text-gray-700 font-medium mb-2">Address</Text>
                    <View className="bg-white border border-gray-200 rounded-xl px-4">
                        <TextInput
                            className="py-4"
                            placeholder="Enter address"
                            placeholderTextColor={Colors.gray[400]}
                            value={address}
                            onChangeText={setAddress}
                            multiline
                            numberOfLines={2}
                        />
                    </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    className={`py-4 rounded-xl items-center ${loading ? 'bg-gray-400' : 'bg-primary'}`}
                    onPress={handleSave}
                    disabled={loading}
                >
                    <Text className="text-white font-bold text-lg">
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Text>
                </TouchableOpacity>

                <View className="h-8" />
            </View>
        </ScrollView>
    );
}
