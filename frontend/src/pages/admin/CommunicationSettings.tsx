import { useState, useEffect } from 'react';
import { Label } from '../../components/ui/label';
import { useToast } from '../../hooks/use-toast';
import {
    BellIcon,
    EnvelopeIcon,
    DevicePhoneMobileIcon,
    CalendarIcon,
    ClockIcon,
    ShieldCheckIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    CogIcon,
    UserGroupIcon,
    DocumentTextIcon,
    BanknotesIcon,
    HeartIcon,
} from '@heroicons/react/24/outline';

interface NotificationCategory {
    id: string;
    name: string;
    description: string;
    icon: React.ElementType;
    settings: {
        email: boolean;
        sms: boolean;
        inApp: boolean;
    };
}

interface NotificationSchedule {
    quietHoursEnabled: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
    timezone: string;
    digestFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
}

export default function CommunicationSettings() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<'notifications' | 'channels' | 'schedule' | 'templates'>('notifications');
    const [saving, setSaving] = useState(false);

    // Notification categories
    const [categories, setCategories] = useState<NotificationCategory[]>([
        {
            id: 'scheduling',
            name: 'Scheduling & Shifts',
            description: 'Shift assignments, changes, and coverage requests',
            icon: CalendarIcon,
            settings: { email: true, sms: true, inApp: true }
        },
        {
            id: 'clinical',
            name: 'Clinical Alerts',
            description: 'Patient assessments due, care plan updates, incident reports',
            icon: HeartIcon,
            settings: { email: true, sms: true, inApp: true }
        },
        {
            id: 'compliance',
            name: 'Compliance & Credentials',
            description: 'License expirations, training due, compliance violations',
            icon: ShieldCheckIcon,
            settings: { email: true, sms: true, inApp: true }
        },
        {
            id: 'billing',
            name: 'Billing & Payments',
            description: 'Claims status, payment received, authorization alerts',
            icon: BanknotesIcon,
            settings: { email: true, sms: false, inApp: true }
        },
        {
            id: 'hr',
            name: 'HR & Workforce',
            description: 'Time-off requests, payroll notifications, team updates',
            icon: UserGroupIcon,
            settings: { email: true, sms: false, inApp: true }
        },
        {
            id: 'system',
            name: 'System Alerts',
            description: 'Security alerts, system maintenance, critical errors',
            icon: ExclamationTriangleIcon,
            settings: { email: true, sms: true, inApp: true }
        },
    ]);

    // Schedule settings
    const [schedule, setSchedule] = useState<NotificationSchedule>({
        quietHoursEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
        timezone: 'America/New_York',
        digestFrequency: 'daily',
    });

    // Channel settings
    const [channels, setChannels] = useState({
        email: {
            enabled: true,
            primaryEmail: '',
            secondaryEmail: '',
            verifiedPrimary: true,
            verifiedSecondary: false,
        },
        sms: {
            enabled: true,
            phoneNumber: '',
            verified: false,
            urgentOnly: true,
        },
        inApp: {
            enabled: true,
            showBadge: true,
            playSound: true,
        },
    });

    // Email templates
    const [templates, setTemplates] = useState([
        { id: 'shift_reminder', name: 'Shift Reminder', subject: 'Upcoming Shift Tomorrow', enabled: true },
        { id: 'credential_expiry', name: 'Credential Expiring', subject: 'Action Required: Credential Expiring Soon', enabled: true },
        { id: 'timesheet_approved', name: 'Timesheet Approved', subject: 'Your Timesheet Has Been Approved', enabled: true },
        { id: 'incident_filed', name: 'Incident Report Filed', subject: 'Incident Report Submitted', enabled: true },
        { id: 'coverage_needed', name: 'Coverage Request', subject: 'Coverage Needed for Shift', enabled: true },
        { id: 'payment_received', name: 'Payment Received', subject: 'Payment Confirmation', enabled: true },
    ]);

    const handleCategoryToggle = (categoryId: string, channel: 'email' | 'sms' | 'inApp') => {
        setCategories(prev => prev.map(cat => {
            if (cat.id === categoryId) {
                return {
                    ...cat,
                    settings: {
                        ...cat.settings,
                        [channel]: !cat.settings[channel]
                    }
                };
            }
            return cat;
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({ title: 'Success', description: 'Communication preferences saved successfully.' });
        setSaving(false);
    };

    const tabs = [
        { id: 'notifications', label: 'Notification Categories', icon: BellIcon },
        { id: 'channels', label: 'Delivery Channels', icon: DevicePhoneMobileIcon },
        { id: 'schedule', label: 'Schedule & Timing', icon: ClockIcon },
        { id: 'templates', label: 'Email Templates', icon: DocumentTextIcon },
    ];

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Communication Settings</h1>
                    <p className="text-gray-500 mt-1">Manage how and when you receive notifications</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                    {saving ? (
                        <>
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <CheckCircleIcon className="h-5 w-5" />
                            Save Changes
                        </>
                    )}
                </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="flex gap-4">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <tab.icon className="h-5 w-5" />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Notification Categories Tab */}
            {activeTab === 'notifications' && (
                <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <BellIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                                <h3 className="font-medium text-blue-900">Customize Your Notifications</h3>
                                <p className="text-sm text-blue-700">Choose which notification categories you want to receive via each channel. Critical alerts cannot be disabled.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <div className="flex items-center justify-center gap-1">
                                            <EnvelopeIcon className="h-4 w-4" />
                                            Email
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <div className="flex items-center justify-center gap-1">
                                            <DevicePhoneMobileIcon className="h-4 w-4" />
                                            SMS
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <div className="flex items-center justify-center gap-1">
                                            <BellIcon className="h-4 w-4" />
                                            In-App
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {categories.map(category => (
                                    <tr key={category.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gray-100 rounded-lg">
                                                    <category.icon className="h-5 w-5 text-gray-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{category.name}</p>
                                                    <p className="text-sm text-gray-500">{category.description}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <input
                                                type="checkbox"
                                                checked={category.settings.email}
                                                onChange={() => handleCategoryToggle(category.id, 'email')}
                                                className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <input
                                                type="checkbox"
                                                checked={category.settings.sms}
                                                onChange={() => handleCategoryToggle(category.id, 'sms')}
                                                className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <input
                                                type="checkbox"
                                                checked={category.settings.inApp}
                                                onChange={() => handleCategoryToggle(category.id, 'inApp')}
                                                className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Delivery Channels Tab */}
            {activeTab === 'channels' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Email Channel */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <EnvelopeIcon className="h-6 w-6 text-blue-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900">Email</h3>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={channels.email.enabled}
                                    onChange={e => setChannels({...channels, email: {...channels.email, enabled: e.target.checked}})}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <Label>Primary Email</Label>
                                <div className="flex items-center gap-2 mt-1">
                                    <input
                                        type="email"
                                        placeholder="your@email.com"
                                        value={channels.email.primaryEmail}
                                        onChange={e => setChannels({...channels, email: {...channels.email, primaryEmail: e.target.value}})}
                                        className="flex-1 border rounded p-2 text-sm"
                                    />
                                    {channels.email.verifiedPrimary && (
                                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                    )}
                                </div>
                            </div>
                            <div>
                                <Label>Secondary Email (optional)</Label>
                                <div className="flex items-center gap-2 mt-1">
                                    <input
                                        type="email"
                                        placeholder="backup@email.com"
                                        value={channels.email.secondaryEmail}
                                        onChange={e => setChannels({...channels, email: {...channels.email, secondaryEmail: e.target.value}})}
                                        className="flex-1 border rounded p-2 text-sm"
                                    />
                                    {channels.email.secondaryEmail && !channels.email.verifiedSecondary && (
                                        <button className="text-xs text-blue-600 hover:underline">Verify</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SMS Channel */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <DevicePhoneMobileIcon className="h-6 w-6 text-green-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900">SMS</h3>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={channels.sms.enabled}
                                    onChange={e => setChannels({...channels, sms: {...channels.sms, enabled: e.target.checked}})}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <Label>Phone Number</Label>
                                <div className="flex items-center gap-2 mt-1">
                                    <input
                                        type="tel"
                                        placeholder="+1 (555) 123-4567"
                                        value={channels.sms.phoneNumber}
                                        onChange={e => setChannels({...channels, sms: {...channels.sms, phoneNumber: e.target.value}})}
                                        className="flex-1 border rounded p-2 text-sm"
                                    />
                                    {channels.sms.phoneNumber && !channels.sms.verified && (
                                        <button className="text-xs text-blue-600 hover:underline">Verify</button>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={channels.sms.urgentOnly}
                                    onChange={e => setChannels({...channels, sms: {...channels.sms, urgentOnly: e.target.checked}})}
                                    className="h-4 w-4 text-green-600 rounded"
                                />
                                <Label className="text-sm">Urgent alerts only</Label>
                            </div>
                            <p className="text-xs text-gray-500">Standard SMS rates may apply. We recommend enabling only urgent alerts to avoid excessive messages.</p>
                        </div>
                    </div>

                    {/* In-App Channel */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <BellIcon className="h-6 w-6 text-purple-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900">In-App</h3>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={channels.inApp.enabled}
                                    onChange={e => setChannels({...channels, inApp: {...channels.inApp, enabled: e.target.checked}})}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label>Show notification badge</Label>
                                <input
                                    type="checkbox"
                                    checked={channels.inApp.showBadge}
                                    onChange={e => setChannels({...channels, inApp: {...channels.inApp, showBadge: e.target.checked}})}
                                    className="h-5 w-5 text-purple-600 rounded"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label>Play notification sound</Label>
                                <input
                                    type="checkbox"
                                    checked={channels.inApp.playSound}
                                    onChange={e => setChannels({...channels, inApp: {...channels.inApp, playSound: e.target.checked}})}
                                    className="h-5 w-5 text-purple-600 rounded"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Schedule Tab */}
            {activeTab === 'schedule' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Quiet Hours */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <ClockIcon className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Quiet Hours</h3>
                                <p className="text-sm text-gray-500">Pause non-urgent notifications during specific hours</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label>Enable Quiet Hours</Label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={schedule.quietHoursEnabled}
                                        onChange={e => setSchedule({...schedule, quietHoursEnabled: e.target.checked})}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>
                            {schedule.quietHoursEnabled && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Start Time</Label>
                                            <input
                                                type="time"
                                                value={schedule.quietHoursStart}
                                                onChange={e => setSchedule({...schedule, quietHoursStart: e.target.value})}
                                                className="w-full mt-1 border rounded p-2"
                                            />
                                        </div>
                                        <div>
                                            <Label>End Time</Label>
                                            <input
                                                type="time"
                                                value={schedule.quietHoursEnd}
                                                onChange={e => setSchedule({...schedule, quietHoursEnd: e.target.value})}
                                                className="w-full mt-1 border rounded p-2"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 bg-yellow-50 p-2 rounded">
                                        <ExclamationTriangleIcon className="h-4 w-4 inline text-yellow-600 mr-1" />
                                        Critical and urgent alerts will still be delivered during quiet hours.
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Digest Settings */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <DocumentTextIcon className="h-6 w-6 text-amber-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Email Digest</h3>
                                <p className="text-sm text-gray-500">Batch non-urgent notifications into a summary</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <Label>Digest Frequency</Label>
                                <select
                                    value={schedule.digestFrequency}
                                    onChange={e => setSchedule({...schedule, digestFrequency: e.target.value as any})}
                                    className="w-full mt-1 border rounded p-2"
                                >
                                    <option value="realtime">Real-time (No digest)</option>
                                    <option value="hourly">Hourly Summary</option>
                                    <option value="daily">Daily Summary (9 AM)</option>
                                    <option value="weekly">Weekly Summary (Monday)</option>
                                </select>
                            </div>
                            <div>
                                <Label>Timezone</Label>
                                <select
                                    value={schedule.timezone}
                                    onChange={e => setSchedule({...schedule, timezone: e.target.value})}
                                    className="w-full mt-1 border rounded p-2"
                                >
                                    <option value="America/New_York">Eastern Time (ET)</option>
                                    <option value="America/Chicago">Central Time (CT)</option>
                                    <option value="America/Denver">Mountain Time (MT)</option>
                                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Email Templates Tab */}
            {activeTab === 'templates' && (
                <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <DocumentTextIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                            <div>
                                <h3 className="font-medium text-yellow-900">Email Templates</h3>
                                <p className="text-sm text-yellow-700">Control which automated email types you receive. Disabling a template will suppress all emails of that type.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Template</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject Line</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Enabled</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Preview</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {templates.map(template => (
                                    <tr key={template.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-gray-900">{template.name}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-600">{template.subject}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <input
                                                type="checkbox"
                                                checked={template.enabled}
                                                onChange={() => {
                                                    setTemplates(prev => prev.map(t =>
                                                        t.id === template.id ? {...t, enabled: !t.enabled} : t
                                                    ));
                                                }}
                                                className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
                                                Preview
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
