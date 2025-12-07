
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
    }
};
