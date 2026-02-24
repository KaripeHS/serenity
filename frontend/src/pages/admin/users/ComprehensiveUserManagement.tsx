/**
 * Comprehensive User Management System
 * Enterprise-grade user administration with advanced features
 */

import React, { useState, useEffect } from 'react';
import {
    adminService,
    User,
    Credential,
    UserStats,
    UserActivity,
    UserSession
} from '../../../services/admin.service';
import { Select, SelectOption } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import {
    MagnifyingGlassIcon,
    PencilIcon,
    ShieldCheckIcon,
    DocumentTextIcon,
    XMarkIcon,
    UserPlusIcon,
    ArrowDownTrayIcon,
    EyeIcon,
    KeyIcon,
    CheckCircleIcon,
    XCircleIcon,
    TrashIcon,
    ClockIcon,
    Bars3Icon,
    FunnelIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';

export function ComprehensiveUserManagement() {
    // State Management
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [podFilter, setPodFilter] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    const [stats, setStats] = useState<UserStats | null>(null);
    const [pods, setPods] = useState<Array<{id: string; name: string}>>([]);

    // Modal States
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isCredModalOpen, setIsCredModalOpen] = useState(false);
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [isSessionsModalOpen, setIsSessionsModalOpen] = useState(false);
    const [isBulkActionsOpen, setIsBulkActionsOpen] = useState(false);
    const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

    // New User Form State
    const [newUserForm, setNewUserForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        role: 'caregiver',
        clinicalRole: '',
        sendWelcomeEmail: true
    });
    const [addingUser, setAddingUser] = useState(false);

    // Selected Data
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [editRole, setEditRole] = useState('');
    const [editClinicalRole, setEditClinicalRole] = useState('');
    const [userCredentials, setUserCredentials] = useState<Credential[]>([]);
    const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
    const [userSessions, setUserSessions] = useState<UserSession[]>([]);
    const [loadingCredentials, setLoadingCredentials] = useState(false);
    const [loadingActivities, setLoadingActivities] = useState(false);
    const [loadingSessions, setLoadingSessions] = useState(false);

    const fetchUsers = async () => {
        console.log('[ComprehensiveUserManagement] fetchUsers called');
        try {
            setLoading(true);
            setError('');
            console.log('[ComprehensiveUserManagement] Calling adminService.getUsers()');
            const data = await adminService.getUsers();
            console.log('[ComprehensiveUserManagement] Received users:', data?.length || 0);
            setUsers(data);
        } catch (err: any) {
            console.error('[ComprehensiveUserManagement] Failed to fetch users:', err);
            const errorMessage = err?.data?.message || err?.message || 'Failed to load users';
            setError(errorMessage);
        } finally {
            console.log('[ComprehensiveUserManagement] Setting loading to false');
            setLoading(false);
        }
    };

    // Fetch data on component mount
    useEffect(() => {
        console.log('[ComprehensiveUserManagement] Component mounted, fetching initial data');
        fetchUsers();
        fetchStats();
        fetchPods();
    }, []);

    // Apply filters when users or filter criteria change
    useEffect(() => {
        applyFilters();
    }, [users, search, roleFilter, statusFilter, podFilter]);

    const fetchStats = async () => {
        try {
            const response = await adminService.getUserStats();
            console.log('Stats response:', response);
            setStats(response.stats);
        } catch (err) {
            console.error('Failed to fetch stats:', err);
            // Set default stats on error
            setStats({
                activeUsers: 0,
                inactiveUsers: 0,
                suspendedUsers: 0,
                activeLastWeek: 0,
                activeLastMonth: 0,
                newThisMonth: 0,
                totalRoles: 0,
                roleDistribution: []
            });
        }
    };

    const fetchPods = async () => {
        try {
            // TODO: Replace with actual API call when implemented
            // const response = await adminService.getPods();
            // setPods(response);

            // For now, load from localStorage
            const PODS_STORAGE_KEY = 'serenity_pods';
            const storedPods = localStorage.getItem(PODS_STORAGE_KEY);
            const allPods = storedPods ? JSON.parse(storedPods) : [];
            setPods(allPods.map((p: any) => ({ id: p.id, name: p.name })));
        } catch (err) {
            console.error('Failed to fetch pods:', err);
            setPods([]);
        }
    };

    const applyFilters = () => {
        let filtered = users;

        if (search) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(user =>
                user.firstName.toLowerCase().includes(searchLower) ||
                user.lastName.toLowerCase().includes(searchLower) ||
                user.email.toLowerCase().includes(searchLower)
            );
        }

        if (roleFilter) {
            filtered = filtered.filter(user => user.role === roleFilter);
        }

        if (statusFilter) {
            filtered = filtered.filter(user => user.status === statusFilter);
        }

        if (podFilter) {
            filtered = filtered.filter(user => user.podId === podFilter);
        }

        setFilteredUsers(filtered);
    };

    // User Actions
    const handleEditClick = (user: User) => {
        setSelectedUser(user);
        setEditRole(user.role);
        setEditClinicalRole(user.clinicalRole || '');
        setIsEditModalOpen(true);
    };

    const handleSaveRole = async () => {
        if (!selectedUser) return;
        try {
            await adminService.updateUserRole(selectedUser.id, editRole, editClinicalRole || undefined);
            setIsEditModalOpen(false);
            fetchUsers();
        } catch (err) {
            console.error('Failed to update role', err);
            alert('Failed to update role');
        }
    };

    const handleResetPassword = async (user: User) => {
        if (!confirm(`Reset password for ${user.firstName} ${user.lastName}?`)) return;
        try {
            const response = await adminService.resetUserPassword(user.id, true);
            alert(response.message);
            fetchUsers();
        } catch (err: any) {
            alert(err?.message || 'Failed to reset password');
        }
    };

    const handleActivateUser = async (user: User) => {
        try {
            await adminService.activateUser(user.id);
            fetchUsers();
            fetchStats();
        } catch (err: any) {
            alert(err?.message || 'Failed to activate user');
        }
    };

    const handleDeactivateUser = async (user: User) => {
        const reason = prompt('Reason for deactivation (optional):');
        try {
            await adminService.deactivateUser(user.id, reason || undefined);
            fetchUsers();
            fetchStats();
        } catch (err: any) {
            alert(err?.message || 'Failed to deactivate user');
        }
    };

    const handleDeleteUser = async (user: User) => {
        if (!confirm(`Archive user ${user.firstName} ${user.lastName}? This action can be reversed.`)) return;
        try {
            await adminService.deleteUser(user.id);
            fetchUsers();
            fetchStats();
        } catch (err: any) {
            alert(err?.message || 'Failed to archive user');
        }
    };

    const handleViewDetails = (user: User) => {
        window.location.href = `/admin/users/${user.id}`;
    };

    const handleViewCredentials = async (user: User) => {
        setSelectedUser(user);
        setIsCredModalOpen(true);
        setLoadingCredentials(true);
        try {
            const data = await adminService.getCaregiverCredentials(user.id);
            setUserCredentials(data.credentials || []);
        } catch (err) {
            console.error('Failed to fetch credentials', err);
            setUserCredentials([]);
        } finally {
            setLoadingCredentials(false);
        }
    };

    const handleViewActivity = async (user: User) => {
        setSelectedUser(user);
        setIsActivityModalOpen(true);
        setLoadingActivities(true);
        try {
            const data = await adminService.getUserActivity(user.id);
            setUserActivities(data.activities || []);
        } catch (err) {
            console.error('Failed to fetch activities', err);
            setUserActivities([]);
        } finally {
            setLoadingActivities(false);
        }
    };

    const handleViewSessions = async (user: User) => {
        setSelectedUser(user);
        setIsSessionsModalOpen(true);
        setLoadingSessions(true);
        try {
            const data = await adminService.getUserSessions(user.id);
            setUserSessions(data.sessions || []);
        } catch (err) {
            console.error('Failed to fetch sessions', err);
            setUserSessions([]);
        } finally {
            setLoadingSessions(false);
        }
    };

    const handleTerminateSession = async (sessionId: string) => {
        if (!selectedUser) return;
        try {
            await adminService.terminateSession(selectedUser.id, sessionId);
            handleViewSessions(selectedUser); // Refresh
        } catch (err: any) {
            alert(err?.message || 'Failed to terminate session');
        }
    };

    const handleTerminateAllSessions = async () => {
        if (!selectedUser) return;
        if (!confirm('Terminate all sessions for this user?')) return;
        try {
            await adminService.terminateAllSessions(selectedUser.id);
            setIsSessionsModalOpen(false);
        } catch (err: any) {
            alert(err?.message || 'Failed to terminate sessions');
        }
    };

    // Bulk Actions
    const handleSelectUser = (userId: string) => {
        const newSelected = new Set(selectedUsers);
        if (newSelected.has(userId)) {
            newSelected.delete(userId);
        } else {
            newSelected.add(userId);
        }
        setSelectedUsers(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedUsers.size === filteredUsers.length) {
            setSelectedUsers(new Set());
        } else {
            setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
        }
    };

    const handleBulkUpdate = async (updates: Record<string, any>) => {
        if (selectedUsers.size === 0) {
            alert('No users selected');
            return;
        }

        try {
            const response = await adminService.bulkUpdateUsers(Array.from(selectedUsers), updates);
            alert(response.message);
            setSelectedUsers(new Set());
            fetchUsers();
            fetchStats();
        } catch (err: any) {
            alert(err?.message || 'Failed to update users');
        }
    };

    const handleExport = async () => {
        try {
            await adminService.exportUsers({
                role: roleFilter || undefined,
                status: statusFilter || undefined
            });
        } catch (err: any) {
            alert(err?.message || 'Failed to export users');
        }
    };

    const handleAddUser = async () => {
        if (!newUserForm.firstName || !newUserForm.lastName || !newUserForm.email) {
            alert('Please fill in all required fields');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newUserForm.email)) {
            alert('Please enter a valid email address');
            return;
        }

        setAddingUser(true);
        try {
            await adminService.createUser({
                firstName: newUserForm.firstName,
                lastName: newUserForm.lastName,
                email: newUserForm.email,
                role: newUserForm.role,
                clinicalRole: newUserForm.clinicalRole || undefined
            });

            // Reset form and close modal
            setNewUserForm({
                firstName: '',
                lastName: '',
                email: '',
                role: 'caregiver',
                clinicalRole: '',
                sendWelcomeEmail: true
            });
            setIsAddUserModalOpen(false);

            // Refresh user list
            fetchUsers();
            fetchStats();

            alert('User created successfully! A welcome email has been sent.');
        } catch (err: any) {
            console.error('Failed to create user:', err);
            alert(err?.data?.message || err?.message || 'Failed to create user');
        } finally {
            setAddingUser(false);
        }
    };

    // Helper functions
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
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header with Stats */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                        <p className="text-gray-500">Comprehensive user administration and control</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsStatsModalOpen(true)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                        >
                            <ChartBarIcon className="h-5 w-5" />
                            Statistics
                        </button>
                        <button
                            onClick={handleExport}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                            <ArrowDownTrayIcon className="h-5 w-5" />
                            Export CSV
                        </button>
                        <button
                            onClick={() => setIsAddUserModalOpen(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <UserPlusIcon className="h-5 w-5" />
                            Add User
                        </button>
                    </div>
                </div>

                {/* Quick Stats */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                            <div className="text-green-600 text-sm font-medium">Active Users</div>
                            <div className="text-2xl font-bold text-green-900">{stats.activeUsers}</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="text-gray-600 text-sm font-medium">Inactive Users</div>
                            <div className="text-2xl font-bold text-gray-900">{stats.inactiveUsers}</div>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <div className="text-blue-600 text-sm font-medium">Active This Week</div>
                            <div className="text-2xl font-bold text-blue-900">{stats.activeLastWeek}</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                            <div className="text-purple-600 text-sm font-medium">New This Month</div>
                            <div className="text-2xl font-bold text-purple-900">{stats.newThisMonth}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Filters and Bulk Actions */}
            <div className="bg-white rounded-lg shadow mb-6 p-4">
                <div className="flex flex-wrap gap-4 items-center mb-4">
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="pl-10 pr-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="w-48">
                        <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                            <SelectOption value="">All Roles</SelectOption>
                            <SelectOption value="admin">Admin</SelectOption>
                            <SelectOption value="ceo">CEO</SelectOption>
                            <SelectOption value="hr_manager">HR Manager</SelectOption>
                            <SelectOption value="caregiver">Caregiver</SelectOption>
                            <SelectOption value="rn_case_manager">RN Case Manager</SelectOption>
                            <SelectOption value="nurse">Nurse</SelectOption>
                        </Select>
                    </div>
                    <div className="w-48">
                        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <SelectOption value="">All Statuses</SelectOption>
                            <SelectOption value="active">Active</SelectOption>
                            <SelectOption value="inactive">Inactive</SelectOption>
                            <SelectOption value="suspended">Suspended</SelectOption>
                        </Select>
                    </div>
                    <div className="w-48">
                        <Select value={podFilter} onChange={(e) => setPodFilter(e.target.value)}>
                            <SelectOption value="">All Pods</SelectOption>
                            {pods.map(pod => (
                                <SelectOption key={pod.id} value={pod.id}>{pod.name}</SelectOption>
                            ))}
                        </Select>
                    </div>
                </div>

                {/* Bulk Actions Bar */}
                {selectedUsers.size > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
                        <div className="text-sm text-blue-900">
                            <strong>{selectedUsers.size}</strong> user(s) selected
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleBulkUpdate({ status: 'active' })}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                            >
                                Activate
                            </button>
                            <button
                                onClick={() => handleBulkUpdate({ status: 'inactive' })}
                                className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                            >
                                Deactivate
                            </button>
                            <button
                                onClick={() => setSelectedUsers(new Set())}
                                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                            >
                                Clear Selection
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* User Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading users...</div>
                ) : error ? (
                    <div className="p-8 text-center">
                        <div className="max-w-md mx-auto">
                            <div className="text-red-600 font-semibold mb-2">{error}</div>
                            <button
                                onClick={fetchUsers}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                            <span className="text-sm text-gray-700">
                                Showing <span data-testid="user-count" className="font-semibold">{filteredUsers.length}</span> users
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                        <table data-testid="user-table" className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                                            onChange={handleSelectAll}
                                            className="rounded border-gray-300"
                                        />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pod</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedUsers.has(user.id)}
                                                onChange={() => handleSelectUser(user.id)}
                                                className="rounded border-gray-300"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow">
                                                    {user.firstName[0]}{user.lastName[0]}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                                                    <div className="text-sm text-gray-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {user.role}
                                            </span>
                                            {user.clinicalRole && (
                                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                    {user.clinicalRole}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(user.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(user.lastLogin)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {user.podName || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    onClick={() => handleViewDetails(user)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                                    title="View Details"
                                                >
                                                    <EyeIcon className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleViewCredentials(user)}
                                                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                                                    title="Credentials"
                                                >
                                                    <DocumentTextIcon className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleViewActivity(user)}
                                                    className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded"
                                                    title="Activity Log"
                                                >
                                                    <ClockIcon className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditClick(user)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                                    title="Edit Role"
                                                >
                                                    <PencilIcon className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleResetPassword(user)}
                                                    className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded"
                                                    title="Reset Password"
                                                >
                                                    <KeyIcon className="h-4 w-4" />
                                                </button>
                                                {user.status === 'active' ? (
                                                    <button
                                                        onClick={() => handleDeactivateUser(user)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                        title="Deactivate"
                                                    >
                                                        <XCircleIcon className="h-4 w-4" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleActivateUser(user)}
                                                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                                                        title="Activate"
                                                    >
                                                        <CheckCircleIcon className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>

                        {/* No Results */}
                        {filteredUsers.length === 0 && (
                            <div className="p-8 text-center text-gray-500">
                                No users found matching your filters
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Edit Role Modal */}
            {isEditModalOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h2 className="text-lg font-semibold">Edit User Role</h2>
                            <button onClick={() => setIsEditModalOpen(false)}>
                                <XMarkIcon className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">System Role</label>
                                <Select value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                                    <SelectOption value="admin">IT Admin</SelectOption>
                                    <SelectOption value="hr_manager">HR Manager</SelectOption>
                                    <SelectOption value="caregiver">Caregiver</SelectOption>
                                    <SelectOption value="rn_case_manager">RN Case Manager</SelectOption>
                                    <SelectOption value="ceo">CEO</SelectOption>
                                    <SelectOption value="cfo">CFO</SelectOption>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Role (Optional)</label>
                                <input
                                    type="text"
                                    value={editClinicalRole}
                                    onChange={(e) => setEditClinicalRole(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., RN, LPN, PT"
                                />
                            </div>
                        </div>
                        <div className="p-4 border-t flex justify-end gap-2">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveRole}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Details Modal */}
            {isDetailModalOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h2 className="text-lg font-semibold">User Details</h2>
                            <button onClick={() => setIsDetailModalOpen(false)}>
                                <XMarkIcon className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="h-20 w-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                                    {selectedUser.firstName[0]}{selectedUser.lastName[0]}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{selectedUser.firstName} {selectedUser.lastName}</h3>
                                    <p className="text-gray-600">{selectedUser.email}</p>
                                    <div className="mt-1">{getStatusBadge(selectedUser.status)}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">User ID</label>
                                    <p className="text-sm text-gray-900 font-mono">{selectedUser.id}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Role</label>
                                    <p className="text-sm text-gray-900">{selectedUser.role}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Clinical Role</label>
                                    <p className="text-sm text-gray-900">{selectedUser.clinicalRole || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Pod</label>
                                    <p className="text-sm text-gray-900">{selectedUser.podName || 'Not assigned'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Last Login</label>
                                    <p className="text-sm text-gray-900">{formatDate(selectedUser.lastLogin)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Status</label>
                                    <p className="text-sm text-gray-900">{selectedUser.status}</p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleViewActivity(selectedUser)}
                                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                >
                                    View Activity Log
                                </button>
                                <button
                                    onClick={() => handleViewSessions(selectedUser)}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Manage Sessions
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Credentials Modal */}
            {isCredModalOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] overflow-y-auto">
                        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
                            <h2 className="text-lg font-semibold">Credentials - {selectedUser.firstName} {selectedUser.lastName}</h2>
                            <button onClick={() => setIsCredModalOpen(false)}>
                                <XMarkIcon className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                            </button>
                        </div>
                        <div className="p-6">
                            {loadingCredentials ? (
                                <div className="text-center py-8 text-gray-500">Loading credentials...</div>
                            ) : userCredentials.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">No credentials found</div>
                            ) : (
                                <div className="space-y-3">
                                    {userCredentials.map((cred) => (
                                        <div key={cred.id} className="p-4 border rounded-lg">
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
                </div>
            )}

            {/* Activity Log Modal */}
            {isActivityModalOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] overflow-y-auto">
                        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
                            <h2 className="text-lg font-semibold">Activity Log - {selectedUser.firstName} {selectedUser.lastName}</h2>
                            <button onClick={() => setIsActivityModalOpen(false)}>
                                <XMarkIcon className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                            </button>
                        </div>
                        <div className="p-6">
                            {loadingActivities ? (
                                <div className="text-center py-8 text-gray-500">Loading activities...</div>
                            ) : userActivities.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">No activity found</div>
                            ) : (
                                <div className="space-y-3">
                                    {userActivities.map((activity) => (
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
                </div>
            )}

            {/* Sessions Management Modal */}
            {isSessionsModalOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] overflow-y-auto">
                        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
                            <h2 className="text-lg font-semibold">Active Sessions - {selectedUser.firstName} {selectedUser.lastName}</h2>
                            <button onClick={() => setIsSessionsModalOpen(false)}>
                                <XMarkIcon className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                            </button>
                        </div>
                        <div className="p-6">
                            {loadingSessions ? (
                                <div className="text-center py-8 text-gray-500">Loading sessions...</div>
                            ) : userSessions.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">No active sessions</div>
                            ) : (
                                <>
                                    <div className="mb-4">
                                        <button
                                            onClick={handleTerminateAllSessions}
                                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                        >
                                            Terminate All Sessions
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {userSessions.map((session) => (
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
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Statistics Modal */}
            {isStatsModalOpen && stats && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-y-auto">
                        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
                            <h2 className="text-lg font-semibold">User Statistics</h2>
                            <button onClick={() => setIsStatsModalOpen(false)}>
                                <XMarkIcon className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                    <div className="text-green-600 text-sm font-medium">Active Users</div>
                                    <div className="text-3xl font-bold text-green-900">{stats.activeUsers}</div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <div className="text-gray-600 text-sm font-medium">Inactive Users</div>
                                    <div className="text-3xl font-bold text-gray-900">{stats.inactiveUsers}</div>
                                </div>
                                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                                    <div className="text-red-600 text-sm font-medium">Suspended Users</div>
                                    <div className="text-3xl font-bold text-red-900">{stats.suspendedUsers}</div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold mb-3">Role Distribution</h3>
                                <div className="space-y-2">
                                    {stats.roleDistribution.map((item) => (
                                        <div key={item.role} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <span className="font-medium text-gray-700">{item.role}</span>
                                            <span className="text-2xl font-bold text-gray-900">{item.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                    <div className="text-blue-600 text-sm font-medium">Active This Week</div>
                                    <div className="text-2xl font-bold text-blue-900">{stats.activeLastWeek}</div>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                                    <div className="text-purple-600 text-sm font-medium">New This Month</div>
                                    <div className="text-2xl font-bold text-purple-900">{stats.newThisMonth}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add User Modal */}
            {isAddUserModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h2 className="text-lg font-semibold">Add New User</h2>
                            <button onClick={() => setIsAddUserModalOpen(false)}>
                                <XMarkIcon className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        First Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        data-testid="add-user-first-name"
                                        value={newUserForm.firstName}
                                        onChange={(e) => setNewUserForm({ ...newUserForm, firstName: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="John"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Last Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        data-testid="add-user-last-name"
                                        value={newUserForm.lastName}
                                        onChange={(e) => setNewUserForm({ ...newUserForm, lastName: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    data-testid="add-user-email"
                                    value={newUserForm.email}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="john.doe@serenitycarepartners.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    System Role <span className="text-red-500">*</span>
                                </label>
                                <Select
                                    name="role"
                                    data-testid="add-user-role"
                                    value={newUserForm.role}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                                >
                                    <SelectOption value="">Select a role...</SelectOption>
                                    <SelectOption value="caregiver">Caregiver</SelectOption>
                                    <SelectOption value="pod_lead">Pod Lead</SelectOption>
                                    <SelectOption value="hr_manager">HR Manager</SelectOption>
                                    <SelectOption value="rn_case_manager">RN Case Manager</SelectOption>
                                    <SelectOption value="billing_manager">Billing Manager</SelectOption>
                                    <SelectOption value="scheduling_manager">Scheduling Manager</SelectOption>
                                    <SelectOption value="compliance_officer">Compliance Officer</SelectOption>
                                    <SelectOption value="admin">IT Admin</SelectOption>
                                    <SelectOption value="coo">COO</SelectOption>
                                    <SelectOption value="cfo">CFO</SelectOption>
                                    <SelectOption value="ceo">CEO</SelectOption>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Clinical Role (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={newUserForm.clinicalRole}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, clinicalRole: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., RN, LPN, HHA, STNA"
                                />
                            </div>
                            <div className="flex items-center gap-2 mt-4">
                                <input
                                    type="checkbox"
                                    id="sendWelcomeEmail"
                                    checked={newUserForm.sendWelcomeEmail}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, sendWelcomeEmail: e.target.checked })}
                                    className="rounded border-gray-300"
                                />
                                <label htmlFor="sendWelcomeEmail" className="text-sm text-gray-700">
                                    Send welcome email with login instructions
                                </label>
                            </div>
                        </div>
                        <div className="p-4 border-t flex justify-end gap-2">
                            <button
                                onClick={() => setIsAddUserModalOpen(false)}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                disabled={addingUser}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddUser}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                                disabled={addingUser}
                            >
                                {addingUser ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <UserPlusIcon className="h-4 w-4" />
                                        Create User
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
