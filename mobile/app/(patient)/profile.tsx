/**
 * Patient Profile Screen - Personal information and settings
 * HIPAA Compliant - Patient can only see/edit their own information
 */

import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/DesignSystem';
import { AuthService } from '../../services/auth.service';
import * as SecureStore from 'expo-secure-store';

export default function PatientProfileScreen() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        const userData = await AuthService.getUser();
        setUser(userData);
    };

    const handleLogout = () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        await SecureStore.deleteItemAsync('serenity_auth_token');
                        router.replace('/login');
                    }
                }
            ]
        );
    };

    const MenuItem = ({ icon, title, subtitle, onPress, danger = false }: {
        icon: string;
        title: string;
        subtitle?: string;
        onPress: () => void;
        danger?: boolean;
    }) => (
        <TouchableOpacity
            className={`bg-white p-4 rounded-xl flex-row items-center mb-2 border ${danger ? 'border-red-200' : 'border-gray-100'}`}
            onPress={onPress}
        >
            <View className={`p-2 rounded-lg mr-3 ${danger ? 'bg-red-100' : 'bg-gray-100'}`}>
                <Ionicons name={icon as any} size={20} color={danger ? Colors.danger.DEFAULT : Colors.gray[600]} />
            </View>
            <View className="flex-1">
                <Text className={`font-medium ${danger ? 'text-red-600' : 'text-gray-800'}`}>{title}</Text>
                {subtitle && <Text className="text-gray-500 text-sm">{subtitle}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.gray[400]} />
        </TouchableOpacity>
    );

    return (
        <ScrollView className="flex-1 bg-background">
            {/* Profile Header */}
            <View className="bg-primary px-6 pt-8 pb-6 items-center rounded-b-3xl">
                <View className="h-24 w-24 bg-white/20 rounded-full items-center justify-center mb-4">
                    <Text className="text-3xl font-bold text-white">
                        {user?.firstName?.charAt(0) || 'P'}{user?.lastName?.charAt(0) || 'T'}
                    </Text>
                </View>
                <Text className="text-2xl font-bold text-white">
                    {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Patient'}
                </Text>
                <Text className="text-blue-200 text-sm mt-1">{user?.email || ''}</Text>
            </View>

            {/* HIPAA Notice */}
            <View className="mx-4 mt-4 bg-green-50 border border-green-200 rounded-xl p-3 flex-row items-start">
                <Ionicons name="shield-checkmark" size={20} color={Colors.success.DEFAULT} style={{ marginTop: 2 }} />
                <View className="ml-2 flex-1">
                    <Text className="text-green-800 font-medium">Your Privacy Matters</Text>
                    <Text className="text-green-700 text-xs">Your health information is protected under HIPAA regulations and our strict privacy policies.</Text>
                </View>
            </View>

            {/* Menu Sections */}
            <View className="px-4 mt-4">
                <Text className="text-gray-500 font-semibold text-sm mb-2 ml-1">PERSONAL INFORMATION</Text>
                <MenuItem
                    icon="person-outline"
                    title="My Profile"
                    subtitle="View and update personal details"
                    onPress={() => {}}
                />
                <MenuItem
                    icon="location-outline"
                    title="Address"
                    subtitle="Update your home address"
                    onPress={() => {}}
                />
                <MenuItem
                    icon="call-outline"
                    title="Contact Information"
                    subtitle="Phone numbers and email"
                    onPress={() => {}}
                />
            </View>

            <View className="px-4 mt-4">
                <Text className="text-gray-500 font-semibold text-sm mb-2 ml-1">EMERGENCY CONTACTS</Text>
                <MenuItem
                    icon="people-outline"
                    title="Emergency Contacts"
                    subtitle="Manage emergency contact list"
                    onPress={() => {}}
                />
            </View>

            <View className="px-4 mt-4">
                <Text className="text-gray-500 font-semibold text-sm mb-2 ml-1">PREFERENCES</Text>
                <MenuItem
                    icon="notifications-outline"
                    title="Notifications"
                    subtitle="Manage reminder preferences"
                    onPress={() => router.push('/settings/notifications')}
                />
                <MenuItem
                    icon="lock-closed-outline"
                    title="Change Password"
                    subtitle="Update your security credentials"
                    onPress={() => router.push('/settings/password')}
                />
            </View>

            <View className="px-4 mt-4">
                <Text className="text-gray-500 font-semibold text-sm mb-2 ml-1">SUPPORT</Text>
                <MenuItem
                    icon="help-circle-outline"
                    title="Help & FAQs"
                    subtitle="Get answers to common questions"
                    onPress={() => {}}
                />
                <MenuItem
                    icon="document-text-outline"
                    title="Privacy Policy"
                    subtitle="How we protect your data"
                    onPress={() => {}}
                />
            </View>

            <View className="px-4 mt-4 pb-8">
                <MenuItem
                    icon="log-out-outline"
                    title="Sign Out"
                    onPress={handleLogout}
                    danger
                />
            </View>
        </ScrollView>
    );
}
