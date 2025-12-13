/**
 * Job Board Screen
 * Displays available shifts for caregivers to bid on
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface OpenShift {
  id: string;
  clientName: string;
  clientInitials: string;
  serviceType: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  address: string;
  city: string;
  distance: number;
  payRate: number;
  bonusAmount?: number;
  bonusReason?: string;
  requirements: string[];
  notes?: string;
  urgency: 'normal' | 'urgent' | 'critical';
}

export default function JobBoardScreen() {
  const [shifts, setShifts] = useState<OpenShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedShift, setSelectedShift] = useState<OpenShift | null>(null);
  const [bidding, setBidding] = useState(false);
  const [filter, setFilter] = useState<'all' | 'nearby' | 'bonus'>('all');

  // Mock data - in production this would come from the API
  const mockShifts: OpenShift[] = [
    {
      id: '1',
      clientName: 'Margaret W.',
      clientInitials: 'MW',
      serviceType: 'Personal Care',
      date: '2024-12-15',
      startTime: '09:00',
      endTime: '17:00',
      hours: 8,
      address: '1234 Oak Street',
      city: 'Columbus',
      distance: 3.2,
      payRate: 16.50,
      bonusAmount: 15,
      bonusReason: 'Short notice',
      requirements: ['Personal Care certified', 'Lifting 50+ lbs'],
      urgency: 'urgent',
    },
    {
      id: '2',
      clientName: 'Robert J.',
      clientInitials: 'RJ',
      serviceType: 'Homemaker',
      date: '2024-12-16',
      startTime: '10:00',
      endTime: '14:00',
      hours: 4,
      address: '567 Maple Ave',
      city: 'Dublin',
      distance: 5.8,
      payRate: 15.00,
      requirements: ['Homemaker certified'],
      notes: 'Light housekeeping and meal prep',
      urgency: 'normal',
    },
    {
      id: '3',
      clientName: 'Helen S.',
      clientInitials: 'HS',
      serviceType: 'Personal Care',
      date: '2024-12-14',
      startTime: '07:00',
      endTime: '15:00',
      hours: 8,
      address: '890 Pine Road',
      city: 'Westerville',
      distance: 8.1,
      payRate: 17.00,
      bonusAmount: 25,
      bonusReason: 'Weekend + Holiday',
      requirements: ['Personal Care certified', 'Med reminder experience'],
      urgency: 'critical',
    },
    {
      id: '4',
      clientName: 'William T.',
      clientInitials: 'WT',
      serviceType: 'Respite Care',
      date: '2024-12-17',
      startTime: '18:00',
      endTime: '22:00',
      hours: 4,
      address: '321 Elm Street',
      city: 'Gahanna',
      distance: 4.5,
      payRate: 18.00,
      bonusAmount: 10,
      bonusReason: 'Evening shift',
      requirements: ['Respite Care certified'],
      urgency: 'normal',
    },
    {
      id: '5',
      clientName: 'Dorothy M.',
      clientInitials: 'DM',
      serviceType: 'Companionship',
      date: '2024-12-18',
      startTime: '13:00',
      endTime: '17:00',
      hours: 4,
      address: '456 Birch Lane',
      city: 'Reynoldsburg',
      distance: 6.3,
      payRate: 14.50,
      requirements: ['Companionship certified'],
      notes: 'Social engagement and light activities',
      urgency: 'normal',
    },
  ];

  useEffect(() => {
    loadShifts();
  }, []);

  const loadShifts = async () => {
    setLoading(true);
    try {
      // In production, this would fetch from the API
      await new Promise(resolve => setTimeout(resolve, 800));
      setShifts(mockShifts);
    } catch (error) {
      Alert.alert('Error', 'Failed to load available shifts.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadShifts();
    setRefreshing(false);
  };

  const handleBid = async (shift: OpenShift) => {
    setBidding(true);
    try {
      // In production, this would call the API
      await new Promise(resolve => setTimeout(resolve, 1000));

      Alert.alert(
        'Bid Submitted!',
        `Your bid for ${shift.clientName}'s ${shift.serviceType} shift on ${formatDate(shift.date)} has been submitted. You'll be notified when approved.`,
        [{ text: 'OK', onPress: () => setSelectedShift(null) }]
      );

      // Remove shift from list after successful bid
      setShifts(prev => prev.filter(s => s.id !== shift.id));
    } catch (error) {
      Alert.alert('Error', 'Failed to submit bid. Please try again.');
    } finally {
      setBidding(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getUrgencyStyle = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return { bg: '#fee2e2', text: '#dc2626', label: 'URGENT' };
      case 'urgent':
        return { bg: '#fef3c7', text: '#d97706', label: 'PRIORITY' };
      default:
        return { bg: '#dbeafe', text: '#2563eb', label: 'OPEN' };
    }
  };

  const filteredShifts = shifts.filter(shift => {
    if (filter === 'nearby') return shift.distance <= 5;
    if (filter === 'bonus') return shift.bonusAmount && shift.bonusAmount > 0;
    return true;
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Loading available shifts...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => setFilter('all')}
          >
            <Ionicons
              name="list-outline"
              size={16}
              color={filter === 'all' ? '#ffffff' : '#6b7280'}
            />
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              All Shifts ({shifts.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'nearby' && styles.filterButtonActive]}
            onPress={() => setFilter('nearby')}
          >
            <Ionicons
              name="location-outline"
              size={16}
              color={filter === 'nearby' ? '#ffffff' : '#6b7280'}
            />
            <Text style={[styles.filterText, filter === 'nearby' && styles.filterTextActive]}>
              Nearby (&lt;5 mi)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'bonus' && styles.filterButtonActive]}
            onPress={() => setFilter('bonus')}
          >
            <Ionicons
              name="gift-outline"
              size={16}
              color={filter === 'bonus' ? '#ffffff' : '#6b7280'}
            />
            <Text style={[styles.filterText, filter === 'bonus' && styles.filterTextActive]}>
              With Bonus
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Shift List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />
        }
      >
        {filteredShifts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Shifts Available</Text>
            <Text style={styles.emptyText}>
              {filter === 'all'
                ? 'Check back later for new opportunities.'
                : 'Try adjusting your filter to see more shifts.'}
            </Text>
          </View>
        ) : (
          filteredShifts.map(shift => {
            const urgency = getUrgencyStyle(shift.urgency);
            return (
              <TouchableOpacity
                key={shift.id}
                style={styles.shiftCard}
                onPress={() => setSelectedShift(shift)}
                activeOpacity={0.7}
              >
                {/* Header */}
                <View style={styles.shiftHeader}>
                  <View style={styles.clientInfo}>
                    <View style={styles.clientAvatar}>
                      <Text style={styles.clientInitials}>{shift.clientInitials}</Text>
                    </View>
                    <View>
                      <Text style={styles.clientName}>{shift.clientName}</Text>
                      <Text style={styles.serviceType}>{shift.serviceType}</Text>
                    </View>
                  </View>
                  <View style={[styles.urgencyBadge, { backgroundColor: urgency.bg }]}>
                    <Text style={[styles.urgencyText, { color: urgency.text }]}>
                      {urgency.label}
                    </Text>
                  </View>
                </View>

                {/* Details */}
                <View style={styles.shiftDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                    <Text style={styles.detailText}>
                      {formatDate(shift.date)} | {formatTime(shift.startTime)} - {formatTime(shift.endTime)} ({shift.hours}h)
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={16} color="#6b7280" />
                    <Text style={styles.detailText}>
                      {shift.city} - {shift.distance} mi away
                    </Text>
                  </View>
                </View>

                {/* Footer */}
                <View style={styles.shiftFooter}>
                  <View>
                    <Text style={styles.payRate}>${shift.payRate.toFixed(2)}/hr</Text>
                    {shift.bonusAmount && (
                      <View style={styles.bonusBadge}>
                        <Ionicons name="gift" size={12} color="#16a34a" />
                        <Text style={styles.bonusText}>+${shift.bonusAmount} bonus</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.bidButton}
                    onPress={() => setSelectedShift(shift)}
                  >
                    <Text style={styles.bidButtonText}>View & Bid</Text>
                    <Ionicons name="chevron-forward" size={16} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Shift Detail Modal */}
      <Modal
        visible={selectedShift !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedShift(null)}
      >
        {selectedShift && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Shift Details</Text>
                <TouchableOpacity
                  onPress={() => setSelectedShift(null)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                {/* Client Info */}
                <View style={styles.modalSection}>
                  <View style={styles.modalClientInfo}>
                    <View style={styles.modalAvatar}>
                      <Text style={styles.modalInitials}>{selectedShift.clientInitials}</Text>
                    </View>
                    <View>
                      <Text style={styles.modalClientName}>{selectedShift.clientName}</Text>
                      <Text style={styles.modalServiceType}>{selectedShift.serviceType}</Text>
                    </View>
                  </View>
                </View>

                {/* Shift Details */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Schedule</Text>
                  <View style={styles.modalDetailRow}>
                    <Ionicons name="calendar" size={18} color="#059669" />
                    <Text style={styles.modalDetailText}>{formatDate(selectedShift.date)}</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Ionicons name="time" size={18} color="#059669" />
                    <Text style={styles.modalDetailText}>
                      {formatTime(selectedShift.startTime)} - {formatTime(selectedShift.endTime)} ({selectedShift.hours} hours)
                    </Text>
                  </View>
                </View>

                {/* Location */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Location</Text>
                  <View style={styles.modalDetailRow}>
                    <Ionicons name="location" size={18} color="#059669" />
                    <View>
                      <Text style={styles.modalDetailText}>{selectedShift.address}</Text>
                      <Text style={styles.modalSubText}>
                        {selectedShift.city}, OH - {selectedShift.distance} miles from you
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Pay */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Compensation</Text>
                  <View style={styles.payBreakdown}>
                    <View style={styles.payRow}>
                      <Text style={styles.payLabel}>Base Rate</Text>
                      <Text style={styles.payValue}>${selectedShift.payRate.toFixed(2)}/hr</Text>
                    </View>
                    {selectedShift.bonusAmount && (
                      <View style={styles.payRow}>
                        <Text style={styles.payLabel}>Bonus ({selectedShift.bonusReason})</Text>
                        <Text style={[styles.payValue, styles.bonusValue]}>+${selectedShift.bonusAmount.toFixed(2)}</Text>
                      </View>
                    )}
                    <View style={[styles.payRow, styles.totalRow]}>
                      <Text style={styles.totalLabel}>Estimated Total</Text>
                      <Text style={styles.totalValue}>
                        ${((selectedShift.payRate * selectedShift.hours) + (selectedShift.bonusAmount || 0)).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Requirements */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Requirements</Text>
                  {selectedShift.requirements.map((req, idx) => (
                    <View key={idx} style={styles.requirementRow}>
                      <Ionicons name="checkmark-circle" size={18} color="#059669" />
                      <Text style={styles.requirementText}>{req}</Text>
                    </View>
                  ))}
                </View>

                {/* Notes */}
                {selectedShift.notes && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Notes</Text>
                    <Text style={styles.notesText}>{selectedShift.notes}</Text>
                  </View>
                )}
              </ScrollView>

              {/* Bid Button */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.submitBidButton, bidding && styles.submitBidButtonDisabled]}
                  onPress={() => handleBid(selectedShift)}
                  disabled={bidding}
                >
                  {bidding ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <>
                      <Ionicons name="hand-left-outline" size={20} color="#ffffff" />
                      <Text style={styles.submitBidText}>Submit Bid</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#059669',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  shiftCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  clientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientInitials: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  serviceType: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  urgencyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  shiftDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#374151',
  },
  shiftFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  payRate: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  bonusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  bonusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
  },
  bidButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 4,
  },
  bidButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalClientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  modalAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalInitials: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalClientName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalServiceType: {
    fontSize: 15,
    color: '#6b7280',
    marginTop: 2,
  },
  modalDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  modalDetailText: {
    fontSize: 15,
    color: '#111827',
    flex: 1,
  },
  modalSubText: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  payBreakdown: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 14,
  },
  payRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  payLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  payValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  bonusValue: {
    color: '#16a34a',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
    marginTop: 4,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    color: '#374151',
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 10,
  },
  modalFooter: {
    padding: 20,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  submitBidButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  submitBidButtonDisabled: {
    opacity: 0.6,
  },
  submitBidText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
});
