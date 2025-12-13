/**
 * Caregiver Home Screen
 * Quick access to today's schedule and quick actions
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';

export default function CaregiverHomeScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <Link href="/(caregiver)/expenses" asChild>
              <TouchableOpacity style={styles.actionCard}>
                <View style={[styles.actionIcon, { backgroundColor: '#dbeafe' }]}>
                  <Ionicons name="receipt-outline" size={24} color="#2563eb" />
                </View>
                <Text style={styles.actionText}>Log Expense</Text>
              </TouchableOpacity>
            </Link>
            <Link href="/(caregiver)/job-board" asChild>
              <TouchableOpacity style={styles.actionCard}>
                <View style={[styles.actionIcon, { backgroundColor: '#dcfce7' }]}>
                  <Ionicons name="briefcase-outline" size={24} color="#16a34a" />
                </View>
                <Text style={styles.actionText}>View Jobs</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        {/* Today's Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>3</Text>
              <Text style={styles.summaryLabel}>Visits</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>8h</Text>
              <Text style={styles.summaryLabel}>Hours</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>$24</Text>
              <Text style={styles.summaryLabel}>Mileage</Text>
            </View>
          </View>
        </View>

        {/* Pending Expenses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pending Expenses</Text>
            <Link href="/(caregiver)/expenses" asChild>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </Link>
          </View>
          <View style={styles.card}>
            <View style={styles.expenseItem}>
              <View style={styles.expenseIcon}>
                <Ionicons name="car-outline" size={20} color="#6b7280" />
              </View>
              <View style={styles.expenseInfo}>
                <Text style={styles.expenseTitle}>Mileage - Dec 12</Text>
                <Text style={styles.expenseSubtitle}>32.5 miles</Text>
              </View>
              <Text style={styles.expenseAmount}>$21.13</Text>
            </View>
            <View style={styles.expenseItem}>
              <View style={styles.expenseIcon}>
                <Ionicons name="bag-outline" size={20} color="#6b7280" />
              </View>
              <View style={styles.expenseInfo}>
                <Text style={styles.expenseTitle}>Supplies - Dec 11</Text>
                <Text style={styles.expenseSubtitle}>Client supplies</Text>
              </View>
              <Text style={styles.expenseAmount}>$15.99</Text>
            </View>
          </View>
        </View>

        {/* Open Shifts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Open Shifts Near You</Text>
            <Link href="/(caregiver)/job-board" asChild>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </Link>
          </View>
          <View style={styles.card}>
            <View style={styles.shiftItem}>
              <View style={styles.shiftDate}>
                <Text style={styles.shiftDay}>Dec</Text>
                <Text style={styles.shiftDayNum}>15</Text>
              </View>
              <View style={styles.shiftInfo}>
                <Text style={styles.shiftTitle}>Personal Care - 8hr</Text>
                <Text style={styles.shiftSubtitle}>Columbus, OH - 3.2 mi</Text>
              </View>
              <View style={styles.shiftBonus}>
                <Text style={styles.bonusText}>+$15</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#059669',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  expenseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  expenseSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  shiftItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  shiftDate: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  shiftDay: {
    fontSize: 10,
    color: '#ffffff',
    opacity: 0.8,
  },
  shiftDayNum: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  shiftInfo: {
    flex: 1,
  },
  shiftTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  shiftSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  shiftBonus: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bonusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
  },
});
