/**
 * API compatibility layer for transitioning from mock to real endpoints
 *
 * This file provides helpers to transform new API responses to match
 * the expected format from the old mock data.
 */

/**
 * Fetch locations with backward-compatible response format
 *
 * Old format: Array of locations
 * New format: { success, data, pagination }
 *
 * This wrapper returns just the data array for compatibility
 */
export async function fetchLocations(params?: {
  q?: string;
  category?: string;
  minRating?: number;
  priceRange?: string;
  amenities?: string[];
  city?: string;
  state?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}): Promise<any[]> {
  const searchParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v) => searchParams.append(`${key}[]`, String(v)));
        } else {
          searchParams.append(key, String(value));
        }
      }
    });
  }

  const url = `/api/locations?${searchParams.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch locations: ${response.statusText}`);
  }

  const result = await response.json();

  // Return just the data array for backward compatibility
  // Frontend can check for result.data or result.success if needed
  return result.data || result;
}

/**
 * Fetch a single location with backward-compatible response format
 *
 * Old format: Location object
 * New format: { success, data }
 *
 * This wrapper returns just the data object for compatibility
 */
export async function fetchLocationById(id: string): Promise<any> {
  const response = await fetch(`/api/locations/${id}`);

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Failed to fetch location: ${response.statusText}`);
  }

  const result = await response.json();

  // Return just the data object for backward compatibility
  return result.data || result;
}

/**
 * Transform new API response to old mock format
 * Useful for gradual migration
 */
export function transformLocationResponse(newResponse: any): any {
  if (newResponse.success && newResponse.data) {
    return newResponse.data;
  }
  return newResponse;
}
