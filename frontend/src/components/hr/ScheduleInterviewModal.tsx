import { useState } from 'react';
import { Button } from '../ui/Button';
import { XMarkIcon, CalendarIcon } from '@heroicons/react/24/outline';

interface ScheduleInterviewModalProps {
  applicantName: string;
  position: string;
  applicantEmail?: string;
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (data: InterviewScheduleData) => void;
}

export interface InterviewScheduleData {
  interviewType: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  location: string;
  interviewerName: string;
  notes: string;
  sendCalendarInvite: boolean;
}

const INTERVIEW_TYPES = [
  { value: 'phone', label: 'Phone Screen' },
  { value: 'video', label: 'Video Interview (Zoom/Teams)' },
  { value: 'in_person', label: 'In-Person Interview' },
  { value: 'panel', label: 'Panel Interview' },
  { value: 'working', label: 'Working Interview / Job Shadow' },
  { value: 'final', label: 'Final Interview' }
];

const DURATION_OPTIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' }
];

export function ScheduleInterviewModal({
  applicantName,
  position,
  applicantEmail,
  isOpen,
  onClose,
  onSchedule
}: ScheduleInterviewModalProps) {
  const [interviewType, setInterviewType] = useState('phone');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [duration, setDuration] = useState(30);
  const [location, setLocation] = useState('');
  const [interviewerName, setInterviewerName] = useState('');
  const [notes, setNotes] = useState('');
  const [sendCalendarInvite, setSendCalendarInvite] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  // Set default date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const handleSubmit = async () => {
    if (!scheduledDate) {
      alert('Please select a date for the interview.');
      return;
    }
    if (!interviewerName.trim()) {
      alert('Please enter the interviewer name.');
      return;
    }

    setSubmitting(true);
    try {
      await onSchedule({
        interviewType,
        scheduledDate,
        scheduledTime,
        duration,
        location: location || getDefaultLocation(interviewType),
        interviewerName,
        notes,
        sendCalendarInvite
      });
      handleClose();
    } finally {
      setSubmitting(false);
    }
  };

  const getDefaultLocation = (type: string): string => {
    switch (type) {
      case 'phone': return 'Phone call';
      case 'video': return 'Video conference link will be sent';
      case 'in_person': return 'Main Office';
      default: return '';
    }
  };

  const handleClose = () => {
    setInterviewType('phone');
    setScheduledDate('');
    setScheduledTime('09:00');
    setDuration(30);
    setLocation('');
    setInterviewerName('');
    setNotes('');
    setSendCalendarInvite(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-500 rounded-full">
                  <CalendarIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Schedule Interview</h2>
                  <p className="text-sm text-primary-100">{applicantName} - {position}</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-white hover:bg-primary-500 rounded-full p-1 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {/* Interview Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interview Type <span className="text-danger-500">*</span>
              </label>
              <select
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              >
                {INTERVIEW_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date <span className="text-danger-500">*</span>
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={minDate}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time <span className="text-danger-500">*</span>
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                />
              </div>
            </div>

            {/* Duration */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              >
                {DURATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location / Meeting Link
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={getDefaultLocation(interviewType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>

            {/* Interviewer */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interviewer Name <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={interviewerName}
                onChange={(e) => setInterviewerName(e.target.value)}
                placeholder="Enter interviewer's name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes / Instructions for Candidate
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="E.g., Please bring your ID, arrive 10 minutes early..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm resize-none"
              />
            </div>

            {/* Send Calendar Invite */}
            <div className="mb-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendCalendarInvite}
                  onChange={(e) => setSendCalendarInvite(e.target.checked)}
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">
                  Send calendar invite to candidate
                </span>
              </label>
              {applicantEmail && (
                <p className="text-xs text-gray-500 mt-1 ml-7">
                  Invite will be sent to: {applicantEmail}
                </p>
              )}
            </div>

            {/* Summary */}
            {scheduledDate && (
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-primary-900 mb-2">Interview Summary</h4>
                <div className="text-sm text-primary-800 space-y-1">
                  <p><strong>Type:</strong> {INTERVIEW_TYPES.find(t => t.value === interviewType)?.label}</p>
                  <p><strong>When:</strong> {new Date(scheduledDate + 'T' + scheduledTime).toLocaleString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}</p>
                  <p><strong>Duration:</strong> {DURATION_OPTIONS.find(d => d.value === duration)?.label}</p>
                  {interviewerName && <p><strong>Interviewer:</strong> {interviewerName}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !scheduledDate || !interviewerName.trim()}
                className="bg-primary-600 hover:bg-primary-700"
              >
                {submitting ? 'Scheduling...' : 'Schedule Interview'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
