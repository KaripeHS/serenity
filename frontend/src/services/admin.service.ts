
import { request } from './api';

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    clinicalRole?: string;
    status: string;
    isActive: boolean;
    lastLogin?: string;
    podId?: string;
    podName?: string;
    organizationId?: string;
    patientId?: string;
}

export interface Credential {
    id: string;
    type: string;
    credential_type?: string;
    credential_number?: string;
    number?: string;
    issueDate?: string;
    expirationDate: string;
    status: string;
    daysLeft?: number;
    daysExpired?: number;
    documentUrl?: string;
    verificationStatus?: string;
}

export interface CredentialSummary {
    expired: number;
    expiring_7_days: number;
    expiring_15_days: number;
    expiring_30_days: number;
    total_active: number;
}

const buildQuery = (params: Record<string, any>) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, String(value));
        }
    });
    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
};

export interface UserStats {
    activeUsers: number;
    inactiveUsers: number;
    suspendedUsers: number;
    activeLastWeek: number;
    activeLastMonth: number;
    newThisMonth: number;
    totalRoles: number;
    roleDistribution: Array<{ role: string; count: string }>;
}

export interface UserActivity {
    id: string;
    action: string;
    resourceType: string;
    details: string;
    ipAddress: string;
    createdAt: string;
}

export interface UserSession {
    id: string;
    ipAddress: string;
    userAgent: string;
    lastActivity: string;
    createdAt: string;
}

export const adminService = {
    // User Management
    getUsers: async (params?: { role?: string; search?: string; podId?: string }) => {
        return request<User[]>(`/api/console/admin/users${buildQuery(params || {})}`);
    },

    updateUserRole: async (userId: string, role: string, clinicalRole?: string) => {
        return request<{ success: true; user: User }>(`/api/console/admin/users/${userId}/role`, {
            method: 'PUT',
            body: JSON.stringify({ role, clinicalRole })
        });
    },

    updateUserStatus: async (userId: string, isActive: boolean) => {
        return request<{ success: true; user: User }>(`/api/console/admin/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify({ isActive })
        });
    },

    createUser: async (data: Partial<User>) => {
        return request<User>('/api/console/admin/users', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    // Credential Management
    getExpiringCredentials: async (days: number = 30) => {
        return request<{ success: true; credentials: Credential[] }>(`/api/console/credentials/expiring${buildQuery({ days })}`);
    },

    getExpiredCredentials: async () => {
        return request<{ success: true; credentials: Credential[] }>('/api/console/credentials/expired');
    },

    getCredentialSummary: async () => {
        return request<{ success: true; summary: CredentialSummary }>('/api/console/credentials/summary');
    },

    getCaregiverCredentials: async (caregiverId: string) => {
        return request<{ success: true; credentials: Credential[] }>(`/api/console/credentials/caregiver/${caregiverId}`);
    },

    updateCredential: async (credentialId: string, data: { expirationDate?: string; number?: string; status?: string }) => {
        return request<{ success: true; credential: Credential }>(`/api/console/credentials/${credentialId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    // Comprehensive User Management
    resetUserPassword: async (userId: string, sendEmail: boolean = true) => {
        return request<{ success: true; message: string; tempPassword?: string }>(`/api/console/admin/users/${userId}/reset-password`, {
            method: 'POST',
            body: JSON.stringify({ sendEmail })
        });
    },

    activateUser: async (userId: string) => {
        return request<{ success: true; user: User }>(`/api/console/admin/users/${userId}/activate`, {
            method: 'POST'
        });
    },

    deactivateUser: async (userId: string, reason?: string) => {
        return request<{ success: true; user: User }>(`/api/console/admin/users/${userId}/deactivate`, {
            method: 'POST',
            body: JSON.stringify({ reason })
        });
    },

    deleteUser: async (userId: string) => {
        return request<{ success: true; message: string }>(`/api/console/admin/users/${userId}`, {
            method: 'DELETE'
        });
    },

    getUserActivity: async (userId: string, limit: number = 50, offset: number = 0) => {
        return request<{ success: true; activities: UserActivity[] }>(`/api/console/admin/users/${userId}/activity${buildQuery({ limit, offset })}`);
    },

    getUserSessions: async (userId: string) => {
        return request<{ success: true; sessions: UserSession[] }>(`/api/console/admin/users/${userId}/sessions`);
    },

    terminateSession: async (userId: string, sessionId: string) => {
        return request<{ success: true; message: string }>(`/api/console/admin/users/${userId}/sessions/${sessionId}`, {
            method: 'DELETE'
        });
    },

    terminateAllSessions: async (userId: string) => {
        return request<{ success: true; message: string }>(`/api/console/admin/users/${userId}/sessions/terminate-all`, {
            method: 'POST'
        });
    },

    bulkUpdateUsers: async (userIds: string[], updates: Record<string, any>) => {
        return request<{ success: true; message: string; updatedCount: number }>(`/api/console/admin/users/bulk-update`, {
            method: 'POST',
            body: JSON.stringify({ userIds, updates })
        });
    },

    exportUsers: async (params?: { role?: string; status?: string; podId?: string }) => {
        const API_BASE_URL = import.meta.env.VITE_API_URL || '';
        const token = localStorage.getItem('serenity_access_token');

        const response = await fetch(`${API_BASE_URL}/api/console/admin/users/export${buildQuery(params || {})}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'text/csv'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to export users');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    },

    getUserStats: async () => {
        return request<{ success: true; stats: UserStats }>(`/api/console/admin/users/stats`);
    }
};
