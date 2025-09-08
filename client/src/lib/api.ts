// API service for OSINT platform
export const API_BASE_URL = import.meta.env.VITE_API_URL || window.location.origin;

// Export utility function for building API URLs
export function buildApiUrl(endpoint: string): string {
  return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
}

class ApiService {
  private readonly baseUrl = `${API_BASE_URL}/api/v1`;

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options?.headers,
      },
      credentials: 'include',
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Health check endpoint
   */
  async checkHealth(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }

  // OSINT API methods will be implemented in the future
}

// Export singleton instance
export const apiService = new ApiService();

// Export default
export default apiService;
