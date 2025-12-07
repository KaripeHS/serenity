/**
 * API Client for Serenity ERP
 * Handles all HTTP communication with the backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Token storage keys
const ACCESS_TOKEN_KEY = 'serenity_access_token';
const REFRESH_TOKEN_KEY = 'serenity_refresh_token';

/**
 * Get stored tokens
 */
export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Store tokens
 */
export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

/**
 * Clear tokens (logout)
 */
export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * API Error class
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: any
  ) {
    super(`API Error: ${status} ${statusText}`);
    this.name = 'ApiError';
  }
}

/**
 * Make authenticated API request
 */
/**
 * Make authenticated API request
 */
export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401 - try to refresh token
  if (response.status === 401 && token) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      // Retry the request with new token
      const newToken = getAccessToken();
      (headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
      const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!retryResponse.ok) {
        throw new ApiError(retryResponse.status, retryResponse.statusText);
      }

      return retryResponse.json();
    } else {
      // Refresh failed - clear tokens and redirect to login
      clearTokens();
      window.location.href = '/';
      throw new ApiError(401, 'Session expired');
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new ApiError(response.status, response.statusText, errorData);
  }

  return response.json();
}

/**
 * Try to refresh the access token
 */
async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Auth API
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    organizationId: string;
    status: string;
  };
}

export interface UserResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    organizationId: string;
    status: string;
    permissions?: string[];
    podMemberships?: PodMembership[];
  };
}

export interface PodMembership {
  podId: string;
  podCode: string;
  podName: string;
  roleInPod: string;
  isPrimary: boolean;
  accessLevel: 'standard' | 'elevated' | 'emergency';
  expiresAt?: string;
}

export const authApi = {
  /**
   * Login with email and password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new ApiError(response.status, response.statusText, errorData);
    }

    const data = await response.json();
    setTokens(data.accessToken, data.refreshToken);
    return data;
  },

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<UserResponse> {
    return request<UserResponse>('/api/auth/me');
  },

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } finally {
      clearTokens();
    }
  },

  /**
   * Refresh token
   */
  async refreshToken(): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new ApiError(response.status, response.statusText);
    }

    const data = await response.json();
    setTokens(data.accessToken, data.refreshToken);
    return data;
  },
};

// ============================================================================
// Console API (Dashboard Data)
// ============================================================================

export interface Shift {
  id: string;
  caregiverId: string;
  caregiverName: string;
  clientId: string;
  clientName: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: string;
  podId: string;
  podCode: string;
}

export interface Caregiver {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  podId: string;
  podCode: string;
  certifications: string[];
}

export interface Authorization {
  id: string;
  authorizationNumber: string;
  serviceCode: string;
  unitsApproved: number;
  unitsUsed: number;
  startDate: string;
  endDate: string;
  status: string;
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  medicaidNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  status: string;
  podId?: string;
  podCode?: string;
  podName?: string;
  authorizations?: Authorization[];
}

export interface Pod {
  id: string;
  code: string;
  name: string;
  region: string;
  status: string;
  caregiverCount: number;
  clientCount: number;
}

export const consoleApi = {
  /**
   * Get today's shifts
   */
  async getShifts(): Promise<{ shifts: Shift[] }> {
    return request<{ shifts: Shift[] }>('/api/console/shifts');
  },

  /**
   * Get all caregivers
   */
  async getCaregivers(): Promise<{ caregivers: Caregiver[] }> {
    return request<{ caregivers: Caregiver[] }>('/api/console/caregivers');
  },

  /**
   * Get all clients
   */
  async getClients(organizationId: string): Promise<{ clients: Client[] }> {
    return request<{ clients: Client[] }>(`/api/console/clients/${organizationId}`);
  },

  /**
   * Get single client details
   */
  async getClient(organizationId: string, clientId: string): Promise<Client> {
    return request<Client>(`/api/console/clients/${organizationId}/${clientId}`);
  },

  /**
   * Get client schedule
   */
  async getClientSchedule(organizationId: string, clientId: string, startDate?: string, endDate?: string): Promise<{ shifts: Shift[] }> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return request<{ shifts: Shift[] }>(`/api/console/clients/${organizationId}/${clientId}/schedule?${params.toString()}`);
  },

  /**
   * Get all pods
   */
  async getPods(): Promise<{ pods: Pod[] }> {
    return request<{ pods: Pod[] }>('/api/console/pods');
  },
};

// ============================================================================
// Health API
// ============================================================================

export const healthApi = {
  /**
   * Check API health
   */
  async check(): Promise<{ status: string; database: string }> {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  },
};

// Default export for convenience
export default {
  auth: authApi,
  console: consoleApi,
  health: healthApi,
};
