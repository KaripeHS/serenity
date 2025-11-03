/**
 * Pod-Aware Context Hook
 * Provides pod-based data filtering and access control throughout the application
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { loggerService } from '../shared/services/logger.service';

// ============================================================================
// Types
// ============================================================================

export interface PodFilter {
  podIds: string[];
  includeAllPods: boolean;
}

export interface DataFilter {
  podFilter: PodFilter;
  userRole: string;
  permissions: string[];
  dataClassification: 'public' | 'internal' | 'confidential' | 'phi';
}

export interface PodContextState {
  currentPodId: string | null;
  availablePods: PodInfo[];
  podFilter: PodFilter;
  canAccessAllPods: boolean;
  isFounderAccess: boolean;
  dataFilter: DataFilter;
}

export interface PodInfo {
  id: string;
  code: string;
  name: string;
  city: string;
  state: string;
  isActive: boolean;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function usePodContext() {
  const { user, isFounder, canAccessAllPods, getCurrentPod, hasPodAccess } = useAuth();
  const [podContext, setPodContext] = useState<PodContextState>({
    currentPodId: null,
    availablePods: [],
    podFilter: { podIds: [], includeAllPods: false },
    canAccessAllPods: false,
    isFounderAccess: false,
    dataFilter: {
      podFilter: { podIds: [], includeAllPods: false },
      userRole: 'client',
      permissions: [],
      dataClassification: 'public'
    }
  });

  // Initialize pod context when user changes
  useEffect(() => {
    if (user) {
      loadPodContext();
    }
  }, [user]);

  const loadPodContext = async () => {
    try {
      // Get available pods for the user
      const availablePods = await getUserAvailablePods();

      // Determine current pod
      const currentPod = getCurrentPod();
      const currentPodId = currentPod?.podId || availablePods[0]?.id || null;

      // Set up pod filter
      const canAccessAll = canAccessAllPods();
      const isFounderUser = isFounder();

      const podFilter: PodFilter = {
        podIds: canAccessAll ? availablePods.map(p => p.id) : (currentPodId ? [currentPodId] : []),
        includeAllPods: canAccessAll
      };

      // Create data filter
      const dataFilter: DataFilter = {
        podFilter,
        userRole: user?.role || 'guest',
        permissions: user?.permissions || [],
        dataClassification: user ? determinDataClassification(user.role, user.permissions) : 'public'
      };

      setPodContext({
        currentPodId,
        availablePods,
        podFilter,
        canAccessAllPods: canAccessAll,
        isFounderAccess: isFounderUser,
        dataFilter
      });

    } catch (error) {
      loggerService.error('Failed to load pod context:', error);
    }
  };

  const getUserAvailablePods = async (): Promise<PodInfo[]> => {
    // In a real implementation, this would call the API
    // For now, return production data based on user pod memberships

    if (!user) return [];

    // If user can access all pods, return all pods
    if (canAccessAllPods()) {
      return [
        {
          id: 'pod-cin-a-001',
          code: 'CIN-A',
          name: 'Cincinnati Pod A',
          city: 'Cincinnati',
          state: 'OH',
          isActive: true
        },
        {
          id: 'pod-cin-b-001',
          code: 'CIN-B',
          name: 'Cincinnati Pod B',
          city: 'Cincinnati',
          state: 'OH',
          isActive: true
        },
        {
          id: 'pod-col-a-001',
          code: 'COL-A',
          name: 'Columbus Pod A',
          city: 'Columbus',
          state: 'OH',
          isActive: true
        }
      ];
    }

    // Return only pods the user has membership in
    return user.podMemberships.map(membership => ({
      id: membership.podId,
      code: membership.podCode,
      name: membership.podName,
      city: membership.podName.split(' ')[0], // Extract city from name
      state: 'OH',
      isActive: true
    }));
  };

  const determinDataClassification = (role: string, permissions: string[]): 'public' | 'internal' | 'confidential' | 'phi' => {
    if (permissions.includes('client:phi_access')) {
      return 'phi';
    }
    if (['founder', 'compliance_officer', 'security_officer'].includes(role)) {
      return 'confidential';
    }
    if (['finance_director', 'billing_manager', 'hr_manager'].includes(role)) {
      return 'confidential';
    }
    return 'internal';
  };

  // Filter data based on pod access
  const filterDataByPod = useCallback(<T extends { podId?: string }>(
    data: T[],
    options?: {
      allowNullPodId?: boolean;
      additionalFilter?: (item: T) => boolean;
    }
  ): T[] => {
    if (!user || !data) return [];

    const { allowNullPodId = false, additionalFilter } = options || {};

    let filtered = data.filter(item => {
      // Allow items without podId if specified
      if (!item.podId && allowNullPodId) return true;

      // If user can access all pods, include all items
      if (podContext.canAccessAllPods) return true;

      // Check if user has access to this item's pod
      return item.podId && podContext.podFilter.podIds.includes(item.podId);
    });

    // Apply additional filter if provided
    if (additionalFilter) {
      filtered = filtered.filter(additionalFilter);
    }

    return filtered;
  }, [user, podContext]);

  // Filter PHI data with additional access checks
  const filterPHIData = useCallback(<T extends { podId?: string; dataClassification?: string }>(
    data: T[]
  ): T[] => {
    if (!user) return [];

    // Check if user has PHI access permission
    const hasPHIAccess = user.permissions.includes('client:phi_access') ||
                        ['founder', 'compliance_officer'].includes(user.role);

    if (!hasPHIAccess) {
      // Return only non-PHI data
      return filterDataByPod(
        data.filter(item => item.dataClassification !== 'phi'),
        { allowNullPodId: true }
      );
    }

    // User has PHI access, apply normal pod filtering
    return filterDataByPod(data);
  }, [user, filterDataByPod]);

  // Switch pod context
  const switchToPod = useCallback((podId: string) => {
    if (!hasPodAccess(podId)) {
      throw new Error(`User does not have access to pod ${podId}`);
    }

    setPodContext(prev => ({
      ...prev,
      currentPodId: podId,
      podFilter: {
        ...prev.podFilter,
        podIds: prev.canAccessAllPods
          ? prev.availablePods.map(p => p.id)
          : [podId]
      }
    }));
  }, [hasPodAccess]);

  // Get pod-specific API headers
  const getPodHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      'X-User-Role': user?.role || '',
      'X-Organization-Id': user?.organizationId || '',
      'X-Session-Id': user?.sessionId || ''
    };

    if (podContext.currentPodId) {
      headers['X-Current-Pod-Id'] = podContext.currentPodId;
    }

    if (podContext.canAccessAllPods) {
      headers['X-Pod-Access'] = 'all';
    } else {
      headers['X-Pod-Access'] = podContext.podFilter.podIds.join(',');
    }

    headers['X-Data-Classification'] = podContext.dataFilter.dataClassification;

    return headers;
  }, [user, podContext]);

  // Build SQL-like query filters for API calls
  const buildQueryFilter = useCallback((additionalFilters?: Record<string, any>) => {
    const filters: Record<string, any> = {
      ...additionalFilters
    };

    // Add pod filter
    if (!podContext.canAccessAllPods && podContext.podFilter.podIds.length > 0) {
      filters.podId = podContext.podFilter.podIds.length === 1
        ? podContext.podFilter.podIds[0]
        : { $in: podContext.podFilter.podIds };
    }

    // Add organization filter
    if (user?.organizationId) {
      filters.organizationId = user.organizationId;
    }

    return filters;
  }, [user, podContext]);

  // Check if current user can perform action on specific pod
  const canPerformAction = useCallback((action: string, targetPodId?: string) => {
    if (!user) return false;

    // Check permission
    if (!user.permissions.includes(action)) {
      return false;
    }

    // If no specific pod, check general access
    if (!targetPodId) {
      return true;
    }

    // Check pod access
    return hasPodAccess(targetPodId);
  }, [user, hasPodAccess]);

  // Get user's role within a specific pod
  const getRoleInPod = useCallback((podId: string) => {
    if (!user) return null;

    const membership = user.podMemberships.find(m => m.podId === podId);
    return membership?.roleInPod || null;
  }, [user]);

  // Check if user is primary in any pod
  const isPrimaryInAnyPod = useCallback(() => {
    if (!user) return false;
    return user.podMemberships.some(m => m.isPrimary);
  }, [user]);

  return {
    // State
    podContext,

    // Actions
    switchToPod,
    refreshPodContext: loadPodContext,

    // Filters
    filterDataByPod,
    filterPHIData,
    buildQueryFilter,

    // Utilities
    getPodHeaders,
    canPerformAction,
    getRoleInPod,
    isPrimaryInAnyPod,

    // Getters
    getCurrentPodInfo: () => podContext.availablePods.find(p => p.id === podContext.currentPodId),
    getAvailablePodIds: () => podContext.podFilter.podIds,
    hasMultiplePodAccess: () => podContext.availablePods.length > 1,

    // Validation
    validatePodAccess: (podId: string) => hasPodAccess(podId),
    requiresPHIAccess: (data: any) => data?.dataClassification === 'phi'
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Higher-order component for pod-aware data fetching
 */
export function withPodContext<T>(
  _fetchFunction: (filters: Record<string, any>, headers: Record<string, string>) => Promise<T>
) {
  return async (_additionalFilters?: Record<string, any>): Promise<T> => {
    // This would be used in a component with the hook
    throw new Error('withPodContext must be used within a component with usePodContext hook');
  };
}

/**
 * Format pod information for display
 */
export function formatPodDisplay(pod: PodInfo): string {
  return `${pod.code} - ${pod.name}`;
}

/**
 * Check if data requires PHI redaction
 */
export function requiresPHIRedaction(
  dataClassification: string,
  userPermissions: string[]
): boolean {
  return dataClassification === 'phi' && !userPermissions.includes('client:phi_access');
}

/**
 * Generate audit log entry for pod access
 */
export function createPodAccessAuditEntry(
  userId: string,
  podId: string,
  action: string,
  resourceType: string,
  resourceId?: string
) {
  return {
    userId,
    podId,
    action,
    resourceType,
    resourceId,
    timestamp: new Date(),
    dataClassification: 'internal' as const
  };
}