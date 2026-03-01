/**
 * API fetch wrapper that automatically handles auth
 */

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | string[] | undefined>;
}

/**
 * Enhanced fetch wrapper
 */
export async function apiFetch<T = any>(url: string, options: FetchOptions = {}): Promise<T> {
  const { params, headers: customHeaders, ...fetchOptions } = options;

  // Build URL with query params
  let finalUrl = url;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v) => searchParams.append(key, String(v)));
        } else {
          searchParams.append(key, String(value));
        }
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      finalUrl = `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
    }
  }

  // Build headers
  const headers = new Headers(customHeaders);

  // Add Content-Type for JSON bodies
  if (fetchOptions.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(finalUrl, {
    ...fetchOptions,
    headers,
    credentials: 'include', // Include cookies for auth
  });

  if (!response.ok) {
    const error: any = new Error(`API Error: ${response.status} ${response.statusText}`);
    error.status = response.status;
    error.response = response;

    try {
      error.data = await response.json();
    } catch {
      // Response not JSON
    }

    throw error;
  }

  // Handle empty responses
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return null as T;
  }

  return response.json();
}

/**
 * GET request
 */
export function apiGet<T = any>(url: string, params?: Record<string, any>): Promise<T> {
  return apiFetch<T>(url, { method: 'GET', params });
}

/**
 * POST request
 */
export function apiPost<T = any>(url: string, data?: any): Promise<T> {
  return apiFetch<T>(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PUT request
 */
export function apiPut<T = any>(url: string, data?: any): Promise<T> {
  return apiFetch<T>(url, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE request
 */
export function apiDelete<T = any>(url: string): Promise<T> {
  return apiFetch<T>(url, { method: 'DELETE' });
}

/**
 * PATCH request
 */
export function apiPatch<T = any>(url: string, data?: any): Promise<T> {
  return apiFetch<T>(url, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
}
