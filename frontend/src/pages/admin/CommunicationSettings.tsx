
import { useState } from 'react';
import SidebarLayout from '../../components/layouts/SidebarLayout';
import { Label } from '../../components/ui/label';
import { useToast } from '../../hooks/use-toast';

export default function CommunicationSettings() {
    const { toast } = useToast();
    const [settings, setSettings] = useState({
        emailNotifications: true,
        smsAlerts: true,
        dailyDigest: false,
        marketingEmails: false
    });

    const handleSave = () => {
        // Mock save
        toast({ title: 'Success', description: 'Preferences saved.' });
    };

    return (
        <SidebarLayout>
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-6">Communication Settings</h1>
                <div className="bg-white p-6 rounded-lg shadow max-w-lg">
                    <h2 className="text-lg font-semibold mb-4">Notification Preferences</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label>Email Notifications</Label>
                            <input
                                type="checkbox"
                                checked={settings.emailNotifications}
                                onChange={e => setSettings({ ...settings, emailNotifications: e.target.checked })}
                                className="h-5 w-5"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label>SMS Alerts (Urgent)</Label>
                            <input
                                type="checkbox"
                                checked={settings.smsAlerts}
                                onChange={e => setSettings({ ...settings, smsAlerts: e.target.checked })}
                                className="h-5 w-5"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label>Daily Digest</Label>
                            <input
                                type="checkbox"
                                checked={settings.dailyDigest}
                                onChange={e => setSettings({ ...settings, dailyDigest: e.target.checked })}
                                className="h-5 w-5"
                            />
                        </div>
                        <div className="pt-4">
                            <button onClick={handleSave} className="w-full bg-blue-600 text-white py-2 rounded">Save Preferences</button>
                        </div>
                    </div>
                </div>
            </div>
        </SidebarLayout>
    );
}
