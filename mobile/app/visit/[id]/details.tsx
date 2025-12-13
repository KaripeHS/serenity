/**
 * Visit Details Screen
 * Comprehensive visit management with care tasks, medications, and signature capture
 * Integrates TaskChecklist and SignatureCapture components
 *
 * @module app/visit/[id]/details
 */
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { VisitService, TaskCompletion, SignatureData } from '../../../services/visit.service';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { TaskChecklist, CareTask } from '../../../components/TaskChecklist';
import { SignatureCapture } from '../../../components/SignatureCapture';

// Tab type for navigation
type TabType = 'info' | 'tasks' | 'meds';

export default function VisitDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [visit, setVisit] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('info');
    const [taskCompletions, setTaskCompletions] = useState<TaskCompletion[]>([]);
    const [showSignature, setShowSignature] = useState(false);
    const [saving, setSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    useEffect(() => {
        loadDetails();
    }, [id]);

    async function loadDetails() {
        try {
            const data = await VisitService.getVisitDetails(id as string);
            setVisit(data);

            // Initialize task completions from existing data
            if (data.carePlan?.tasks) {
                const initialCompletions = data.carePlan.tasks.map((task: any) => ({
                    taskId: task.id,
                    completed: task.completed || false,
                    notes: task.notes || '',
                    completedAt: task.completedAt || undefined,
                }));
                setTaskCompletions(initialCompletions);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    const handleTaskToggle = useCallback((taskId: string, completed: boolean, notes?: string) => {
        setTaskCompletions(prev => {
            const existing = prev.find(t => t.taskId === taskId);
            if (existing) {
                return prev.map(t =>
                    t.taskId === taskId
                        ? { ...t, completed, notes, completedAt: completed ? new Date().toISOString() : undefined }
                        : t
                );
            } else {
                return [...prev, {
                    taskId,
                    completed,
                    notes,
                    completedAt: completed ? new Date().toISOString() : undefined,
                }];
            }
        });
        setHasUnsavedChanges(true);
    }, []);

    const handleSaveTasks = async () => {
        if (!hasUnsavedChanges) return;

        try {
            setSaving(true);
            await VisitService.documentTasks(id as string, taskCompletions);
            setHasUnsavedChanges(false);
            Alert.alert('Saved', 'Task progress has been saved.');
        } catch (error) {
            console.error('Failed to save tasks:', error);
            Alert.alert('Error', 'Failed to save tasks. Will retry when online.');
        } finally {
            setSaving(false);
        }
    };

    const handleSignatureSave = async (signatureData: SignatureData) => {
        try {
            setSaving(true);
            await VisitService.saveSignature(id as string, signatureData);
            Alert.alert('Signature Captured', 'Client signature has been recorded.');

            // Reload visit to show signature status
            loadDetails();
        } catch (error) {
            console.error('Failed to save signature:', error);
            Alert.alert('Error', 'Failed to save signature. Will retry when online.');
        } finally {
            setSaving(false);
        }
    };

    const handleCompleteVisit = async () => {
        const requiredTasks = visit?.carePlan?.tasks?.filter((t: any) => t.required) || [];
        const completedRequired = requiredTasks.every((t: any) => {
            const completion = taskCompletions.find(c => c.taskId === t.id);
            return completion?.completed;
        });

        if (!completedRequired) {
            Alert.alert(
                'Required Tasks Incomplete',
                'Please complete all required tasks before finishing the visit.',
                [{ text: 'OK' }]
            );
            return;
        }

        Alert.alert(
            'Complete Visit',
            'Are you ready to complete this visit? This will clock you out and submit all documentation.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Capture Signature & Complete',
                    onPress: () => setShowSignature(true),
                },
            ]
        );
    };

    // Transform visit tasks to CareTask format
    const careTasks: CareTask[] = visit?.carePlan?.tasks?.map((task: any) => ({
        id: task.id,
        category: task.category || 'personal_care',
        name: task.text || task.name,
        serviceCode: task.serviceCode || 'T1019',
        frequency: task.frequency,
        instructions: task.instructions,
        required: task.required,
    })) || [];

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    if (!visit) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <Ionicons name="alert-circle" size={48} color="#9CA3AF" />
                <Text className="text-gray-500 mt-4">Visit not found</Text>
            </View>
        );
    }

    // Calculate progress
    const completedCount = taskCompletions.filter(t => t.completed).length;
    const totalTasks = careTasks.length;
    const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white px-4 py-3 border-b border-gray-200 flex-row items-center justify-between">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2">
                        <FontAwesome5 name="arrow-left" size={18} color="#4B5563" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-lg font-bold text-gray-900">{visit.patient.name}</Text>
                        <Text className="text-gray-500 text-sm">
                            {format(new Date(visit.scheduledStart || Date.now()), 'MMM d, h:mm a')}
                        </Text>
                    </View>
                </View>

                {/* Status Badge */}
                <View className={`px-3 py-1 rounded-full ${
                    visit.status === 'completed' ? 'bg-green-100' :
                    visit.status === 'in_progress' ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                    <Text className={`text-xs font-bold uppercase ${
                        visit.status === 'completed' ? 'text-green-700' :
                        visit.status === 'in_progress' ? 'text-blue-700' : 'text-gray-700'
                    }`}>
                        {visit.status || 'scheduled'}
                    </Text>
                </View>
            </View>

            {/* Tab Navigation */}
            <View className="flex-row bg-white border-b border-gray-200">
                {[
                    { key: 'info', label: 'Patient Info', icon: 'person' },
                    { key: 'tasks', label: 'Care Tasks', icon: 'checkbox' },
                    { key: 'meds', label: 'Medications', icon: 'medical' },
                ].map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        onPress={() => setActiveTab(tab.key as TabType)}
                        className={`flex-1 flex-row items-center justify-center py-3 border-b-2 ${
                            activeTab === tab.key ? 'border-blue-600' : 'border-transparent'
                        }`}
                    >
                        <Ionicons
                            name={tab.icon as any}
                            size={18}
                            color={activeTab === tab.key ? '#2563EB' : '#9CA3AF'}
                        />
                        <Text className={`ml-2 text-sm font-medium ${
                            activeTab === tab.key ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                            {tab.label}
                        </Text>
                        {tab.key === 'tasks' && completedCount > 0 && (
                            <View className="ml-2 bg-green-100 px-2 py-0.5 rounded-full">
                                <Text className="text-green-700 text-xs font-bold">
                                    {completedCount}/{totalTasks}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            {/* Tab Content */}
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {activeTab === 'info' && (
                    <View className="p-4">
                        {/* Patient Info Card */}
                        <View className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-4">
                            <View className="flex-row items-center mb-4">
                                <View className="h-14 w-14 bg-blue-100 rounded-full items-center justify-center mr-4">
                                    <FontAwesome5 name="user" size={24} color="#2563EB" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-xl font-bold text-gray-900">{visit.patient.name}</Text>
                                    <Text className="text-gray-500">DOB: {visit.patient.dob}</Text>
                                </View>
                            </View>

                            <View className="space-y-4">
                                <View className="flex-row items-start">
                                    <View className="w-8">
                                        <FontAwesome5 name="map-marker-alt" size={16} color="#6B7280" />
                                    </View>
                                    <Text className="text-gray-700 flex-1">{visit.patient.address}</Text>
                                </View>

                                <View className="flex-row items-start">
                                    <View className="w-8">
                                        <FontAwesome5 name="phone" size={16} color="#6B7280" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-700 font-medium">
                                            {visit.patient.emergencyContact?.name}
                                        </Text>
                                        <Text className="text-gray-500 text-sm">
                                            {visit.patient.emergencyContact?.phone} • {visit.patient.emergencyContact?.relationship}
                                        </Text>
                                    </View>
                                </View>

                                {visit.patient.allergies?.length > 0 && (
                                    <View className="flex-row items-start">
                                        <View className="w-8">
                                            <FontAwesome5 name="exclamation-triangle" size={16} color="#EF4444" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-red-600 font-medium">Allergies</Text>
                                            <Text className="text-red-500">{visit.patient.allergies.join(', ')}</Text>
                                        </View>
                                    </View>
                                )}

                                {visit.patient.diagnosis && (
                                    <View className="flex-row items-start">
                                        <View className="w-8">
                                            <FontAwesome5 name="notes-medical" size={16} color="#6B7280" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-gray-700 font-medium">Diagnosis</Text>
                                            <Text className="text-gray-500">{visit.patient.diagnosis}</Text>
                                        </View>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Visit Progress Card */}
                        <View className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-4">
                            <Text className="text-lg font-bold text-gray-900 mb-3">Visit Progress</Text>
                            <View className="flex-row items-center mb-2">
                                <View className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                                    <View
                                        className="h-full bg-green-500 rounded-full"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </View>
                                <Text className="ml-3 text-gray-600 font-medium">{progressPercent}%</Text>
                            </View>
                            <Text className="text-gray-500 text-sm">
                                {completedCount} of {totalTasks} tasks completed
                            </Text>
                        </View>

                        {/* Quick Actions */}
                        <View className="flex-row space-x-3">
                            <TouchableOpacity
                                onPress={() => setActiveTab('tasks')}
                                className="flex-1 bg-blue-600 p-4 rounded-xl flex-row items-center justify-center"
                            >
                                <Ionicons name="checkbox" size={20} color="#fff" />
                                <Text className="text-white font-bold ml-2">Document Tasks</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setShowSignature(true)}
                                className="flex-1 bg-purple-600 p-4 rounded-xl flex-row items-center justify-center"
                            >
                                <Ionicons name="pencil" size={20} color="#fff" />
                                <Text className="text-white font-bold ml-2">Signature</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {activeTab === 'tasks' && (
                    <View className="flex-1">
                        <TaskChecklist
                            tasks={careTasks}
                            completions={taskCompletions}
                            onTaskToggle={handleTaskToggle}
                            readOnly={visit.status === 'completed'}
                        />

                        {/* Save Button */}
                        {hasUnsavedChanges && (
                            <View className="p-4 bg-white border-t border-gray-200">
                                <TouchableOpacity
                                    onPress={handleSaveTasks}
                                    disabled={saving}
                                    className={`p-4 rounded-xl flex-row items-center justify-center ${
                                        saving ? 'bg-gray-400' : 'bg-green-600'
                                    }`}
                                >
                                    {saving ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <>
                                            <Ionicons name="save" size={20} color="#fff" />
                                            <Text className="text-white font-bold ml-2">Save Progress</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                {activeTab === 'meds' && (
                    <View className="p-4">
                        <View className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 mb-4">
                            <View className="flex-row items-center">
                                <Ionicons name="information-circle" size={20} color="#B45309" />
                                <Text className="text-yellow-800 ml-2 flex-1 text-sm">
                                    Caregivers may assist with self-administration of medications only.
                                    Do not administer medications directly.
                                </Text>
                            </View>
                        </View>

                        {visit.carePlan?.meds?.map((med: any, index: number) => (
                            <View key={index} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-3">
                                <View className="flex-row items-start">
                                    <View className="h-10 w-10 bg-purple-100 rounded-lg items-center justify-center mr-3">
                                        <FontAwesome5 name="pills" size={18} color="#7C3AED" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-900 font-bold text-lg">{med.name}</Text>
                                        <Text className="text-gray-600">{med.dosage}</Text>
                                        <View className="flex-row items-center mt-2">
                                            <Ionicons name="time" size={14} color="#6B7280" />
                                            <Text className="text-gray-500 ml-1 text-sm">{med.frequency}</Text>
                                        </View>
                                        {med.instructions && (
                                            <Text className="text-gray-500 text-sm mt-2 italic">
                                                {med.instructions}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            </View>
                        ))}

                        {(!visit.carePlan?.meds || visit.carePlan.meds.length === 0) && (
                            <View className="items-center py-8">
                                <Ionicons name="medical" size={48} color="#D1D5DB" />
                                <Text className="text-gray-400 mt-3">No medications listed</Text>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* Bottom Action Bar */}
            {visit.status !== 'completed' && (
                <View className="bg-white border-t border-gray-200 p-4 flex-row space-x-3">
                    <TouchableOpacity
                        onPress={() => router.push(`/visit/${id}/complete`)}
                        className="flex-1 bg-gray-100 p-4 rounded-xl flex-row items-center justify-center"
                    >
                        <Ionicons name="time" size={20} color="#4B5563" />
                        <Text className="text-gray-700 font-bold ml-2">Clock Out</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleCompleteVisit}
                        className="flex-1 bg-green-600 p-4 rounded-xl flex-row items-center justify-center"
                    >
                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                        <Text className="text-white font-bold ml-2">Complete Visit</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Signature Modal */}
            <SignatureCapture
                visible={showSignature}
                onClose={() => setShowSignature(false)}
                onSave={handleSignatureSave}
                clientName={visit.patient.name}
            />
        </SafeAreaView>
    );
}
