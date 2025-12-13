/**
 * Executive Profile Screen
 */

import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/DesignSystem';
import { AuthService } from '../../services/auth.service';
import { getRoleDisplayName } from '../../constants/RolePermissions';
import * as SecureStore from 'expo-secure-store';

export default function ExecutiveProfileScreen() {
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
            <View className="bg-white px-6 pt-8 pb-6 items-center mb-4">
                <View className="h-24 w-24 bg-primary-100 rounded-full items-center justify-center mb-4">
                    <Text className="text-3xl font-bold text-primary">
                        {user?.firstName?.charAt(0) || 'E'}{user?.lastName?.charAt(0) || 'X'}
                    </Text>
                </View>
                <Text className="text-2xl font-bold text-gray-900">
                    {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Executive User'}
                </Text>
                <Text className="text-primary font-medium mt-1">
                    {getRoleDisplayName(user?.role || 'ceo')}
                </Text>
                <Text className="text-gray-500 text-sm mt-1">{user?.email || ''}</Text>
            </View>

            {/* Quick Stats */}
            <View className="flex-row px-4 mb-4">
                <View className="flex-1 bg-white p-4 rounded-xl mr-2 border border-gray-100">
                    <Text className="text-gray-500 text-xs mb-1">Active Since</Text>
                    <Text className="text-gray-900 font-semibold">Jan 2024</Text>
                </View>
                <View className="flex-1 bg-white p-4 rounded-xl ml-2 border border-gray-100">
                    <Text className="text-gray-500 text-xs mb-1">Last Login</Text>
                    <Text className="text-gray-900 font-semibold">Today</Text>
                </View>
            </View>

            {/* Menu Sections */}
            <View className="px-4">
                <Text className="text-gray-500 font-semibold text-sm mb-2 ml-1">ACCOUNT</Text>
                <MenuItem
                    icon="person-outline"
                    title="Edit Profile"
                    subtitle="Update your personal information"
                    onPress={() => router.push('/settings/profile')}
                />
                <MenuItem
                    icon="lock-closed-outline"
                    title="Change Password"
                    subtitle="Update your security credentials"
                    onPress={() => router.push('/settings/password')}
                />
                <MenuItem
                    icon="notifications-outline"
                    title="Notifications"
                    subtitle="Manage alert preferences"
                    onPress={() => router.push('/settings/notifications')}
                />
            </View>

            <View className="px-4 mt-4">
                <Text className="text-gray-500 font-semibold text-sm mb-2 ml-1">PREFERENCES</Text>
                <MenuItem
                    icon="color-palette-outline"
                    title="Appearance"
                    subtitle="Theme and display settings"
                    onPress={() => {}}
                />
                <MenuItem
                    icon="language-outline"
                    title="Language"
                    subtitle="English (US)"
                    onPress={() => {}}
                />
            </View>

            <View className="px-4 mt-4">
                <Text className="text-gray-500 font-semibold text-sm mb-2 ml-1">SUPPORT</Text>
                <MenuItem
                    icon="help-circle-outline"
                    title="Help Center"
                    subtitle="Get help and support"
                    onPress={() => {}}
                />
                <MenuItem
                    icon="chatbubble-outline"
                    title="Contact Support"
                    subtitle="Reach our support team"
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
