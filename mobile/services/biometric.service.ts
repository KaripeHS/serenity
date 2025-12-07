
import * as LocalAuthentication from 'expo-local-authentication';
import { Alert } from 'react-native';

export const BiometricService = {
    async isAvailable() {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        return hasHardware && isEnrolled;
    },

    async authenticate() {
        try {
            const hasBiometrics = await this.isAvailable();
            if (!hasBiometrics) {
                Alert.alert('Not Available', 'FaceID or TouchID is not set up on this device.');
                return false;
            }

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Login to Serenity Mobile',
                fallbackLabel: 'Use Password',
                cancelLabel: 'Cancel',
                disableDeviceFallback: false,
            });

            return result.success;
        } catch (error) {
            console.error('Biometric Auth Error:', error);
            return false;
        }
    }
};
