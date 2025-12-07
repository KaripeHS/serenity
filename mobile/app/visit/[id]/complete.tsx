
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { VisitService } from '../../../services/visit.service';
import { FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VisitCompleteScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [visit, setVisit] = useState<any>(null);
    const [completedTasks, setCompletedTasks] = useState<string[]>([]);
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadDetails();
    }, [id]);

    async function loadDetails() {
        const data = await VisitService.getVisitDetails(id as string);
        setVisit(data);
    }

    const toggleTask = (taskId: string) => {
        if (completedTasks.includes(taskId)) {
            setCompletedTasks(completedTasks.filter(t => t !== taskId));
        } else {
            setCompletedTasks([...completedTasks, taskId]);
        }
    };

    async function handleSubmit() {
        // Validation: Ensure required tasks are done
        const requiredMissing = visit?.carePlan.tasks
            .filter((t: any) => t.required && !completedTasks.includes(t.id));

        if (requiredMissing?.length > 0) {
            Alert.alert('Incomplete Care Plan', 'You must complete all required tasks before clocking out.');
            return;
        }

        setSubmitting(true);
        try {
            await VisitService.clockOut(id as string, notes, completedTasks);
            Alert.alert('Visit Completed', 'Documentation saved and clock-out successful.', [
                { text: 'OK', onPress: () => router.navigate('/(tabs)') }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message);
            setSubmitting(false);
        }
    }

    if (!visit) return <View className="flex-1 bg-white" />;

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="bg-white p-4 border-b border-gray-200 flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <FontAwesome5 name="arrow-left" size={20} color="#4B5563" />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-gray-900">Complete Visit</Text>
            </View>

            <ScrollView className="p-4">
                <Text className="text-gray-500 mb-4">Please verify the care provided to <Text className="font-bold text-gray-900">{visit.patient.name}</Text>.</Text>

                <View className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                    <View className="bg-blue-50 p-3 border-b border-blue-100">
                        <Text className="text-blue-800 font-bold">ADL Checklist</Text>
                    </View>
                    {visit.carePlan.tasks.map((task: any) => {
                        const isSelected = completedTasks.includes(task.id);
                        return (
                            <TouchableOpacity
                                key={task.id}
                                className={`flex-row items-center p-4 border-b border-gray-50 ${isSelected ? 'bg-blue-50/30' : ''}`}
                                onPress={() => toggleTask(task.id)}
                            >
                                <View className={`h-6 w-6 rounded border ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'} items-center justify-center mr-3`}>
                                    {isSelected && <FontAwesome5 name="check" size={12} color="white" />}
                                </View>
                                <Text className={`flex-1 ${isSelected ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>{task.text}</Text>
                                {task.required && <Text className="text-red-500 text-xs font-bold ml-2">REQ</Text>}
                            </TouchableOpacity>
                        )
                    })}
                </View>

                <Text className="text-gray-700 font-bold mb-2">Visit Notes</Text>
                <TextInput
                    className="bg-white border border-gray-300 rounded-xl p-4 h-32 text-gray-800 mb-6"
                    placeholder="Enter any additional observations..."
                    multiline
                    textAlignVertical="top"
                    value={notes}
                    onChangeText={setNotes}
                />

                <TouchableOpacity
                    className="bg-red-600 rounded-xl py-4 items-center shadow-md active:bg-red-700 mb-8"
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-lg">Sign & Complete Visit</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
