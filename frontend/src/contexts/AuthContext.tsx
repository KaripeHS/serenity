/**
 * Authentication Context for Serenity ERP
 * Manages user authentication state and permissions
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface PodMembership {
  podId: string;
  podCode: string;
  podName: string;
  roleInPod: string;
  isPrimary: boolean;
  accessLevel: 'standard' | 'elevated' | 'emergency';
  expiresAt?: Date;
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

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize with demo user for preview
    const initializeAuth = async () => {
      setIsLoading(true);

      // Simulate loading time
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Set demo user with pod memberships
      const demoUser: User = {
        id: 'founder-001',
        email: 'sarah.johnson@serenitycare.com',
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'founder',
        organizationId: 'serenity-care-partners',
        permissions: [
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
        podMemberships: [
          {
            podId: 'pod-cin-a-001',
            podCode: 'CIN-A',
            podName: 'Cincinnati Pod A',
            roleInPod: 'owner',
            isPrimary: true,
            accessLevel: 'elevated'
          },
          {
            podId: 'pod-cin-b-001',
            podCode: 'CIN-B',
            podName: 'Cincinnati Pod B',
            roleInPod: 'owner',
            isPrimary: false,
            accessLevel: 'elevated'
          },
          {
            podId: 'pod-col-a-001',
            podCode: 'COL-A',
            podName: 'Columbus Pod A',
            roleInPod: 'owner',
            isPrimary: false,
            accessLevel: 'elevated'
          }
        ],
        currentPodId: 'pod-cin-a-001',
        mfaEnabled: true,
        lastLogin: new Date(),
        sessionId: `session_${Date.now()}`
      };

      setUser(demoUser);
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, _password: string) => {
    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // For demo purposes, accept any credentials
    const demoUser: User = {
      id: 'founder-001',
      email: email,
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'founder',
      organizationId: 'serenity-care-partners',
      permissions: [
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
      podMemberships: [
        {
          podId: 'pod-cin-a-001',
          podCode: 'CIN-A',
          podName: 'Cincinnati Pod A',
          roleInPod: 'owner',
          isPrimary: true,
          accessLevel: 'elevated'
        },
        {
          podId: 'pod-cin-b-001',
          podCode: 'CIN-B',
          podName: 'Cincinnati Pod B',
          roleInPod: 'owner',
          isPrimary: false,
          accessLevel: 'elevated'
        },
        {
          podId: 'pod-col-a-001',
          podCode: 'COL-A',
          podName: 'Columbus Pod A',
          roleInPod: 'owner',
          isPrimary: false,
          accessLevel: 'elevated'
        }
      ],
      currentPodId: 'pod-cin-a-001',
      mfaEnabled: true,
      lastLogin: new Date(),
      sessionId: `session_${Date.now()}`
    };

    setUser(demoUser);
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission) || user.role === 'founder';
  };

  const hasPodAccess = (podId: string): boolean => {
    if (!user) return false;
    if (user.role === 'founder') return true;
    return user.podMemberships.some(membership =>
      membership.podId === podId && (!membership.expiresAt || membership.expiresAt > new Date())
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