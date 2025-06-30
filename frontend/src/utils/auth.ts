// Token management utilities with improved security

const TOKEN_KEY = 'jwt_token';
const TOKEN_EXPIRY_KEY = 'jwt_expiry';

export interface TokenInfo {
  token: string;
  expiresAt: number;
}

export class AuthTokenManager {
  static setToken(token: string, expiresInSeconds: number = 3600): void {
    const expiresAt = Date.now() + (expiresInSeconds * 1000);
    
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt.toString());
    } catch (error) {
      console.error('Failed to store token:', error);
    }
  }

  static getToken(): string | null {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);
      
      if (!token || !expiryStr) {
        return null;
      }

      const expiresAt = parseInt(expiryStr, 10);
      if (Date.now() >= expiresAt) {
        // Token expired, clean up
        this.clearToken();
        return null;
      }

      return token;
    } catch (error) {
      console.error('Failed to retrieve token:', error);
      return null;
    }
  }

  static clearToken(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_EXPIRY_KEY);
    } catch (error) {
      console.error('Failed to clear token:', error);
    }
  }

  static isTokenValid(): boolean {
    return this.getToken() !== null;
  }

  static redirectToLogin(): void {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!API_BASE_URL) {
      console.error('API base URL is not configured.');
      // Optionally, handle this error more gracefully, e.g., show a message to the user
      return;
    }
    window.location.href = `${API_BASE_URL}/auth/github/login`;
  }
}

// HTTP client with automatic token handling
export class ApiClient {
  private static baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

  static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.baseURL) {
      throw new Error('API base URL is not configured.');
    }
    const token = AuthTokenManager.getToken();

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, config);

    if (response.status === 401) {
      // 检查是否是公开端点，如果是则不重定向到登录页面
      const isPublicEndpoint = endpoint.includes('/public') ||
                               endpoint.includes('/audits') ||
                               endpoint.includes('/health') ||
                               endpoint.includes('/gpg/signatures/plugin/') ||
                               endpoint.includes('/gpg/statistics');

      if (!isPublicEndpoint && token) {
        // 只有在有token但仍然401时才清除token并重定向
        AuthTokenManager.clearToken();
        AuthTokenManager.redirectToLogin();
        throw new Error('Authentication required');
      } else if (!isPublicEndpoint) {
        // 对于需要认证的端点，但用户未登录
        throw new Error('Authentication required');
      }
      // 对于公开端点的401错误，继续处理响应
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  static async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  static async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Auth API methods
export class AuthAPI {
  static async logout(): Promise<void> {
    await ApiClient.post('/auth/logout');
    AuthTokenManager.clearToken();
  }

  static async getCurrentUser(): Promise<any> {
    return ApiClient.get('/auth/me');
  }
}

// Plugin API methods
export class PluginAPI {
  static async createAstrBotIssue(pluginId: string): Promise<any> {
    return ApiClient.post(`/plugins/${pluginId}/create-issue`);
  }

  static async getManualIssueUrl(pluginId: string): Promise<any> {
    return ApiClient.get(`/plugins/${pluginId}/manual-issue-url`);
  }

  static async getGithubRepos(): Promise<any> {
    return ApiClient.get('/plugins/github/repos');
  }

  static async submitPlugin(repoUrl: string): Promise<any> {
    return ApiClient.post('/plugins/submit', { repoUrl });
  }

  static async resubmitPlugin(repoUrl: string): Promise<any> {
    return ApiClient.post('/plugins/submit', { repoUrl });
  }

  static async getUserPlugins(): Promise<any> {
    return ApiClient.get('/plugins/user');
  }

  static async getMyPluginAudits(pluginId: string): Promise<any> {
    return ApiClient.get(`/audits/my-plugin/${pluginId}`);
  }
}
