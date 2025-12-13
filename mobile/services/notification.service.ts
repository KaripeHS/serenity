import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Config } from '../constants/Config';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Configure behavior when app is foregrounded
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
    }),
});

// Get project ID from app.json - returns null if placeholder
const getProjectId = (): string | null => {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    // Return null if it's the placeholder ID or missing
    if (!projectId || projectId === '12345678-1234-1234-1234-1234567890ab') {
        return null;
    }
    return projectId;
};

export const NotificationService = {
    async registerForPushNotificationsAsync() {
        let token;

        try {
            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'default',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF231F7C',
                });
            }

            if (Device.isDevice) {
                const { status: existingStatus } = await Notifications.getPermissionsAsync();
                let finalStatus = existingStatus;

                if (existingStatus !== 'granted') {
                    const { status } = await Notifications.requestPermissionsAsync();
                    finalStatus = status;
                }

                if (finalStatus !== 'granted') {
                    console.log('[Notifications] Permission not granted');
                    return;
                }

                // Check for valid project ID before requesting token
                const projectId = getProjectId();
                if (!projectId) {
                    console.log('[Notifications] Skipping push token - no valid EAS projectId configured');
                    console.log('[Notifications] To enable push notifications, run: npx eas init');
                    return;
                }

                // Get the token (for Expo Push Service)
                token = (await Notifications.getExpoPushTokenAsync({
                    projectId,
                })).data;

                // Sync token to backend
                await this.syncTokenToBackend(token);
            } else {
                console.log('[Notifications] Push notifications require a physical device');
            }
        } catch (error) {
            console.log('[Notifications] Error registering:', error);
            // Don't throw - app should continue to work without push notifications
        }

        return token;
    },

    async syncTokenToBackend(pushToken: string) {
        try {
            const token = await SecureStore.getItemAsync('serenity_auth_token');
            if (!token) return; // Wait until logged in

            await axios.post(`${Config.API_URL}/mobile/notifications/register-device`, {
                pushToken,
                platform: Platform.OS
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            // Silent fail - will retry on next app open
        }
    }
};
