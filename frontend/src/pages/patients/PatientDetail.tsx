import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { consoleApi, Client, Shift } from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import {
    ArrowLeftIcon,
    UserIcon,
    PhoneIcon,
    MapPinIcon,
    CalendarIcon,
    ClipboardDocumentCheckIcon,
    ClockIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';

interface PatientDetailProps { }

export function PatientDetail() {
    const { patientId } = useParams();
    const { user } = useAuth();
    const [patient, setPatient] = useState<Client | null>(null);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadPatientDetails() {
            if (!user?.organizationId || !patientId) return;

            try {
                setLoading(true);
                const [patientData, scheduleData] = await Promise.all([
                    consoleApi.getClient(user.organizationId, patientId),
                    consoleApi.getClientSchedule(user.organizationId, patientId)
                ]);

                setPatient(patientData);
                setShifts(scheduleData.shifts || []);
            } catch (error) {
                console.error("Failed to load patient details", error);
            } finally {
                setLoading(false);
            }
        }

        loadPatientDetails();
    }, [user?.organizationId, patientId]);

    if (loading) {
        return (
            <div className="p-6 max-w-7xl mx-auto">
                <Skeleton className="h-8 w-48 mb-6" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Card><Skeleton className="h-48 w-full" /></Card>
                        <Card><Skeleton className="h-64 w-full" /></Card>
                    </div>
                    <div className="space-y-6">
                        <Card><Skeleton className="h-32 w-full" /></Card>
                        <Card><Skeleton className="h-32 w-full" /></Card>
                    </div>
                </div>
            </div>
        );
    }

    if (!patient) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center p-6">
                <div className="max-w-md w-full text-center">
                    {/* Icon */}
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                        <UserIcon className="h-8 w-8 text-gray-400" />
                    </div>

                    {/* Message */}
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Patient Not Found</h2>
                    <p className="text-gray-600 mb-6">
                        The patient you're looking for doesn't exist or may have been removed.
                        This could be because:
                    </p>

                    {/* Possible reasons */}
                    <ul className="text-left text-sm text-gray-500 mb-8 space-y-2 bg-gray-50 rounded-lg p-4">
                        <li className="flex items-start gap-2">
                            <span className="text-gray-400">•</span>
                            <span>The patient ID <code className="bg-gray-200 px-1 rounded text-xs">{patientId}</code> is invalid</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-gray-400">•</span>
                            <span>The patient record was deleted or transferred</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-gray-400">•</span>
                            <span>You may not have permission to view this patient</span>
                        </li>
                    </ul>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                            to="/patients"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                        >
                            <ArrowLeftIcon className="h-4 w-4" />
                            Back to Patient List
                        </Link>
                        <button
                            onClick={() => window.location.reload()}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>

                    {/* Help link */}
                    <p className="mt-6 text-sm text-gray-500">
                        Need help? Contact your administrator or{' '}
                        <a href="mailto:support@serenitycarepartners.com" className="text-primary-600 hover:underline">
                            support team
                        </a>
                    </p>
                </div>
            </div>
        );
    }

    // Format Helpers
    const formatDate = (date: string) => new Date(date).toLocaleDateString();
    const formatTime = (date: string) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="bg-gray-50 min-h-screen pb-12">
            <div className="max-w-7xl mx-auto p-4 md:p-8">
                {/* Header */}
                <div className="mb-6">
                    <Link
                        to="/patients"
                        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-4"
                    >
                        <ArrowLeftIcon className="h-4 w-4" />
                        <span>Back to Patients</span>
                    </Link>
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                {patient.firstName} {patient.lastName}
                                <Badge variant={patient.status === 'active' ? 'success' : 'gray'}>
                                    {patient.status.toUpperCase()}
                                </Badge>
                            </h1>
                            <p className="text-gray-500 mt-1">
                                Client ID: {patient.medicaidNumber || 'N/A'} • Pod: {patient.podName || 'Unassigned'}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                                Edit Profile
                            </button>
                            <button className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors">
                                Schedule Visit
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Main Info */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Demographics */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Demographics & Contact</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <UserIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Date of Birth</p>
                                                <p className="text-gray-600">{patient.dateOfBirth ? formatDate(patient.dateOfBirth) : 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Address</p>
                                                <p className="text-gray-600">
                                                    {patient.address}<br />
                                                    {patient.city}, {patient.state} {patient.zip}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <PhoneIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Phone</p>
                                                <p className="text-gray-600">{patient.phone || 'No phone'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <ShieldCheckIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Insurance</p>
                                                <p className="text-gray-600">
                                                    {patient.medicaidNumber ? `Medicaid: ${patient.medicaidNumber}` : 'Private Pay'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Activity / Visits */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Visits & Schedule</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {shifts.length === 0 ? (
                                    <p className="text-gray-500 py-4">No recent or scheduled visits found.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {shifts.map((shift) => (
                                            <div key={shift.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 bg-white rounded-md shadow-sm">
                                                        <ClockIcon className="h-6 w-6 text-primary-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">
                                                            {formatDate(shift.scheduledStart)} • {formatTime(shift.scheduledStart)} - {formatTime(shift.scheduledEnd)}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            Caregiver: {shift.caregiverName}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge variant={shift.status === 'completed' ? 'success' : shift.status === 'scheduled' ? 'info' : 'warning'}>
                                                    {shift.status}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Service Authorizations */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center">
                                    <span>Service Authorizations</span>
                                    <Badge variant="outline">{patient.authorizations?.length || 0} Active</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {(!patient.authorizations || patient.authorizations.length === 0) ? (
                                    <p className="text-gray-500 py-4">No active authorizations on file.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {patient.authorizations.map((auth) => {
                                            const percentUsed = auth.unitsApproved > 0 ? (auth.unitsUsed / auth.unitsApproved) * 100 : 0;
                                            return (
                                                <div key={auth.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <p className="font-medium text-gray-900">{auth.serviceCode} - {auth.authorizationNumber}</p>
                                                            <p className="text-sm text-gray-500">
                                                                {formatDate(auth.startDate)} - {formatDate(auth.endDate)}
                                                            </p>
                                                        </div>
                                                        <Badge variant={auth.status === 'active' ? 'success' : 'warning'}>
                                                            {auth.status.toUpperCase()}
                                                        </Badge>
                                                    </div>

                                                    {/* Usage Bar */}
                                                    <div className="mt-3">
                                                        <div className="flex justify-between text-xs mb-1">
                                                            <span className="text-gray-600">Usage: {auth.unitsUsed} / {auth.unitsApproved} Units</span>
                                                            <span className={`font-medium ${percentUsed > 90 ? 'text-red-600' : 'text-gray-900'}`}>
                                                                {percentUsed.toFixed(1)}%
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className={`h-2 rounded-full ${percentUsed > 90 ? 'bg-red-500' : percentUsed > 75 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                                style={{ width: `${Math.min(percentUsed, 100)}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Quick Stats & Actions */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Care Team</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="h-10 w-10 rounded-full bg-caregiver-100 flex items-center justify-center text-caregiver-700 font-bold">
                                        {patient.podCode ? patient.podCode.substring(0, 2) : 'NA'}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Pod: {patient.podName || 'Unassigned'}</p>
                                        <p className="text-sm text-gray-500">Region: {patient.podCode || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="border-t border-gray-100 pt-4 mt-4">
                                    <p className="text-sm text-gray-500 mb-2">Primary Caregiver</p>
                                    {/* Placeholder for primary caregiver fetching */}
                                    <p className="font-medium text-gray-900">Assigned by Pod</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Compliance Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">EVV Consent</span>
                                        <Badge variant="success">Signed</Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Care Plan</span>
                                        <Badge variant="warning">Needs Review</Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Auth Status</span>
                                        <Badge variant="success">Active</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
