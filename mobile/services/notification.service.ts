
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Config } from '../constants/Config';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

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

export const NotificationService = {
    async registerForPushNotificationsAsync() {
        let token;

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
                console.log('Failed to get push token for push notification!');
                return;
            }

            // Get the token (for Expo Push Service)
            token = (await Notifications.getExpoPushTokenAsync({
                projectId: 'your-project-id', // TODO: Update with real ID
            })).data;

            console.log('Expo Push Token:', token);

            // Sync token to backend
            await this.syncTokenToBackend(token);
        } else {
            console.log('Must use physical device for Push Notifications');
        }

        return token;
    },

    async syncTokenToBackend(pushToken: string) {
        try {
            const token = await SecureStore.getItemAsync('serenity_auth_token');
            if (!token) return; // Wait until logged in

            await axios.post(`${Config.API_URL}/notifications/register-device`, {
                pushToken,
                platform: Platform.OS
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            // console.warn('Failed to sync push token');
        }
    }
};
