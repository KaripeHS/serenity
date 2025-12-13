/**
 * TaskChecklist Component
 * Displays care tasks for a visit with completion tracking
 * Supports task notes and completion timestamps
 *
 * @module components/TaskChecklist
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface CareTask {
  id: string;
  category: string;
  name: string;
  serviceCode: string;
  frequency?: string;
  instructions?: string;
  required?: boolean;
}

export interface TaskCompletion {
  taskId: string;
  completed: boolean;
  notes?: string;
  completedAt?: string;
}

interface TaskChecklistProps {
  tasks: CareTask[];
  completions: TaskCompletion[];
  onTaskToggle: (taskId: string, completed: boolean, notes?: string) => void;
  readOnly?: boolean;
}

// Category icons and colors
const categoryConfig: Record<string, { icon: string; color: string; bgColor: string }> = {
  personal_care: { icon: 'person', color: '#0d6efd', bgColor: '#e7f1ff' },
  homemaker: { icon: 'home', color: '#198754', bgColor: '#d1e7dd' },
  respite: { icon: 'heart', color: '#dc3545', bgColor: '#f8d7da' },
  medication: { icon: 'medical', color: '#6f42c1', bgColor: '#e2d9f3' },
  errands: { icon: 'car', color: '#fd7e14', bgColor: '#ffe5d0' },
};

export const TaskChecklist: React.FC<TaskChecklistProps> = ({
  tasks,
  completions,
  onTaskToggle,
  readOnly = false,
}) => {
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<CareTask | null>(null);
  const [taskNotes, setTaskNotes] = useState('');

  // Group tasks by category
  const groupedTasks = tasks.reduce((acc, task) => {
    const category = task.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(task);
    return acc;
  }, {} as Record<string, CareTask[]>);

  const getCompletion = (taskId: string): TaskCompletion | undefined => {
    return completions.find((c) => c.taskId === taskId);
  };

  const isCompleted = (taskId: string): boolean => {
    return getCompletion(taskId)?.completed || false;
  };

  const handleTaskPress = (task: CareTask) => {
    if (readOnly) return;

    const completion = getCompletion(task.id);
    if (completion?.completed) {
      // Already completed - toggle off
      onTaskToggle(task.id, false);
    } else {
      // Not completed - show notes modal
      setSelectedTask(task);
      setTaskNotes(completion?.notes || '');
      setNotesModalVisible(true);
    }
  };

  const handleCompleteWithNotes = () => {
    if (selectedTask) {
      onTaskToggle(selectedTask.id, true, taskNotes.trim() || undefined);
      setNotesModalVisible(false);
      setSelectedTask(null);
      setTaskNotes('');
    }
  };

  const handleQuickComplete = () => {
    if (selectedTask) {
      onTaskToggle(selectedTask.id, true);
      setNotesModalVisible(false);
      setSelectedTask(null);
      setTaskNotes('');
    }
  };

  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      personal_care: 'Personal Care',
      homemaker: 'Homemaker Services',
      respite: 'Respite Care',
      medication: 'Medication Assistance',
      errands: 'Errands & Escort',
      other: 'Other Tasks',
    };
    return labels[category] || category;
  };

  const completedCount = completions.filter((c) => c.completed).length;
  const totalCount = tasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <View style={styles.container}>
      {/* Progress Header */}
      <View style={styles.progressHeader}>
        <Text style={styles.progressText}>
          {completedCount} of {totalCount} tasks completed
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>

      {/* Task List by Category */}
      <ScrollView style={styles.taskList} showsVerticalScrollIndicator={false}>
        {Object.entries(groupedTasks).map(([category, categoryTasks]) => {
          const config = categoryConfig[category] || {
            icon: 'checkbox',
            color: '#6c757d',
            bgColor: '#e9ecef',
          };

          return (
            <View key={category} style={styles.categorySection}>
              <View style={[styles.categoryHeader, { backgroundColor: config.bgColor }]}>
                <Ionicons name={config.icon as any} size={18} color={config.color} />
                <Text style={[styles.categoryTitle, { color: config.color }]}>
                  {getCategoryLabel(category)}
                </Text>
              </View>

              {categoryTasks.map((task) => {
                const completed = isCompleted(task.id);
                const completion = getCompletion(task.id);

                return (
                  <TouchableOpacity
                    key={task.id}
                    style={[styles.taskItem, completed && styles.taskItemCompleted]}
                    onPress={() => handleTaskPress(task)}
                    disabled={readOnly}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        completed && styles.checkboxCompleted,
                        completed && { borderColor: config.color, backgroundColor: config.color },
                      ]}
                    >
                      {completed && <Ionicons name="checkmark" size={16} color="#fff" />}
                    </View>

                    <View style={styles.taskContent}>
                      <Text style={[styles.taskName, completed && styles.taskNameCompleted]}>
                        {task.name}
                        {task.required && <Text style={styles.required}> *</Text>}
                      </Text>
                      {task.instructions && (
                        <Text style={styles.taskInstructions}>{task.instructions}</Text>
                      )}
                      {completion?.notes && (
                        <View style={styles.notesContainer}>
                          <Ionicons name="document-text" size={12} color="#6c757d" />
                          <Text style={styles.notesText}>{completion.notes}</Text>
                        </View>
                      )}
                    </View>

                    {!readOnly && !completed && (
                      <Ionicons name="chevron-forward" size={20} color="#adb5bd" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
      </ScrollView>

      {/* Notes Modal */}
      <Modal visible={notesModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Complete Task</Text>
              <TouchableOpacity
                onPress={() => {
                  setNotesModalVisible(false);
                  setSelectedTask(null);
                }}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalTaskName}>{selectedTask?.name}</Text>

            <Text style={styles.inputLabel}>Notes (optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={taskNotes}
              onChangeText={setTaskNotes}
              placeholder="Add any notes about this task..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.quickCompleteButton} onPress={handleQuickComplete}>
                <Text style={styles.quickCompleteText}>Complete Without Notes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.completeButton} onPress={handleCompleteWithNotes}>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.completeButtonText}>Complete Task</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  progressHeader: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  progressText: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
    fontWeight: '500',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#198754',
    borderRadius: 4,
  },
  taskList: {
    flex: 1,
  },
  categorySection: {
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  taskItemCompleted: {
    backgroundColor: '#f8f9fa',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#dee2e6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxCompleted: {
    borderColor: '#198754',
    backgroundColor: '#198754',
  },
  taskContent: {
    flex: 1,
  },
  taskName: {
    fontSize: 15,
    color: '#212529',
    fontWeight: '500',
  },
  taskNameCompleted: {
    color: '#6c757d',
    textDecorationLine: 'line-through',
  },
  required: {
    color: '#dc3545',
    fontWeight: '600',
  },
  taskInstructions: {
    fontSize: 13,
    color: '#6c757d',
    marginTop: 2,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  notesText: {
    fontSize: 12,
    color: '#6c757d',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  modalTaskName: {
    fontSize: 16,
    color: '#495057',
    marginBottom: 16,
    fontWeight: '500',
  },
  inputLabel: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#212529',
    minHeight: 100,
    marginBottom: 16,
  },
  modalActions: {
    gap: 12,
  },
  quickCompleteButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  quickCompleteText: {
    fontSize: 15,
    color: '#6c757d',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#198754',
    paddingVertical: 16,
    borderRadius: 12,
  },
  completeButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

export default TaskChecklist;
