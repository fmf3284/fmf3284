import type { RequestConfig } from '@/types/api';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export const API_TIMEOUT = parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000', 10);

class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number;

  constructor(baseUrl: string, timeout: number) {
    this.baseUrl = baseUrl;
    this.defaultTimeout = timeout;
  }

  async fetch<T>(endpoint: string, options: RequestConfig = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const timeout = options.timeout || this.defaultTimeout;

    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      signal: AbortSignal.timeout(timeout),
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: response.statusText,
          statusCode: response.status,
        }));

        const apiError = new Error(error.message || 'API request failed');
        Object.assign(apiError, { statusCode: response.status, ...error });
        throw apiError;
      }

      if (response.status === 204) {
        return {} as T;
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }
}

export const apiClient = new ApiClient(API_BASE_URL, API_TIMEOUT);

export async function apiFetch<T>(
  endpoint: string,
  options: RequestConfig = {}
): Promise<T> {
  return apiClient.fetch<T>(endpoint, options);
}
