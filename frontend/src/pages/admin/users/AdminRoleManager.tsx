import React, { useState, useEffect } from 'react';
import { adminService, User, Credential } from '../../../services/admin.service';

import { Select, SelectOption } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { MagnifyingGlassIcon, PencilIcon, ShieldCheckIcon, DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline';

export function AdminRoleManager() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    // Role Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [editRole, setEditRole] = useState('');
    const [editClinicalRole, setEditClinicalRole] = useState('');

    // Credentials View Modal State
    const [isCredModalOpen, setIsCredModalOpen] = useState(false);
    const [userCredentials, setUserCredentials] = useState<Credential[]>([]);
    const [loadingCredentials, setLoadingCredentials] = useState(false);

    // Add User Modal State
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [creatingUser, setCreatingUser] = useState(false);
    const [reuseMessage, setReuseMessage] = useState<string | null>(null);
    const [newUserForm, setNewUserForm] = useState({
        email: '',
        firstName: '',
        lastName: '',
        role: 'caregiver',
        organizationId: 'org-1', // Default or get from context
        patientId: ''
    });

    const handleCreateUser = async () => {
        setCreatingUser(true);
        setReuseMessage(null);
        try {
            // Get current user org ID if possible, for now hardcode or use context
            // Assuming the admin creating the user is in the same org
            // In a real app we'd use a Context hook for auth state
            const response: any = await adminService.createUser({
                ...newUserForm,
                organizationId: 'c1b1860a-0c22-4416-8c54-712395d8516d' // Replace with dynamic Org ID from auth context
            });

            if (response.reuseSource && response.reuseSource !== 'manual') {
                setReuseMessage(`User created & linked! Reused data from: ${response.reuseSource}`);
                // Keep modal open briefly to show success? Or close and toast?
                // Let's just alert and close for MVP
                alert(`User created! Reused data from: ${response.reuseSource}\nTemp Password: ${response.tempPassword}`);
                setIsAddUserModalOpen(false);
                fetchUsers();
            } else {
                alert(`User created successfully!\nTemp Password: ${response.tempPassword}`);
                setIsAddUserModalOpen(false);
                fetchUsers();
            }
        } catch (err: any) {
            console.error('Create failed', err);
            alert(err.message || 'Failed to create user');
        } finally {
            setCreatingUser(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [roleFilter, search]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(''); // Clear previous errors
            const data = await adminService.getUsers({
                role: roleFilter || undefined,
                search: search || undefined
            });
            setUsers(data);
        } catch (err: any) {
            console.error('Failed to fetch users:', err);
            // Extract detailed error message
            const errorMessage = err?.data?.message || err?.message || 'Failed to load users';
            const statusCode = err?.status;

            if (statusCode === 401) {
                setError('Authentication required. Please log in again.');
            } else if (statusCode === 403) {
                setError('Access denied. You do not have permission to view users.');
            } else {
                setError(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

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
            fetchUsers(); // Refresh list
        } catch (err) {
            console.error('Failed to update role', err);
            alert('Failed to update role');
        }
    };

    const handleViewCredentials = async (user: User) => {
        setSelectedUser(user);
        setIsCredModalOpen(true);
        setLoadingCredentials(true);
        try {
            const data = await adminService.getCaregiverCredentials(user.id);
            setUserCredentials(data.credentials || []); // Ensure array
        } catch (err) {
            console.error('Failed to fetch credentials', err);
            setUserCredentials([]);
        } finally {
            setLoadingCredentials(false);
        }
    };

    // Helper to get badge variant
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return <Badge variant="success">Active</Badge>;
            case 'inactive': return <Badge variant="danger">Inactive</Badge>;
            default: return <Badge variant="default">{status}</Badge>;
        }
    };

    return (
        <>

            <div className="p-6 max-w-7xl mx-auto">
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                        <p className="text-gray-500">Manage system access, roles, and clinical permissions</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsAddUserModalOpen(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Add New User
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow mb-6 p-4 flex gap-4 items-center">
                    <div className="relative flex-1 max-w-sm">
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
                            <SelectOption value="caregiver">Caregiver</SelectOption>
                            <SelectOption value="rn_case_manager">RN Case Manager</SelectOption>
                            <SelectOption value="lpn_lvn">LPN/LVN</SelectOption>
                            <SelectOption value="therapist">Therapist</SelectOption>
                            <SelectOption value="dsp_med">DSP Med</SelectOption>
                            <SelectOption value="dsp_basic">DSP Basic</SelectOption>
                        </Select>
                    </div>
                </div>

                {/* User Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading users...</div>
                    ) : error ? (
                        <div className="p-8 text-center">
                            <div className="max-w-md mx-auto">
                                <div className="text-red-600 font-semibold mb-2">{error}</div>
                                <p className="text-gray-600 text-sm mb-4">
                                    There was a problem loading users. This might be due to an authentication issue.
                                </p>
                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={fetchUsers}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Try Again
                                    </button>
                                    <button
                                        onClick={() => window.location.href = '/'}
                                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                    >
                                        Back to Home
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clinical Level</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pod</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold">
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
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {user.clinicalRole || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(user.isActive ? 'active' : 'inactive')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {user.podName || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleViewCredentials(user)}
                                                    className="text-gray-400 hover:text-blue-600"
                                                    title="View Credentials"
                                                >
                                                    <DocumentTextIcon className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditClick(user)}
                                                    className="text-gray-400 hover:text-blue-600"
                                                    title="Edit Role"
                                                >
                                                    <PencilIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Edit Role Modal */}
            {
                isEditModalOpen && selectedUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
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
                                        <SelectOption value="caregiver">Caregiver / Field Staff</SelectOption>
                                        <SelectOption value="scheduler">Scheduler</SelectOption>
                                        <SelectOption value="family">Family Portal</SelectOption>
                                    </Select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Role (Optional)</label>
                                    <Select value={editClinicalRole} onChange={(e) => setEditClinicalRole(e.target.value)}>
                                        <SelectOption value="">None</SelectOption>
                                        <SelectOption value="RN">RN Case Manager</SelectOption>
                                        <SelectOption value="LPN">LPN / LVN</SelectOption>
                                        <SelectOption value="Therapist">Therapist (PT/OT/ST)</SelectOption>
                                        <SelectOption value="DSP_Med">DSP (Med Admin)</SelectOption>
                                    </Select>
                                    <p className="text-xs text-gray-500 mt-1">Assigning a clinical role grants access to specific clinical data like MAR/TAR.</p>
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 border-t flex justify-end gap-2">
                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveRole}
                                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Add User Modal */}
            {
                isAddUserModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="p-4 border-b flex justify-between items-center">
                                <h2 className="text-lg font-semibold">Add New User</h2>
                                <button onClick={() => setIsAddUserModalOpen(false)}>
                                    <XMarkIcon className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                {reuseMessage && (
                                    <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm mb-4">
                                        {reuseMessage}
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                    <input
                                        type="email"
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                        value={newUserForm.email}
                                        onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                                        <input
                                            type="text"
                                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                            value={newUserForm.firstName}
                                            onChange={e => setNewUserForm({ ...newUserForm, firstName: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                                        <input
                                            type="text"
                                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                            value={newUserForm.lastName}
                                            onChange={e => setNewUserForm({ ...newUserForm, lastName: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                                    <Select value={newUserForm.role} onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value })}>
                                        <SelectOption value="caregiver">Caregiver</SelectOption>
                                        <SelectOption value="rn_case_manager">RN Case Manager</SelectOption>
                                        <SelectOption value="scheduler">Scheduler</SelectOption>
                                        <SelectOption value="hr_manager">HR Manager</SelectOption>
                                        <SelectOption value="client">Client (Patient)</SelectOption>
                                        <SelectOption value="family">Family Member</SelectOption>
                                    </Select>
                                </div>
                                {newUserForm.role === 'client' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Link to Patient (Optional ID)</label>
                                        <input
                                            type="text"
                                            placeholder="UUID of Patient Record"
                                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                            value={newUserForm.patientId || ''}
                                            onChange={e => setNewUserForm({ ...newUserForm, patientId: e.target.value })}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">If empty, will attempt to match by Name/DOB.</p>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 bg-gray-50 border-t flex justify-end gap-2">
                                <button
                                    onClick={() => setIsAddUserModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateUser}
                                    disabled={creatingUser}
                                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg disabled:opacity-50"
                                >
                                    {creatingUser ? 'Creating...' : 'Create User'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Credentials Modal */}
            {
                isCredModalOpen && selectedUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                                <div>
                                    <h2 className="text-lg font-semibold">Credentials & Licenses</h2>
                                    <p className="text-sm text-gray-500">{selectedUser.firstName} {selectedUser.lastName}</p>
                                </div>
                                <button onClick={() => setIsCredModalOpen(false)}>
                                    <XMarkIcon className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                                </button>
                            </div>
                            <div className="p-6 max-h-[60vh] overflow-y-auto">
                                {loadingCredentials ? (
                                    <div className="text-center py-8 text-gray-500">Loading credentials...</div>
                                ) : userCredentials.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                                        No credentials found for this user.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {userCredentials.map((cred) => {
                                            const daysLeft = cred.daysLeft || 0;
                                            const isExpired = daysLeft < 0;
                                            const isExpiringSoon = daysLeft < 30 && !isExpired;

                                            return (
                                                <div key={cred.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                                    <div className="flex items-start gap-3">
                                                        <div className={`p-2 rounded-lg ${isExpired ? 'bg-red-100' : isExpiringSoon ? 'bg-yellow-100' : 'bg-green-100'}`}>
                                                            <ShieldCheckIcon className={`h-5 w-5 ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : 'text-green-600'}`} />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-medium text-gray-900">{cred.type || cred.credential_type}</h4>
                                                            <p className="text-sm text-gray-500">#{cred.number || cred.credential_number || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className={`text-sm font-medium ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : 'text-green-600'}`}>
                                                            {isExpired ? 'Expired' : 'Active'}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            Expires: {new Date(cred.expirationDate).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            <div className="p-4 border-t flex justify-end">
                                <button
                                    onClick={() => setIsCredModalOpen(false)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

        </>
    );
}
