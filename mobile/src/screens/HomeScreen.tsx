/**
 * Home Screen - Today's Shifts
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NavigationProp, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList, Shift, User } from '../types';
import { apiService } from '../services/api.service';
import { storageService } from '../services/storage.service';
import { COLORS } from '../utils/constants';
import { format, parseISO } from 'date-fns';

interface Props {
  navigation: NavigationProp<RootStackParamList, 'Home'>;
}

export function HomeScreen({ navigation }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(false);

  // Load user and shifts
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      // Load user from storage
      const storedUser = await storageService.getUserProfile();
      setUser(storedUser);

      // Check network status
      const online = await apiService.isOnline();
      setIsOnline(online);

      // Get pending sync count
      const count = await storageService.getPendingVisitsCount();
      setPendingCount(count);

      if (online) {
        // Load shifts from API
        const todaysShifts = await apiService.getTodaysShifts();
        setShifts(todaysShifts);
      } else {
        Alert.alert(
          'Offline Mode',
          'You are currently offline. Some features may be limited.'
        );
      }
    } catch (error: any) {
      Alert.alert('Error', apiService.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await apiService.logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  const handleClockIn = (shift: Shift) => {
    navigation.navigate('ClockIn', { shiftId: shift.id });
  };

  const renderShift = ({ item }: { item: Shift }) => {
    const startTime = format(parseISO(item.scheduledStart), 'h:mm a');
    const endTime = format(parseISO(item.scheduledEnd), 'h:mm a');

    return (
      <View style={styles.shiftCard}>
        <View style={styles.shiftHeader}>
          <Text style={styles.patientName}>{item.patientName}</Text>
          <Text style={styles.shiftTime}>
            {startTime} - {endTime}
          </Text>
        </View>

        <View style={styles.shiftDetails}>
          <Text style={styles.detailText}>📍 {item.patientAddress}</Text>
          <Text style={styles.detailText}>📞 {item.patientPhone}</Text>
          <Text style={styles.detailText}>💼 {item.serviceType}</Text>
          {item.notes && <Text style={styles.detailNotes}>📝 {item.notes}</Text>}
        </View>

        <TouchableOpacity
          style={styles.clockInButton}
          onPress={() => handleClockIn(item)}
        >
          <Text style={styles.clockInButtonText}>Clock In</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading your shifts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.firstName}!</Text>
          <Text style={styles.date}>{format(new Date(), 'EEEE, MMMM d, yyyy')}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Status Bar */}
      <View style={styles.statusBar}>
        <View style={[styles.statusBadge, isOnline ? styles.onlineBadge : styles.offlineBadge]}>
          <Text style={styles.statusText}>{isOnline ? '🟢 Online' : '🔴 Offline'}</Text>
        </View>
        {pendingCount > 0 && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingText}>
              {pendingCount} visit{pendingCount > 1 ? 's' : ''} pending sync
            </Text>
          </View>
        )}
      </View>

      {/* Shifts List */}
      {shifts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No shifts scheduled for today</Text>
          <Text style={styles.emptyStateSubtext}>
            Check back tomorrow or contact your Pod Lead
          </Text>
        </View>
      ) : (
        <FlatList
          data={shifts}
          renderItem={renderShift}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: 60,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  date: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4,
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.lightGray,
  },
  logoutButtonText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '600',
  },
  statusBar: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  onlineBadge: {
    backgroundColor: '#d1fae5',
  },
  offlineBadge: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pendingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#fef3c7',
  },
  pendingText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  shiftCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
    flex: 1,
  },
  shiftTime: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  shiftDetails: {
    marginBottom: 16,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 6,
  },
  detailNotes: {
    fontSize: 14,
    color: COLORS.gray,
    fontStyle: 'italic',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  clockInButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  clockInButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
  },
});
