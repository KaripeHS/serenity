/**
 * Expense Submission Screen
 * Allows caregivers to log mileage and upload expense receipts
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

type ExpenseType = 'mileage' | 'supplies' | 'meals' | 'other';

interface ExpenseEntry {
  id: string;
  type: ExpenseType;
  amount: number;
  description: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  receiptUri?: string;
  mileage?: number;
}

export default function ExpensesScreen() {
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');
  const [expenseType, setExpenseType] = useState<ExpenseType>('mileage');
  const [mileage, setMileage] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Mock expense history
  const [expenses] = useState<ExpenseEntry[]>([
    {
      id: '1',
      type: 'mileage',
      amount: 21.13,
      description: 'Client visits - Columbus area',
      date: '2024-12-12',
      status: 'pending',
      mileage: 32.5,
    },
    {
      id: '2',
      type: 'supplies',
      amount: 15.99,
      description: 'Gloves and sanitizer',
      date: '2024-12-11',
      status: 'approved',
    },
    {
      id: '3',
      type: 'mileage',
      amount: 18.85,
      description: 'Client visits - Dublin',
      date: '2024-12-10',
      status: 'approved',
      mileage: 29.0,
    },
    {
      id: '4',
      type: 'meals',
      amount: 12.50,
      description: 'Lunch during extended shift',
      date: '2024-12-09',
      status: 'rejected',
    },
  ]);

  const MILEAGE_RATE = 0.67; // IRS 2024 rate

  const expenseTypes: { type: ExpenseType; label: string; icon: string }[] = [
    { type: 'mileage', label: 'Mileage', icon: 'car-outline' },
    { type: 'supplies', label: 'Supplies', icon: 'bag-outline' },
    { type: 'meals', label: 'Meals', icon: 'restaurant-outline' },
    { type: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
  ];

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload receipts.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setReceiptUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions to take receipt photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setReceiptUri(result.assets[0].uri);
    }
  };

  const calculateMileageAmount = () => {
    const miles = parseFloat(mileage);
    if (isNaN(miles)) return 0;
    return miles * MILEAGE_RATE;
  };

  const handleSubmit = async () => {
    // Validation
    if (expenseType === 'mileage' && !mileage) {
      Alert.alert('Error', 'Please enter the number of miles traveled.');
      return;
    }
    if (expenseType !== 'mileage' && !amount) {
      Alert.alert('Error', 'Please enter the expense amount.');
      return;
    }
    if (!description) {
      Alert.alert('Error', 'Please enter a description for this expense.');
      return;
    }
    if (expenseType !== 'mileage' && !receiptUri) {
      Alert.alert('Receipt Required', 'Please attach a receipt photo for non-mileage expenses.');
      return;
    }

    setSubmitting(true);

    try {
      // In production, this would call the API
      await new Promise(resolve => setTimeout(resolve, 1500));

      Alert.alert(
        'Expense Submitted',
        'Your expense has been submitted for approval.',
        [{ text: 'OK', onPress: resetForm }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit expense. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setMileage('');
    setAmount('');
    setDescription('');
    setReceiptUri(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return { bg: '#dcfce7', text: '#16a34a' };
      case 'rejected':
        return { bg: '#fee2e2', text: '#dc2626' };
      default:
        return { bg: '#fef3c7', text: '#d97706' };
    }
  };

  const getExpenseIcon = (type: ExpenseType) => {
    const found = expenseTypes.find(e => e.type === type);
    return found?.icon || 'receipt-outline';
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'submit' && styles.tabActive]}
          onPress={() => setActiveTab('submit')}
        >
          <Text style={[styles.tabText, activeTab === 'submit' && styles.tabTextActive]}>
            Submit Expense
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'submit' ? (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Expense Type Selector */}
          <View style={styles.section}>
            <Text style={styles.label}>Expense Type</Text>
            <View style={styles.typeGrid}>
              {expenseTypes.map(({ type, label, icon }) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    expenseType === type && styles.typeButtonActive,
                  ]}
                  onPress={() => {
                    setExpenseType(type);
                    setAmount('');
                    setMileage('');
                  }}
                >
                  <Ionicons
                    name={icon as any}
                    size={24}
                    color={expenseType === type ? '#059669' : '#6b7280'}
                  />
                  <Text
                    style={[
                      styles.typeLabel,
                      expenseType === type && styles.typeLabelActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Mileage Input */}
          {expenseType === 'mileage' && (
            <View style={styles.section}>
              <Text style={styles.label}>Miles Traveled</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="speedometer-outline" size={20} color="#6b7280" />
                <TextInput
                  style={styles.input}
                  value={mileage}
                  onChangeText={setMileage}
                  placeholder="Enter miles"
                  keyboardType="decimal-pad"
                  placeholderTextColor="#9ca3af"
                />
                <Text style={styles.inputSuffix}>mi</Text>
              </View>
              {mileage && (
                <View style={styles.mileageCalc}>
                  <Text style={styles.mileageCalcText}>
                    {mileage} miles x ${MILEAGE_RATE}/mile ={' '}
                    <Text style={styles.mileageAmount}>
                      ${calculateMileageAmount().toFixed(2)}
                    </Text>
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Amount Input (non-mileage) */}
          {expenseType !== 'mileage' && (
            <View style={styles.section}>
              <Text style={styles.label}>Amount</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputPrefix}>$</Text>
                <TextInput
                  style={styles.input}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>
          )}

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.textArea}
              value={description}
              onChangeText={setDescription}
              placeholder="Brief description of the expense..."
              multiline
              numberOfLines={3}
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Receipt Upload (non-mileage) */}
          {expenseType !== 'mileage' && (
            <View style={styles.section}>
              <Text style={styles.label}>Receipt Photo</Text>
              {receiptUri ? (
                <View style={styles.receiptPreview}>
                  <Image source={{ uri: receiptUri }} style={styles.receiptImage} />
                  <TouchableOpacity
                    style={styles.removeReceipt}
                    onPress={() => setReceiptUri(null)}
                  >
                    <Ionicons name="close-circle" size={28} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.uploadButtons}>
                  <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
                    <Ionicons name="camera-outline" size={24} color="#059669" />
                    <Text style={styles.uploadText}>Take Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                    <Ionicons name="image-outline" size={24} color="#059669" />
                    <Text style={styles.uploadText}>Choose File</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons name="send-outline" size={20} color="#ffffff" />
                <Text style={styles.submitText}>Submit Expense</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={20} color="#0891b2" />
            <Text style={styles.infoText}>
              Mileage is reimbursed at ${MILEAGE_RATE}/mile (IRS 2024 rate). Other expenses
              require receipt photos and supervisor approval.
            </Text>
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                ${expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
              </Text>
              <Text style={styles.summaryLabel}>Pending</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                ${expenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
              </Text>
              <Text style={styles.summaryLabel}>Approved</Text>
            </View>
          </View>

          {/* Expense List */}
          <Text style={styles.sectionTitle}>Recent Expenses</Text>
          {expenses.map(expense => {
            const statusColor = getStatusColor(expense.status);
            return (
              <View key={expense.id} style={styles.expenseCard}>
                <View style={styles.expenseIcon}>
                  <Ionicons
                    name={getExpenseIcon(expense.type) as any}
                    size={20}
                    color="#6b7280"
                  />
                </View>
                <View style={styles.expenseDetails}>
                  <Text style={styles.expenseTitle}>{expense.description}</Text>
                  <Text style={styles.expenseDate}>
                    {new Date(expense.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                    {expense.mileage && ` - ${expense.mileage} mi`}
                  </Text>
                </View>
                <View style={styles.expenseRight}>
                  <Text style={styles.expenseAmount}>${expense.amount.toFixed(2)}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                    <Text style={[styles.statusText, { color: statusColor.text }]}>
                      {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 4,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#059669',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  typeButtonActive: {
    borderColor: '#059669',
    backgroundColor: '#ecfdf5',
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 6,
  },
  typeLabelActive: {
    color: '#059669',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
    height: 50,
  },
  inputPrefix: {
    fontSize: 16,
    color: '#6b7280',
    marginRight: 4,
  },
  inputSuffix: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 10,
  },
  textArea: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    fontSize: 16,
    color: '#111827',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  mileageCalc: {
    backgroundColor: '#ecfdf5',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  mileageCalcText: {
    fontSize: 13,
    color: '#047857',
  },
  mileageAmount: {
    fontWeight: '700',
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#059669',
    borderStyle: 'dashed',
    padding: 20,
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#059669',
    marginTop: 6,
  },
  receiptPreview: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  receiptImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeReceipt: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ffffff',
    borderRadius: 14,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#ecfeff',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    marginBottom: 32,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#0e7490',
    lineHeight: 18,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 20,
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
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
  expenseDetails: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  expenseDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  expenseRight: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
