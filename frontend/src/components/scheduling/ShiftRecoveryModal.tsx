
import { useState, useEffect } from 'react';
import { request, Shift, consoleApi, Client } from '../../services/api'; // Using existing api helpers
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface ReplacementsResponse {
    shiftId: string;
    replacements: CaregiverReplacement[];
}

interface CaregiverReplacement {
    caregiver: {
        id: string;
        name: string;
        phone: string;
        email: string;
    };
    score: number;
    distanceMiles: number;
    reasons: string[];
    warnings: string[];
}

interface ShiftRecoveryModalProps {
    shift: Shift;
    onClose: () => void;
    onAssign: (caregiverId: string) => Promise<void>;
}

export function ShiftRecoveryModal({ shift, onClose, onAssign }: ShiftRecoveryModalProps) {
    const [replacements, setReplacements] = useState<CaregiverReplacement[]>([]);
    const [loading, setLoading] = useState(true);
    const [notified, setNotified] = useState<string[]>([]);
    const [organizationId, setOrganizationId] = useState<string | null>(null);

    useEffect(() => {
        // HACK: Get org ID from auth context or implicit in API wrapper. 
        // For now, assume we can get it from storage or props (but props don't pass it).
        // In a real app, useAuth() hook.
        // Assuming user.organizationId is available in localStorage or we fetch from user profile.
        const storedUser = localStorage.getItem('serenity_user_data');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            setOrganizationId(user.organizationId);
            loadReplacements(user.organizationId);
        }
    }, [shift.id]);

    const loadReplacements = async (orgId: string) => {
        try {
            setLoading(true);
            const data = await request<ReplacementsResponse>(`/api/console/shifts/${orgId}/${shift.id}/replacements`);
            setReplacements(data.replacements);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleNotify = async (caregiverId: string) => {
        // Mock notification
        alert(`Notification sent to caregiver!`);
        setNotified([...notified, caregiverId]);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Shift Recovery</h2>
                        <p className="text-sm text-gray-500">Find replacement for {shift.scheduledStart}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <span className="sr-only">Close</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                            <p className="mt-2 text-gray-500">Analyzing staff availability...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {replacements.length === 0 ? (
                                <p className="text-center text-gray-500 py-4">No matching caregivers found.</p>
                            ) : (
                                replacements.map((rep) => (
                                    <div key={rep.caregiver.id} className="border rounded-lg p-4 flex flex-col md:flex-row justify-between gap-4 hover:border-primary-100 transition-colors">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-medium text-gray-900">{rep.caregiver.name}</h3>
                                                <Badge variant={rep.score > 80 ? 'success' : 'warning'}>
                                                    {rep.score}% Match
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-500 mb-2">
                                                {rep.distanceMiles.toFixed(1)} miles away • {rep.caregiver.phone}
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                                {rep.reasons.map((r, i) => (
                                                    <span key={i} className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded">✓ {r}</span>
                                                ))}
                                                {rep.warnings.map((w, i) => (
                                                    <span key={i} className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded">! {w}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 justify-center">
                                            <button
                                                onClick={() => handleNotify(rep.caregiver.id)}
                                                disabled={notified.includes(rep.caregiver.id)}
                                                className={`px-3 py-1.5 text-sm font-medium rounded border ${notified.includes(rep.caregiver.id) ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                                            >
                                                {notified.includes(rep.caregiver.id) ? 'Sent' : 'Message'}
                                            </button>
                                            <button
                                                onClick={() => onAssign(rep.caregiver.id)}
                                                className="px-3 py-1.5 text-sm font-medium rounded bg-primary-600 text-white hover:bg-primary-700"
                                            >
                                                Assign
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
