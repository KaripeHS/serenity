/**
 * Authentication Context for Serenity ERP
 * Manages user authentication state and permissions
 * Now connected to real backend API
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, getAccessToken, clearTokens, ApiError } from '../services/api';

interface PodMembership {
  podId: string;
  podCode: string;
  podName: string;
  roleInPod: string;
  isPrimary: boolean;
  accessLevel: 'standard' | 'elevated' | 'emergency';
  expiresAt?: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: string;
  permissions: string[];
  podMemberships: PodMembership[];
  currentPodId?: string;
  avatar?: string;
  mfaEnabled: boolean;
  lastLogin?: Date;
  sessionId: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
  hasPermission: (permission: string) => boolean;
  hasPodAccess: (podId: string) => boolean;
  switchPod: (podId: string) => void;
  getCurrentPod: () => PodMembership | null;
  isFounder: () => boolean;
  canAccessAllPods: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Role-based default permissions
const ROLE_PERMISSIONS: Record<string, string[]> = {
  founder: [
    'view_all_dashboards',
    'manage_employees',
    'manage_patients',
    'view_financial_data',
    'manage_tax_compliance',
    'view_ai_analytics',
    'system_administration',
    'pod:create',
    'pod:read',
    'pod:update',
    'pod:delete',
    'pod:assign_users',
    'governance:jit_grant',
    'governance:break_glass',
    'governance:audit_export'
  ],
  admin: [
    'view_all_dashboards',
    'manage_employees',
    'manage_patients',
    'view_financial_data',
    'pod:read',
    'pod:update',
    'pod:assign_users'
  ],
  pod_lead: [
    'view_all_dashboards',
    'manage_employees',
    'manage_patients',
    'pod:read'
  ],
  caregiver: [
    'view_schedule',
    'clock_in_out',
    'view_patient_info'
  ],
  scheduler: [
    'view_all_dashboards',
    'manage_schedules',
    'pod:read'
  ]
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      setError(null);

      const token = getAccessToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch current user from API
        const response = await authApi.getCurrentUser();
        const apiUser = response.user;

        // Build full user object with permissions
        const fullUser: User = {
          id: apiUser.id,
          email: apiUser.email,
          firstName: apiUser.firstName,
          lastName: apiUser.lastName,
          role: apiUser.role,
          organizationId: apiUser.organizationId,
          permissions: apiUser.permissions || ROLE_PERMISSIONS[apiUser.role] || [],
          podMemberships: apiUser.podMemberships || [],
          currentPodId: apiUser.podMemberships?.[0]?.podId,
          mfaEnabled: false,
          lastLogin: new Date(),
          sessionId: `session_${Date.now()}`
        };

        setUser(fullUser);
      } catch (err) {
        console.error('Failed to restore session:', err);
        clearTokens();
        setError('Session expired. Please login again.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Call real login API
      const response = await authApi.login({ email, password });
      const apiUser = response.user;

      // Fetch full user data including pod memberships
      let podMemberships: PodMembership[] = [];
      try {
        const userDetails = await authApi.getCurrentUser();
        podMemberships = userDetails.user.podMemberships || [];
      } catch {
        // Fall back to empty pod memberships
      }

      // Build full user object
      const fullUser: User = {
        id: apiUser.id,
        email: apiUser.email,
        firstName: apiUser.firstName,
        lastName: apiUser.lastName,
        role: apiUser.role,
        organizationId: apiUser.organizationId,
        permissions: ROLE_PERMISSIONS[apiUser.role] || [],
        podMemberships,
        currentPodId: podMemberships[0]?.podId,
        mfaEnabled: false,
        lastLogin: new Date(),
        sessionId: `session_${Date.now()}`
      };

      setUser(fullUser);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError('Invalid email or password');
        } else {
          setError(err.data?.message || 'Login failed. Please try again.');
        }
      } else {
        setError('Network error. Please check your connection.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore errors on logout
    } finally {
      setUser(null);
      clearTokens();
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission) || user.role === 'founder';
  };

  const hasPodAccess = (podId: string): boolean => {
    if (!user) return false;
    if (user.role === 'founder') return true;
    return user.podMemberships.some(membership =>
      membership.podId === podId && (!membership.expiresAt || new Date(membership.expiresAt) > new Date())
    );
  };

  const switchPod = (podId: string) => {
    if (user && hasPodAccess(podId)) {
      setUser({ ...user, currentPodId: podId });
    }
  };

  const getCurrentPod = (): PodMembership | null => {
    if (!user || !user.currentPodId) return null;
    return user.podMemberships.find(membership => membership.podId === user.currentPodId) || null;
  };

  const isFounder = (): boolean => {
    return user?.role === 'founder';
  };

  const canAccessAllPods = (): boolean => {
    if (!user) return false;
    return ['founder', 'security_officer', 'compliance_officer', 'it_admin'].includes(user.role);
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
    error,
    hasPermission,
    hasPodAccess,
    switchPod,
    getCurrentPod,
    isFounder,
    canAccessAllPods
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
