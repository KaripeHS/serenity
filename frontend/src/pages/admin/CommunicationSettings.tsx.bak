
import React, { useState, useEffect } from 'react';
import { SidebarLayout } from '../../components/layout/SidebarLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/use-toast';
import { Label } from '../../components/ui/label';

interface CommunicationSettings {
    ceo_email: string;
    cfo_email: string;
    coo_email: string;
    billing_email: string;
    general_email: string;
}

const defaultSettings: CommunicationSettings = {
    ceo_email: '',
    cfo_email: '',
    coo_email: '',
    billing_email: '',
    general_email: ''
};

export default function CommunicationSettingsPage() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<CommunicationSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);

    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            // In a real app, use an api client wrapper.
            // Using fetch for simplicity in this artifact.
            const token = localStorage.getItem('token'); // Simplistic auth
            const response = await fetch('http://localhost:3000/api/admin/settings/communications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setSettings(prev => ({ ...prev, ...data }));
            }
        } catch (error) {
            console.error('Failed to load settings', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3000/api/admin/settings/communications', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(settings)
            });

            if (response.ok) {
                toast({
                    title: "Settings Saved",
                    description: "Communication preferences have been updated.",
                    variant: "default",
                });
                setIsDirty(false);
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save settings. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleChange = (field: keyof CommunicationSettings, value: string) => {
        setSettings(prev => ({ ...prev, [field]: value }));
        setIsDirty(true);
    };

    return (
        <SidebarLayout>
            <div className="space-y-6 max-w-4xl mx-auto p-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Communication Center</h1>
                    <p className="text-muted-foreground">Manage automated alerts and executive routing.</p>
                </div>

                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Executive Channels (Readiness Brief)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label>CEO Email (Primary Alert)</Label>
                                <Input
                                    value={settings.ceo_email}
                                    onChange={(e) => handleChange('ceo_email', e.target.value)}
                                    placeholder="ceo@serenitycarepartners.com"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>CFO Email (Financials)</Label>
                                <Input
                                    value={settings.cfo_email}
                                    onChange={(e) => handleChange('cfo_email', e.target.value)}
                                    placeholder="cfo@serenitycarepartners.com"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>COO Email (Operations)</Label>
                                <Input
                                    value={settings.coo_email}
                                    onChange={(e) => handleChange('coo_email', e.target.value)}
                                    placeholder="coo@serenitycarepartners.com"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Operational Channels</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Billing / Claims Issues</Label>
                                <Input
                                    value={settings.billing_email}
                                    onChange={(e) => handleChange('billing_email', e.target.value)}
                                    placeholder="billing@serenitycarepartners.com"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>General Inquiries (Hello)</Label>
                                <Input
                                    value={settings.general_email}
                                    onChange={(e) => handleChange('general_email', e.target.value)}
                                    placeholder="hello@serenitycarepartners.com"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button onClick={handleSave} disabled={!isDirty}>
                            Save Changes
                        </Button>
                    </div>
                </div>
            </div>
        </SidebarLayout>
    );
}
