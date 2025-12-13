
import { View, Text, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthService } from '../services/auth.service';
import { BiometricService } from '../services/biometric.service';
import { FontAwesome5 } from '@expo/vector-icons';
import { getRoleRouteGroup, UserRole } from '../constants/RolePermissions';

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [canUseBiometrics, setCanUseBiometrics] = useState(false);

    useEffect(() => {
        checkBiometrics();
    }, []);

    async function checkBiometrics() {
        const available = await BiometricService.isAvailable();
        setCanUseBiometrics(available);
        if (available) {
            // Optional: Auto-prompt on load
            // handleBiometricLogin();
        }
    }

    function navigateToRoleDashboard(role: string) {
        const routeGroup = getRoleRouteGroup(role as UserRole);
        router.replace(`/(${routeGroup})` as any);
    }

    async function handleLogin() {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter email and password');
            return;
        }

        setLoading(true);
        try {
            const user = await AuthService.login(email, password);
            navigateToRoleDashboard(user?.role || 'caregiver');
        } catch (error: any) {
            Alert.alert('Login Failed', 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    }

    async function handleBiometricLogin() {
        const success = await BiometricService.authenticate();
        if (success) {
            // In a real app, you would retrieve the stored token from SecureStore here
            // For security, biometric usually unlocks a stored token/refresh token
            // We simulate a successful re-auth
            const user = await AuthService.getUser();
            if (user) {
                navigateToRoleDashboard(user?.role || 'caregiver');
            } else {
                Alert.alert('Setup Required', 'Please log in with password once to enable FaceID');
            }
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-white justify-center px-8">
            <View className="items-center mb-10">
                <View className="h-20 w-20 bg-blue-600 rounded-full items-center justify-center mb-4 shadow-lg">
                    <Text className="text-white text-3xl font-bold">S</Text>
                </View>
                <Text className="text-2xl font-bold text-gray-900">Serenity Mobile</Text>
                <Text className="text-gray-500">Employee & Care Portal</Text>
            </View>

            <View className="space-y-4">
                <View>
                    <Text className="text-gray-700 font-medium mb-1">Email</Text>
                    <TextInput
                        className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50"
                        placeholder="caregiver@serenity.com"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                    />
                </View>

                <View>
                    <Text className="text-gray-700 font-medium mb-1">Password</Text>
                    <TextInput
                        className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50"
                        placeholder="••••••••"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>

                <TouchableOpacity
                    className="bg-blue-600 rounded-lg py-4 items-center shadow-md active:bg-blue-700"
                    onPress={handleLogin}
                    disabled={loading}
                >
                    <Text className="text-white font-bold text-lg">{loading ? 'Signing in...' : 'Sign In'}</Text>
                </TouchableOpacity>

                {canUseBiometrics && (
                    <TouchableOpacity
                        className="bg-white border border-blue-600 rounded-lg py-4 items-center flex-row justify-center space-x-2 mt-2"
                        onPress={handleBiometricLogin}
                        disabled={loading}
                    >
                        <FontAwesome5 name="fingerprint" size={20} color="#2563EB" />
                        <Text className="text-blue-600 font-bold text-lg">Sign in with FaceID</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity className="items-center mt-4">
                    <Text className="text-blue-600">Forgot Password?</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
