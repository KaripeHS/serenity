
import * as Location from 'expo-location';
import { Alert } from 'react-native';

export const LocationService = {
    async requestPermissions() {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'GPS access is required for EVV compliance.');
            return false;
        }
        return true;
    },

    async getCurrentLocation() {
        // High accuracy is mandatory for EVV
        try {
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Highest,
            });
            return {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                timestamp: location.timestamp,
                accuracy: location.coords.accuracy,
            };
        } catch (error) {
            console.error('GPS Error:', error);
            throw error;
        }
    },

    async verifyGeofence(targetLat: number, targetLng: number, radiusMeters = 100) {
        const current = await this.getCurrentLocation();
        const distance = this.calculateDistance(
            current.latitude, current.longitude,
            targetLat, targetLng
        );
        return {
            allowed: distance <= radiusMeters,
            distance,
            currentLocation: current
        };
    },

    // Haversine formula for distance
    calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
        const R = 6371e3; // metres
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }
};
