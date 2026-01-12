/**
 * Executive Dashboard Hooks
 * React Query hooks for fetching executive dashboard data
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  ExecutiveOverview,
  ExecutiveFinancial,
  ExecutiveOperations,
  ExecutiveWorkforce,
  ExecutiveCompliance,
  ExecutiveAlertsResponse,
  ExecutiveTrendsResponse,
} from '@/types/executive';

/**
 * Fetch executive overview (main KPIs)
 */
export function useExecutiveOverview() {
  return useQuery({
    queryKey: ['executive', 'overview'],
    queryFn: () => api.get<ExecutiveOverview>('/console/executive/overview'),
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  });
}

/**
 * Fetch executive alerts
 */
export function useExecutiveAlerts() {
  return useQuery({
    queryKey: ['executive', 'alerts'],
    queryFn: () => api.get<ExecutiveAlertsResponse>('/console/executive/alerts'),
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 15000,
  });
}

/**
 * Fetch financial metrics
 */
export function useExecutiveFinancial() {
  return useQuery({
    queryKey: ['executive', 'financial'],
    queryFn: () => api.get<ExecutiveFinancial>('/console/executive/financial'),
    refetchInterval: 300000, // Refresh every 5 minutes
    staleTime: 60000,
  });
}

/**
 * Fetch operations metrics
 */
export function useExecutiveOperations() {
  return useQuery({
    queryKey: ['executive', 'operations'],
    queryFn: () => api.get<ExecutiveOperations>('/console/executive/operations'),
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000,
  });
}

/**
 * Fetch workforce metrics
 */
export function useExecutiveWorkforce() {
  return useQuery({
    queryKey: ['executive', 'workforce'],
    queryFn: () => api.get<ExecutiveWorkforce>('/console/executive/workforce'),
    refetchInterval: 300000, // Refresh every 5 minutes
    staleTime: 60000,
  });
}

/**
 * Fetch compliance metrics
 */
export function useExecutiveCompliance() {
  return useQuery({
    queryKey: ['executive', 'compliance'],
    queryFn: () => api.get<ExecutiveCompliance>('/console/executive/compliance'),
    refetchInterval: 300000, // Refresh every 5 minutes
    staleTime: 60000,
  });
}

/**
 * Fetch trend data for charts
 */
export function useExecutiveTrends(type: 'revenue' | 'visits' | 'evv' | 'census' | 'turnover') {
  return useQuery({
    queryKey: ['executive', 'trends', type],
    queryFn: () => api.get<ExecutiveTrendsResponse>(`/console/executive/trends/${type}`),
    refetchInterval: 300000, // Refresh every 5 minutes
    staleTime: 120000,
  });
}

/**
 * Combined hook for overview tab data
 */
export function useOverviewTabData() {
  const overview = useExecutiveOverview();
  const alerts = useExecutiveAlerts();
  const revenueTrend = useExecutiveTrends('revenue');
  const visitsTrend = useExecutiveTrends('visits');
  const evvTrend = useExecutiveTrends('evv');

  return {
    overview,
    alerts,
    revenueTrend,
    visitsTrend,
    evvTrend,
    isLoading: overview.isLoading || alerts.isLoading,
    isError: overview.isError || alerts.isError,
  };
}
