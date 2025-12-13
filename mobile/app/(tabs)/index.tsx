import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { AuthService } from '../../services/auth.service';
import { OfflineQueue } from '../../services/offline.queue';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/DesignSystem';

export default function HomeScreen() {
  const [user, setUser] = useState<any>(null);
  const [visit, setVisit] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadData();
    OfflineQueue.processQueue().catch(console.error);
  }, []);

  async function loadData() {
    try {
      const userData = await AuthService.getUser();
      setUser(userData);

      // Demo data for UI
      setVisit({
        id: 'visit_123',
        patientName: 'Jane Doe',
        address: '456 Oak Lane, Springfield',
        serviceType: 'Wound Care',
        duration: '60 mins',
        status: 'scheduled',
        time: '10:00 AM - 11:00 AM'
      });
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary.DEFAULT]} />}
    >
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.dateText}>{dateStr}</Text>
            <Text style={styles.greeting}>Hello, {user?.firstName || 'Caregiver'} 👋</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.firstName?.[0] || 'C'}</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
            <Text style={[styles.statValue, { color: '#2563EB' }]}>4h 30m</Text>
            <Text style={[styles.statLabel, { color: '#60A5FA' }]}>Worked Today</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#ECFDF5' }]}>
            <Text style={[styles.statValue, { color: '#059669' }]}>$85.50</Text>
            <Text style={[styles.statLabel, { color: '#34D399' }]}>Earned</Text>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Up Next</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/schedule')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {/* Visit Card */}
        {visit ? (
          <View style={styles.visitCard}>
            <View style={styles.visitHeader}>
              <View style={styles.visitInfo}>
                <View style={styles.visitIcon}>
                  <Ionicons name="medical" size={20} color="#f97316" />
                </View>
                <View>
                  <Text style={styles.patientName}>{visit.patientName}</Text>
                  <Text style={styles.visitType}>{visit.serviceType} • {visit.duration}</Text>
                </View>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>SCHEDULED</Text>
              </View>
            </View>

            <View style={styles.visitDetail}>
              <Ionicons name="time-outline" size={16} color="#6b7280" />
              <Text style={styles.visitDetailText}>{visit.time}</Text>
            </View>

            <View style={styles.visitDetail}>
              <Ionicons name="location-outline" size={16} color="#6b7280" />
              <Text style={styles.visitDetailText} numberOfLines={1}>{visit.address}</Text>
            </View>

            <TouchableOpacity
              style={styles.startButton}
              onPress={() => router.push(`/visit/${visit.id}/details`)}
            >
              <Text style={styles.startButtonText}>Start Visit</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No upcoming visits</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="chatbubble-ellipses" size={24} color="#9333ea" />
            </View>
            <Text style={styles.actionText}>Message Office</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: '#FCE7F3' }]}>
              <Ionicons name="document-text" size={24} color="#db2777" />
            </View>
            <Text style={styles.actionText}>New Note</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary[200],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary[700],
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  content: {
    padding: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary.DEFAULT,
  },
  visitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  visitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  visitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  visitIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  visitType: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#047857',
  },
  visitDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  visitDetailText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  startButton: {
    backgroundColor: Colors.primary.DEFAULT,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: Colors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    height: 160,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E5E7EB',
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
});
