/**
 * Test utilities and helpers
 */
import { NextRequest } from 'next/server';

/**
 * Create a mock NextRequest for testing API routes
 */
export function createMockRequest(options: {
  method?: string;
  url?: string;
  body?: any;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  searchParams?: Record<string, string>;
} = {}): NextRequest {
  const {
    method = 'GET',
    url = 'http://localhost:3000/api/test',
    body,
    headers = {},
    cookies = {},
    searchParams = {},
  } = options;

  const urlObj = new URL(url);
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value);
  });

  return {
    method,
    url: urlObj.toString(),
    headers: {
      get: (name: string) => headers[name.toLowerCase()] || null,
      has: (name: string) => name.toLowerCase() in headers,
    },
    cookies: {
      get: (name: string) => cookies[name] ? { name, value: cookies[name] } : undefined,
      getAll: () => Object.entries(cookies).map(([name, value]) => ({ name, value })),
    },
    json: jest.fn().mockResolvedValue(body || {}),
    text: jest.fn().mockResolvedValue(JSON.stringify(body || {})),
    nextUrl: urlObj,
  } as unknown as NextRequest;
}

/**
 * Create mock user data
 */
export function createMockUser(overrides = {}) {
  return {
    id: 'user_123',
    email: 'test@example.com',
    name: 'Test User',
    password: '$2b$12$hashedpassword',
    role: 'user',
    status: 'active',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create mock admin user
 */
export function createMockAdmin(overrides = {}) {
  return createMockUser({
    id: 'admin_123',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    ...overrides,
  });
}

/**
 * Create mock super admin
 */
export function createMockSuperAdmin(overrides = {}) {
  return createMockUser({
    id: 'superadmin_123',
    email: 'moh.alneama@yahoo.com',
    name: 'Mo Alneama',
    role: 'admin',
    ...overrides,
  });
}

/**
 * Create mock review
 */
export function createMockReview(overrides = {}) {
  return {
    id: 'review_123',
    userId: 'user_123',
    placeId: 'place_123',
    rating: 4,
    content: 'Great place!',
    status: 'approved',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create mock location
 */
export function createMockLocation(overrides = {}) {
  return {
    id: 'location_123',
    placeId: 'place_123',
    name: 'Test Gym',
    address: '123 Test St',
    lat: 40.7128,
    lng: -74.0060,
    category: 'gym',
    rating: 4.5,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create mock activity log
 */
export function createMockActivityLog(overrides = {}) {
  return {
    id: 'log_123',
    userId: 'user_123',
    action: 'login',
    details: JSON.stringify({}),
    ipAddress: '127.0.0.1',
    userAgent: 'Jest Test',
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Wait for async operations
 */
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Extract JSON from Response
 */
export async function getResponseJson(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
