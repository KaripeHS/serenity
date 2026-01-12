const API_URL = import.meta.env.VITE_API_URL || '';

const getToken = () => localStorage.getItem('serenity_access_token');

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`,
});

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || error.error || `HTTP ${response.status}`);
  }
  return response.json();
}

export const api = {
  async get<T = unknown>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_URL}/api${endpoint}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse<T>(response);
  },

  async post<T = unknown>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${API_URL}/api${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse<T>(response);
  },

  async put<T = unknown>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${API_URL}/api${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse<T>(response);
  },

  async patch<T = unknown>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${API_URL}/api${endpoint}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse<T>(response);
  },

  async delete<T = unknown>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_URL}/api${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<T>(response);
  },
};

export default api;
