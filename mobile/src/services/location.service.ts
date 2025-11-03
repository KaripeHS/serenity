/**
 * Location Service
 * Handles GPS location capture and geofencing validation
 */

import * as Location from 'expo-location';
import { GPSLocation } from '../types';
import { GPS_CONFIG } from '../utils/constants';

class LocationService {
  private hasPermission: boolean = false;

  /**
   * Request location permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      this.hasPermission = status === 'granted';

      if (this.hasPermission) {
        // Also request background permission for future features
        await Location.requestBackgroundPermissionsAsync();
      }

      return this.hasPermission;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  /**
   * Check if location permissions are granted
   */
  async checkPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      this.hasPermission = status === 'granted';
      return this.hasPermission;
    } catch (error) {
      console.error('Error checking location permissions:', error);
      return false;
    }
  }

  /**
   * Get current GPS location with high accuracy
   */
  async getCurrentLocation(): Promise<GPSLocation> {
    if (!this.hasPermission) {
      const granted = await this.requestPermissions();
      if (!granted) {
        throw new Error('Location permission denied');
      }
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: GPS_CONFIG.HIGH_ACCURACY
          ? Location.Accuracy.BestForNavigation
          : Location.Accuracy.Balanced,
        timeInterval: GPS_CONFIG.TIMEOUT_MS,
        distanceInterval: GPS_CONFIG.DISTANCE_FILTER_METERS,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 0,
        altitude: location.coords.altitude || undefined,
        timestamp: location.timestamp,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      throw new Error('Failed to get GPS location. Please ensure location services are enabled.');
    }
  }

  /**
   * Calculate distance between two GPS coordinates (Haversine formula)
   * Returns distance in meters
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  }

  /**
   * Check if current location is within geofence radius of target location
   */
  async isWithinGeofence(
    targetLatitude: number,
    targetLongitude: number,
    radiusMeters: number = GPS_CONFIG.GEOFENCE_RADIUS_METERS
  ): Promise<{ withinFence: boolean; distance: number; location: GPSLocation }> {
    const currentLocation = await this.getCurrentLocation();

    const distance = this.calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      targetLatitude,
      targetLongitude
    );

    return {
      withinFence: distance <= radiusMeters,
      distance: Math.round(distance),
      location: currentLocation,
    };
  }

  /**
   * Validate GPS accuracy is good enough for EVV
   */
  isAccuracyAcceptable(accuracy: number): boolean {
    // Accept accuracy better than 50 meters
    return accuracy <= 50;
  }

  /**
   * Get formatted address from coordinates (reverse geocoding)
   */
  async getAddressFromCoordinates(latitude: number, longitude: number): Promise<string> {
    try {
      const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });

      if (addresses && addresses.length > 0) {
        const address = addresses[0];
        return `${address.street || ''} ${address.city || ''}, ${address.region || ''} ${address.postalCode || ''}`.trim();
      }

      return 'Address not found';
    } catch (error) {
      console.error('Error getting address from coordinates:', error);
      return 'Unable to determine address';
    }
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Format distance for display
   */
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)} meters`;
    } else {
      const miles = meters * 0.000621371;
      return `${miles.toFixed(2)} miles`;
    }
  }

  /**
   * Check if location services are enabled on device
   */
  async isLocationEnabled(): Promise<boolean> {
    try {
      return await Location.hasServicesEnabledAsync();
    } catch (error) {
      console.error('Error checking location services:', error);
      return false;
    }
  }
}

// Singleton instance
export const locationService = new LocationService();
