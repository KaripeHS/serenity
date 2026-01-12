/**
 * User Detail Page
 * Comprehensive view and management of individual user accounts
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    adminService,
    User,
    Credential,
    UserActivity,
    UserSession
} from '../../../services/admin.service';
import { Badge } from '../../../components/ui/Badge';
import { UserPodAssignment } from '../../../components/pods/UserPodAssignment';
import { getMemberCurrentPod } from '../../../utils/podAssignment';
import {
    ArrowLeftIcon,
    PencilIcon,
    KeyIcon,
    CheckCircleIcon,
    XCircleIcon,
    TrashIcon,
    ClockIcon,
    ShieldCheckIcon,
    DocumentTextIcon,
    UserIcon,
    EnvelopeIcon,
    PhoneIcon,
    MapPinIcon,
    CalendarIcon,
    BriefcaseIcon
} from '@heroicons/react/24/outline';

type TabType = 'overview' | 'credentials' | 'activity' | 'sessions' | 'settings';

export function UserDetailPage() {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();

    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('overview');

    // Data for different tabs
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [activities, setActivities] = useState<UserActivity[]>([]);
    const [sessions, setSessions] = useState<UserSession[]>([]);

    // Loading states
    const [loadingCredentials, setLoadingCredentials] = useState(false);
    const [loadingActivities, setLoadingActivities] = useState(false);
    const [loadingSessions, setLoadingSessions] = useState(false);

    // Edit states
    const [isEditingRole, setIsEditingRole] = useState(false);
    const [editRole, setEditRole] = useState('');
    const [editClinicalRole, setEditClinicalRole] = useState('');

    // Pod assignment state
    const [currentPodId, setCurrentPodId] = useState<string | undefined>();
    const [currentPodName, setCurrentPodName] = useState<string | undefined>();

    useEffect(() => {
        if (userId) {
            fetchUser();
        }
    }, [userId]);

    useEffect(() => {
        if (user) {
            switch (activeTab) {
                case 'credentials':
                    fetchCredentials();
                    break;
                case 'activity':
                    fetchActivities();
                    break;
                case 'sessions':
                    fetchSessions();
                    break;
            }
        }
    }, [activeTab, user]);

    const fetchPodAssignment = () => {
        if (!userId) return;
        const podInfo = getMemberCurrentPod(userId);
        if (podInfo) {
            setCurrentPodId(podInfo.podId);
            setCurrentPodName(podInfo.podName);
        } else {
            setCurrentPodId(undefined);
            setCurrentPodName(undefined);
        }
    };

    const fetchUser = async () => {
        try {
            setLoading(true);
            setError('');
            // Fetch all users and find the one we need
            const users = await adminService.getUsers();
            const foundUser = users.find(u => u.id === userId);

            if (foundUser) {
                setUser(foundUser);
                setEditRole(foundUser.role);
                setEditClinicalRole(foundUser.clinicalRole || '');
                // Fetch pod assignment
                fetchPodAssignment();
            } else {
                setError('User not found');
            }
        } catch (err: any) {
            console.error('Failed to fetch user:', err);
            setError(err?.message || 'Failed to load user');
        } finally {
            setLoading(false);
        }
    };

    const fetchCredentials = async () => {
        if (!userId) return;
        try {
            setLoadingCredentials(true);
            const data = await adminService.getCaregiverCredentials(userId);
            setCredentials(data.credentials || []);
        } catch (err) {
            console.error('Failed to fetch credentials:', err);
            setCredentials([]);
        } finally {
            setLoadingCredentials(false);
        }
    };

    const fetchActivities = async () => {
        if (!userId) return;
        try {
            setLoadingActivities(true);
            const data = await adminService.getUserActivity(userId);
            setActivities(data.activities || []);
        } catch (err) {
            console.error('Failed to fetch activities:', err);
            setActivities([]);
        } finally {
            setLoadingActivities(false);
        }
    };

    const fetchSessions = async () => {
        if (!userId) return;
        try {
            setLoadingSessions(true);
            const data = await adminService.getUserSessions(userId);
            setSessions(data.sessions || []);
        } catch (err) {
            console.error('Failed to fetch sessions:', err);
            setSessions([]);
        } finally {
            setLoadingSessions(false);
        }
    };

    const handleSaveRole = async () => {
        if (!user) return;
        try {
            await adminService.updateUserRole(user.id, editRole, editClinicalRole || undefined);
            setIsEditingRole(false);
            fetchUser();
        } catch (err: any) {
            alert(err?.message || 'Failed to update role');
        }
    };

    const handleResetPassword = async () => {
        if (!user) return;
        if (!confirm(`Reset password for ${user.firstName} ${user.lastName}?`)) return;

        try {
            const response = await adminService.resetUserPassword(user.id, true);
            alert(response.message);
        } catch (err: any) {
            alert(err?.message || 'Failed to reset password');
        }
    };

    const handleActivateUser = async () => {
        if (!user) return;
        try {
            await adminService.activateUser(user.id);
            fetchUser();
        } catch (err: any) {
            alert(err?.message || 'Failed to activate user');
        }
    };

    const handleDeactivateUser = async () => {
        if (!user) return;
        const reason = prompt('Reason for deactivation (optional):');

        try {
            await adminService.deactivateUser(user.id, reason || undefined);
            fetchUser();
        } catch (err: any) {
            alert(err?.message || 'Failed to deactivate user');
        }
    };

    const handleDeleteUser = async () => {
        if (!user) return;
        if (!confirm(`Archive user ${user.firstName} ${user.lastName}? This action can be reversed.`)) return;

        try {
            await adminService.deleteUser(user.id);
            navigate('/admin/users');
        } catch (err: any) {
            alert(err?.message || 'Failed to archive user');
        }
    };

    const handleTerminateSession = async (sessionId: string) => {
        if (!user) return;
        try {
            await adminService.terminateSession(user.id, sessionId);
            fetchSessions();
        } catch (err: any) {
            alert(err?.message || 'Failed to terminate session');
        }
    };

    const handleTerminateAllSessions = async () => {
        if (!user) return;
        if (!confirm('Terminate all sessions for this user?')) return;

        try {
            await adminService.terminateAllSessions(user.id);
            fetchSessions();
        } catch (err: any) {
            alert(err?.message || 'Failed to terminate sessions');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return <Badge variant="success">Active</Badge>;
            case 'inactive': return <Badge variant="default">Inactive</Badge>;
            case 'suspended': return <Badge variant="danger">Suspended</Badge>;
            case 'pending': return <Badge variant="default">Pending</Badge>;
            default: return <Badge variant="default">{status}</Badge>;
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading user...</p>
                </div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center max-w-md">
                    <div className="text-red-600 font-semibold mb-2">{error || 'User not found'}</div>
                    <Link
                        to="/admin/users"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <ArrowLeftIcon className="h-4 w-4 mr-2" />
                        Back to Users
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Link
                                to="/admin/users"
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                            >
                                <ArrowLeftIcon className="h-5 w-5" />
                            </Link>
                            <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                                {user.firstName[0]}{user.lastName[0]}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    {user.firstName} {user.lastName}
                                </h1>
                                <p className="text-gray-600">{user.email}</p>
                                <div className="mt-1">{getStatusBadge(user.status)}</div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleResetPassword}
                                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
                            >
                                <KeyIcon className="h-4 w-4" />
                                Reset Password
                            </button>
                            {user.status === 'active' ? (
                                <button
                                    onClick={handleDeactivateUser}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                                >
                                    <XCircleIcon className="h-4 w-4" />
                                    Deactivate
                                </button>
                            ) : (
                                <button
                                    onClick={handleActivateUser}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                                >
                                    <CheckCircleIcon className="h-4 w-4" />
                                    Activate
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="mt-6 border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            {[
                                { id: 'overview', label: 'Overview', icon: UserIcon },
                                { id: 'credentials', label: 'Credentials', icon: ShieldCheckIcon },
                                { id: 'activity', label: 'Activity Log', icon: ClockIcon },
                                { id: 'sessions', label: 'Sessions', icon: DocumentTextIcon },
                                { id: 'settings', label: 'Settings', icon: PencilIcon }
                            ].map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as TabType)}
                                        className={`
                                            flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                                            ${activeTab === tab.id
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            }
                                        `}
                                    >
                                        <Icon className="h-5 w-5" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Basic Information */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <UserIcon className="h-5 w-5 text-gray-400" />
                                    Basic Information
                                </h3>
                                <dl className="space-y-3">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">User ID</dt>
                                        <dd className="mt-1 text-sm text-gray-900 font-mono">{user.id}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Email</dt>
                                        <dd className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                                            <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                                            {user.email}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Status</dt>
                                        <dd className="mt-1">{getStatusBadge(user.status)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Last Login</dt>
                                        <dd className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                                            <CalendarIcon className="h-4 w-4 text-gray-400" />
                                            {formatDate(user.lastLogin)}
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            {/* Role & Permissions */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <BriefcaseIcon className="h-5 w-5 text-gray-400" />
                                        Role & Permissions
                                    </h3>
                                    {!isEditingRole && (
                                        <button
                                            onClick={() => setIsEditingRole(true)}
                                            className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
                                        >
                                            <PencilIcon className="h-4 w-4" />
                                            Edit
                                        </button>
                                    )}
                                </div>

                                {isEditingRole ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                System Role
                                            </label>
                                            <select
                                                value={editRole}
                                                onChange={(e) => setEditRole(e.target.value)}
                                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="admin">IT Admin</option>
                                                <option value="ceo">CEO</option>
                                                <option value="cfo">CFO</option>
                                                <option value="hr_manager">HR Manager</option>
                                                <option value="caregiver">Caregiver</option>
                                                <option value="rn_case_manager">RN Case Manager</option>
                                                <option value="nurse">Nurse</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Clinical Role (Optional)
                                            </label>
                                            <input
                                                type="text"
                                                value={editClinicalRole}
                                                onChange={(e) => setEditClinicalRole(e.target.value)}
                                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="e.g., RN, LPN, PT"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleSaveRole}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                            >
                                                Save Changes
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsEditingRole(false);
                                                    setEditRole(user.role);
                                                    setEditClinicalRole(user.clinicalRole || '');
                                                }}
                                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <dl className="space-y-3">
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">System Role</dt>
                                            <dd className="mt-1">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {user.role}
                                                </span>
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Clinical Role</dt>
                                            <dd className="mt-1">
                                                {user.clinicalRole ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                        {user.clinicalRole}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-gray-500">Not assigned</span>
                                                )}
                                            </dd>
                                        </div>
                                        <div>
                                            <UserPodAssignment
                                                userId={user.id}
                                                userName={`${user.firstName} ${user.lastName}`}
                                                userEmail={user.email}
                                                userRole={user.role}
                                                memberType={user.role === 'patient' || user.role === 'client' ? 'patient' : 'staff'}
                                                currentPodId={currentPodId}
                                                currentPodName={currentPodName}
                                                onAssignmentChange={fetchPodAssignment}
                                            />
                                        </div>
                                    </dl>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Credentials Tab */}
                {activeTab === 'credentials' && (
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Licenses & Certifications</h3>
                            {loadingCredentials ? (
                                <div className="text-center py-8 text-gray-500">Loading credentials...</div>
                            ) : credentials.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">No credentials found</div>
                            ) : (
                                <div className="space-y-3">
                                    {credentials.map((cred) => (
                                        <div key={cred.id} className="p-4 border rounded-lg hover:bg-gray-50">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-medium text-gray-900">{cred.type}</h4>
                                                    <p className="text-sm text-gray-600">Number: {cred.number || cred.credential_number || 'N/A'}</p>
                                                </div>
                                                <Badge variant={cred.status === 'valid' ? 'success' : 'danger'}>
                                                    {cred.status}
                                                </Badge>
                                            </div>
                                            <div className="mt-2 text-sm text-gray-600">
                                                <p>Expires: {formatDate(cred.expirationDate)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Activity Log Tab */}
                {activeTab === 'activity' && (
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                            {loadingActivities ? (
                                <div className="text-center py-8 text-gray-500">Loading activities...</div>
                            ) : activities.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">No activity found</div>
                            ) : (
                                <div className="space-y-3">
                                    {activities.map((activity) => (
                                        <div key={activity.id} className="p-4 border rounded-lg">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-medium text-gray-900">{activity.action}</h4>
                                                    <p className="text-sm text-gray-600">{activity.details}</p>
                                                </div>
                                                <span className="text-xs text-gray-500">{formatDate(activity.createdAt)}</span>
                                            </div>
                                            <div className="mt-2 text-xs text-gray-500">
                                                <p>IP: {activity.ipAddress}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Sessions Tab */}
                {activeTab === 'sessions' && (
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Active Sessions</h3>
                                {sessions.length > 0 && (
                                    <button
                                        onClick={handleTerminateAllSessions}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                    >
                                        Terminate All Sessions
                                    </button>
                                )}
                            </div>
                            {loadingSessions ? (
                                <div className="text-center py-8 text-gray-500">Loading sessions...</div>
                            ) : sessions.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">No active sessions</div>
                            ) : (
                                <div className="space-y-3">
                                    {sessions.map((session) => (
                                        <div key={session.id} className="p-4 border rounded-lg flex justify-between items-center">
                                            <div>
                                                <p className="font-medium text-gray-900">{session.ipAddress}</p>
                                                <p className="text-sm text-gray-600">{session.userAgent}</p>
                                                <p className="text-xs text-gray-500 mt-1">Last activity: {formatDate(session.lastActivity)}</p>
                                            </div>
                                            <button
                                                onClick={() => handleTerminateSession(session.id)}
                                                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                                            >
                                                Terminate
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4 text-red-600">Danger Zone</h3>
                            <div className="space-y-4">
                                <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                                    <h4 className="font-medium text-gray-900 mb-2">Archive User Account</h4>
                                    <p className="text-sm text-gray-600 mb-4">
                                        This will archive the user account. The user will no longer be able to access the system.
                                        This action can be reversed.
                                    </p>
                                    <button
                                        onClick={handleDeleteUser}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                        Archive User
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
