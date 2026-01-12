export const MOCK_USERS = {
    founder: {
        id: 'user-founder-123',
        email: 'founder@serenitycarepartners.com',
        firstName: 'Founder',
        lastName: 'User',
        role: 'founder',
        organizationId: 'org-123',
        status: 'active',
        permissions: ['system_administration', 'view_all_dashboards'],
        podMemberships: []
    },
    admin: {
        id: 'user-admin-123',
        email: 'admin@serenitycarepartners.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        organizationId: 'org-123',
        status: 'active',
        permissions: ['view_all_dashboards', 'manage_employees'],
        podMemberships: []
    },
    caregiver: {
        id: 'user-caregiver-123',
        email: 'maria.garcia@serenitycarepartners.com',
        firstName: 'Maria',
        lastName: 'Garcia',
        role: 'caregiver',
        organizationId: 'org-123',
        status: 'active',
        permissions: ['view_schedule'],
        podMemberships: []
    },
    podLead: {
        id: 'user-podlead-123',
        email: 'podlead@serenitycarepartners.com',
        firstName: 'Pod',
        lastName: 'Lead',
        role: 'pod_lead',
        organizationId: 'org-123',
        status: 'active',
        permissions: ['pod:read', 'view_all_dashboards'],
        podMemberships: [{
            podId: 'pod-123',
            podCode: 'POD-1',
            podName: 'Test Pod',
            roleInPod: 'pod_lead',
            isPrimary: true,
            accessLevel: 'standard'
        }]
    }
};

export const MOCK_LOGIN_RESPONSE = (userKey: keyof typeof MOCK_USERS) => ({
    accessToken: 'mock-access-token-' + userKey,
    refreshToken: 'mock-refresh-token-' + userKey,
    expiresIn: 3600,
    user: MOCK_USERS[userKey]
});

export const MOCK_ME_RESPONSE = (userKey: keyof typeof MOCK_USERS) => ({
    user: MOCK_USERS[userKey]
});
