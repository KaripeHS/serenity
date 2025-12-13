/**
 * Visit Complete Screen
 * Final step for visit completion with signature capture
 * Integrates with TaskChecklist and SignatureCapture
 *
 * @module app/visit/[id]/complete
 */
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { VisitService, TaskCompletion, SignatureData } from '../../../services/visit.service';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SignatureCapture } from '../../../components/SignatureCapture';

export default function VisitCompleteScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [visit, setVisit] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [completedTasks, setCompletedTasks] = useState<string[]>([]);
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showSignature, setShowSignature] = useState(false);
    const [signatureData, setSignatureData] = useState<SignatureData | null>(null);

    useEffect(() => {
        loadDetails();
    }, [id]);

    async function loadDetails() {
        try {
            const data = await VisitService.getVisitDetails(id as string);
            setVisit(data);

            // Pre-populate completed tasks from previous documentation
            if (data.carePlan?.tasks) {
                const preCompleted = data.carePlan.tasks
                    .filter((t: any) => t.completed)
                    .map((t: any) => t.id);
                setCompletedTasks(preCompleted);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load visit details');
        } finally {
            setLoading(false);
        }
    }

    const toggleTask = (taskId: string) => {
        if (completedTasks.includes(taskId)) {
            setCompletedTasks(completedTasks.filter(t => t !== taskId));
        } else {
            setCompletedTasks([...completedTasks, taskId]);
        }
    };

    const handleSignatureSave = (signature: SignatureData) => {
        setSignatureData(signature);
    };

    async function handleSubmit() {
        // Validation: Ensure required tasks are done
        const requiredMissing = visit?.carePlan?.tasks
            ?.filter((t: any) => t.required && !completedTasks.includes(t.id));

        if (requiredMissing?.length > 0) {
            Alert.alert(
                'Incomplete Care Plan',
                'You must complete all required tasks before clocking out.',
                [{ text: 'OK' }]
            );
            return;
        }

        // Require signature
        if (!signatureData) {
            Alert.alert(
                'Signature Required',
                'Please capture a signature before completing the visit.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Capture Signature', onPress: () => setShowSignature(true) }
                ]
            );
            return;
        }

        setSubmitting(true);
        try {
            // Build task completions
            const taskCompletions: TaskCompletion[] = visit?.carePlan?.tasks?.map((task: any) => ({
                taskId: task.id,
                completed: completedTasks.includes(task.id),
                completedAt: completedTasks.includes(task.id) ? new Date().toISOString() : undefined,
            })) || [];

            // Complete visit with all data
            await VisitService.completeVisit(id as string, {
                tasks: taskCompletions,
                notes: notes.trim() || undefined,
                signature: signatureData,
            });

            Alert.alert(
                'Visit Completed',
                'Documentation saved and clock-out successful.',
                [
                    {
                        text: 'OK',
                        onPress: () => router.replace('/(tabs)')
                    }
                ]
            );
        } catch (error: any) {
            console.error('Failed to complete visit:', error);
            Alert.alert(
                'Error',
                error.message || 'Failed to complete visit. Your data has been saved locally.'
            );
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <View className="flex-1 bg-gray-50 justify-center items-center">
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    if (!visit) {
        return (
            <View className="flex-1 bg-gray-50 justify-center items-center">
                <Ionicons name="alert-circle" size={48} color="#9CA3AF" />
                <Text className="text-gray-500 mt-4">Visit not found</Text>
            </View>
        );
    }

    const allRequiredComplete = visit.carePlan?.tasks
        ?.filter((t: any) => t.required)
        .every((t: any) => completedTasks.includes(t.id)) ?? true;

    const completedCount = completedTasks.length;
    const totalTasks = visit.carePlan?.tasks?.length || 0;

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white p-4 border-b border-gray-200 flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2">
                    <FontAwesome5 name="arrow-left" size={18} color="#4B5563" />
                </TouchableOpacity>
                <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-900">Complete Visit</Text>
                    <Text className="text-gray-500 text-sm">{visit.patient.name}</Text>
                </View>
            </View>

            <ScrollView className="flex-1 p-4">
                {/* Progress Summary */}
                <View className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-gray-700 font-bold">Task Completion</Text>
                        <View className={`px-3 py-1 rounded-full ${
                            allRequiredComplete ? 'bg-green-100' : 'bg-yellow-100'
                        }`}>
                            <Text className={`text-xs font-bold ${
                                allRequiredComplete ? 'text-green-700' : 'text-yellow-700'
                            }`}>
                                {completedCount}/{totalTasks} Done
                            </Text>
                        </View>
                    </View>
                    <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <View
                            className={`h-full rounded-full ${
                                allRequiredComplete ? 'bg-green-500' : 'bg-yellow-500'
                            }`}
                            style={{ width: `${totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0}%` }}
                        />
                    </View>
                </View>

                {/* ADL Checklist */}
                <View className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
                    <View className="bg-blue-50 p-3 border-b border-blue-100 flex-row items-center">
                        <Ionicons name="checkbox" size={18} color="#2563EB" />
                        <Text className="text-blue-800 font-bold ml-2">Care Tasks Verification</Text>
                    </View>
                    {visit.carePlan?.tasks?.map((task: any) => {
                        const isSelected = completedTasks.includes(task.id);
                        return (
                            <TouchableOpacity
                                key={task.id}
                                className={`flex-row items-center p-4 border-b border-gray-50 ${
                                    isSelected ? 'bg-green-50/50' : ''
                                }`}
                                onPress={() => toggleTask(task.id)}
                            >
                                <View className={`h-6 w-6 rounded-lg border-2 ${
                                    isSelected
                                        ? 'bg-green-600 border-green-600'
                                        : 'border-gray-300 bg-white'
                                } items-center justify-center mr-3`}>
                                    {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
                                </View>
                                <Text className={`flex-1 ${
                                    isSelected ? 'text-gray-900 font-medium' : 'text-gray-600'
                                }`}>
                                    {task.text || task.name}
                                </Text>
                                {task.required && (
                                    <View className="bg-red-100 px-2 py-0.5 rounded">
                                        <Text className="text-red-600 text-xs font-bold">REQ</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                    {(!visit.carePlan?.tasks || visit.carePlan.tasks.length === 0) && (
                        <View className="p-4 items-center">
                            <Text className="text-gray-400">No tasks to verify</Text>
                        </View>
                    )}
                </View>

                {/* Visit Notes */}
                <View className="mb-4">
                    <Text className="text-gray-700 font-bold mb-2">Visit Notes</Text>
                    <TextInput
                        className="bg-white border border-gray-200 rounded-xl p-4 h-28 text-gray-800"
                        placeholder="Enter any additional observations or notes..."
                        placeholderTextColor="#9CA3AF"
                        multiline
                        textAlignVertical="top"
                        value={notes}
                        onChangeText={setNotes}
                    />
                </View>

                {/* Signature Status */}
                <View className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                            <View className={`h-10 w-10 rounded-lg items-center justify-center mr-3 ${
                                signatureData ? 'bg-green-100' : 'bg-gray-100'
                            }`}>
                                <Ionicons
                                    name={signatureData ? 'checkmark-circle' : 'pencil'}
                                    size={22}
                                    color={signatureData ? '#16A34A' : '#6B7280'}
                                />
                            </View>
                            <View>
                                <Text className="text-gray-900 font-bold">Client Signature</Text>
                                {signatureData ? (
                                    <Text className="text-green-600 text-sm">
                                        Signed by {signatureData.signerName}
                                    </Text>
                                ) : (
                                    <Text className="text-gray-500 text-sm">Required for completion</Text>
                                )}
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={() => setShowSignature(true)}
                            className={`px-4 py-2 rounded-lg ${
                                signatureData ? 'bg-gray-100' : 'bg-purple-600'
                            }`}
                        >
                            <Text className={`font-bold ${
                                signatureData ? 'text-gray-700' : 'text-white'
                            }`}>
                                {signatureData ? 'Change' : 'Capture'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Required Tasks Warning */}
                {!allRequiredComplete && (
                    <View className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 mb-4">
                        <View className="flex-row items-start">
                            <Ionicons name="warning" size={20} color="#B45309" />
                            <Text className="text-yellow-800 ml-2 flex-1">
                                Please complete all required tasks before submitting.
                            </Text>
                        </View>
                    </View>
                )}

                {/* Submit Button */}
                <TouchableOpacity
                    className={`rounded-xl py-4 items-center shadow-md mb-8 ${
                        submitting || !allRequiredComplete || !signatureData
                            ? 'bg-gray-400'
                            : 'bg-green-600 active:bg-green-700'
                    }`}
                    onPress={handleSubmit}
                    disabled={submitting || !allRequiredComplete || !signatureData}
                >
                    {submitting ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <View className="flex-row items-center">
                            <Ionicons name="checkmark-circle" size={22} color="white" />
                            <Text className="text-white font-bold text-lg ml-2">
                                Complete Visit & Clock Out
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </ScrollView>

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
