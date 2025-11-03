/**
 * Clock In Screen - GPS Verification & Visit Start
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { NavigationProp, RouteProp } from '@react-navigation/native';
import { RootStackParamList, Shift, GPSLocation } from '../types';
import { apiService } from '../services/api.service';
import { locationService } from '../services/location.service';
import { storageService } from '../services/storage.service';
import { COLORS } from '../utils/constants';
import { format, parseISO } from 'date-fns';

interface Props {
  navigation: NavigationProp<RootStackParamList, 'ClockIn'>;
  route: RouteProp<RootStackParamList, 'ClockIn'>;
}

export function ClockInScreen({ navigation, route }: Props) {
  const { shiftId } = route.params;
  const [shift, setShift] = useState<Shift | null>(null);
  const [location, setLocation] = useState<GPSLocation | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [clockingIn, setClockingIn] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'too_far' | 'error'>('loading');

  useEffect(() => {
    loadShiftAndVerifyLocation();
  }, []);

  const loadShiftAndVerifyLocation = async () => {
    try {
      // Check location permissions
      const hasPermission = await locationService.checkPermissions();
      if (!hasPermission) {
        const granted = await locationService.requestPermissions();
        if (!granted) {
          Alert.alert(
            'Location Required',
            'EVV requires location access to verify you are at the client location. Please enable location permissions in settings.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
          return;
        }
      }

      // Check if location services are enabled
      const isEnabled = await locationService.isLocationEnabled();
      if (!isEnabled) {
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services on your device to clock in.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }

      // Load shift details
      const shiftData = await apiService.getShift(shiftId);
      setShift(shiftData);

      // Get current location
      const currentLocation = await locationService.getCurrentLocation();
      setLocation(currentLocation);

      // Check if within geofence
      const { withinFence, distance: distanceMeters } = await locationService.isWithinGeofence(
        shiftData.latitude,
        shiftData.longitude
      );

      setDistance(distanceMeters);

      if (!locationService.isAccuracyAcceptable(currentLocation.accuracy)) {
        setLocationStatus('error');
        Alert.alert(
          'GPS Accuracy Issue',
          `GPS accuracy is ${Math.round(currentLocation.accuracy)} meters. Please wait for better signal or move to an area with clear sky view.`
        );
      } else if (withinFence) {
        setLocationStatus('success');
      } else {
        setLocationStatus('too_far');
      }
    } catch (error: any) {
      setLocationStatus('error');
      Alert.alert('Error', apiService.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    if (!shift || !location) {
      Alert.alert('Error', 'Missing shift or location data');
      return;
    }

    // Confirm if too far
    if (locationStatus === 'too_far' && distance) {
      const distanceStr = locationService.formatDistance(distance);
      Alert.alert(
        'Location Verification',
        `You are ${distanceStr} from the client location. EVV requires you to be within 200 meters (656 feet).\n\nAre you sure you want to clock in?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clock In Anyway',
            style: 'destructive',
            onPress: () => performClockIn(),
          },
        ]
      );
      return;
    }

    await performClockIn();
  };

  const performClockIn = async () => {
    if (!shift || !location) return;

    setClockingIn(true);

    try {
      const isOnline = await apiService.isOnline();

      const visitData = {
        id: `visit-${Date.now()}`,
        shiftId: shift.id,
        patientId: shift.patientId,
        patientName: shift.patientName,
        caregiverId: '',
        clockInTime: new Date().toISOString(),
        clockInLatitude: location.latitude,
        clockInLongitude: location.longitude,
        serviceType: shift.serviceType,
        notes: '',
        status: isOnline ? ('synced' as const) : ('completed' as const),
        offlineCreated: !isOnline,
      };

      if (isOnline) {
        // Online: Send to server immediately
        const visit = await apiService.clockIn({
          shiftId: shift.id,
          clockInTime: visitData.clockInTime,
          latitude: location.latitude,
          longitude: location.longitude,
        });

        Alert.alert('Success', 'Clocked in successfully!', [
          { text: 'OK', onPress: () => navigation.navigate('Home') },
        ]);
      } else {
        // Offline: Save locally for later sync
        await storageService.addPendingVisit(visitData);

        Alert.alert(
          'Clocked In (Offline)',
          'Your clock-in has been saved locally and will sync when you have internet connection.',
          [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
        );
      }
    } catch (error: any) {
      Alert.alert('Clock In Failed', apiService.handleError(error));
    } finally {
      setClockingIn(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Verifying location...</Text>
      </View>
    );
  }

  if (!shift || !location) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load shift data</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const startTime = format(parseISO(shift.scheduledStart), 'h:mm a');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Clock In</Text>
        <Text style={styles.subtitle}>Verify your location and start visit</Text>
      </View>

      {/* Shift Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Shift Details</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Patient:</Text>
          <Text style={styles.value}>{shift.patientName}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Address:</Text>
          <Text style={styles.value}>{shift.patientAddress}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Scheduled:</Text>
          <Text style={styles.value}>{startTime}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Service:</Text>
          <Text style={styles.value}>{shift.serviceType}</Text>
        </View>
      </View>

      {/* GPS Status */}
      <View style={[
        styles.card,
        locationStatus === 'success' && styles.successCard,
        locationStatus === 'too_far' && styles.warningCard,
        locationStatus === 'error' && styles.errorCard,
      ]}>
        <Text style={styles.cardTitle}>Location Verification</Text>

        {locationStatus === 'success' && (
          <>
            <Text style={styles.statusText}>✅ Location Verified</Text>
            <Text style={styles.statusSubtext}>
              You are within {distance} meters of the client location
            </Text>
          </>
        )}

        {locationStatus === 'too_far' && (
          <>
            <Text style={styles.statusText}>⚠️ Outside Geofence</Text>
            <Text style={styles.statusSubtext}>
              You are {locationService.formatDistance(distance!)} from the client location.
              {'\n'}EVV requires you to be within 200 meters (656 feet).
            </Text>
          </>
        )}

        {locationStatus === 'error' && (
          <>
            <Text style={styles.statusText}>❌ GPS Issue</Text>
            <Text style={styles.statusSubtext}>
              GPS accuracy: {Math.round(location.accuracy)} meters
              {'\n'}Please wait for better signal
            </Text>
          </>
        )}

        <View style={styles.gpsDetails}>
          <Text style={styles.gpsText}>
            📍 Lat: {location.latitude.toFixed(6)}, Lon: {location.longitude.toFixed(6)}
          </Text>
          <Text style={styles.gpsText}>
            🎯 Accuracy: {Math.round(location.accuracy)} meters
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <TouchableOpacity
        style={[
          styles.clockInButton,
          clockingIn && styles.buttonDisabled,
          locationStatus === 'error' && styles.buttonDisabled,
        ]}
        onPress={handleClockIn}
        disabled={clockingIn || locationStatus === 'error'}
      >
        {clockingIn ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.clockInButtonText}>
            {locationStatus === 'too_far' ? 'Clock In Anyway' : 'Clock In Now'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => navigation.goBack()}
        disabled={clockingIn}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    marginBottom: 20,
    textAlign: 'center',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  successCard: {
    backgroundColor: '#d1fae5',
    borderColor: COLORS.success,
    borderWidth: 2,
  },
  warningCard: {
    backgroundColor: '#fef3c7',
    borderColor: COLORS.warning,
    borderWidth: 2,
  },
  errorCard: {
    backgroundColor: '#fee2e2',
    borderColor: COLORS.error,
    borderWidth: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: COLORS.gray,
    width: 90,
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    color: COLORS.black,
    flex: 1,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 8,
  },
  statusSubtext: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
    marginBottom: 16,
  },
  gpsDetails: {
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingTop: 12,
  },
  gpsText: {
    fontSize: 12,
    color: COLORS.gray,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  clockInButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  clockInButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  cancelButtonText: {
    color: COLORS.gray,
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 16,
    paddingHorizontal: 32,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
