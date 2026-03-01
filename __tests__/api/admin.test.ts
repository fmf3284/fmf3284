/**
 * Admin API Tests
 * Tests for user management, super admin protection, reviews, logs
 */

import { createMockRequest, createMockUser, createMockAdmin, createMockSuperAdmin, createMockReview, createMockActivityLog } from '../mocks/testUtils';

// Mock Prisma
jest.mock('@/server/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    review: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    activityLog: {
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    location: {
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// Mock session
jest.mock('@/server/auth/session', () => ({
  getRequestUser: jest.fn(),
}));

import { prisma } from '@/server/db/prisma';
import { getRequestUser } from '@/server/auth/session';

describe('Admin API', () => {
  const SUPER_ADMIN_EMAIL = 'moh.alneama@yahoo.com';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN USERS API
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Admin Users API', () => {

    describe('GET /api/admin/users', () => {
      
      test('should return 401 for unauthenticated request', async () => {
        (getRequestUser as jest.Mock).mockResolvedValue(null);
        
        const { GET } = await import('@/app/api/admin/users/route');
        const request = createMockRequest({ method: 'GET' });
        
        const response = await GET(request);
        
        expect(response.status).toBe(401);
      });

      test('should return 403 for non-admin user', async () => {
        (getRequestUser as jest.Mock).mockResolvedValue(createMockUser({ role: 'user' }));
        
        const { GET } = await import('@/app/api/admin/users/route');
        const request = createMockRequest({ method: 'GET' });
        
        const response = await GET(request);
        
        expect(response.status).toBe(403);
      });

      test('should return users list for admin', async () => {
        (getRequestUser as jest.Mock).mockResolvedValue(createMockAdmin());
        (prisma.user.findMany as jest.Mock).mockResolvedValue([
          createMockUser({ id: '1', email: 'user1@test.com' }),
          createMockUser({ id: '2', email: 'user2@test.com' }),
        ]);
        
        const { GET } = await import('@/app/api/admin/users/route');
        const request = createMockRequest({ method: 'GET' });
        
        const response = await GET(request);
        const data = await response.json();
        
        expect(response.status).toBe(200);
        expect(data.users).toHaveLength(2);
      });
    });

    describe('DELETE /api/admin/users/:id', () => {

      test('should return 403 when deleting super admin without code', async () => {
        (getRequestUser as jest.Mock).mockResolvedValue(createMockAdmin());
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(createMockSuperAdmin());
        
        const { DELETE } = await import('@/app/api/admin/users/[id]/route');
        const request = createMockRequest({ 
          method: 'DELETE',
          url: 'http://localhost/api/admin/users/superadmin123',
        });
        
        const response = await DELETE(request, { params: Promise.resolve({ id: 'superadmin123' }) });
        const data = await response.json();
        
        expect(response.status).toBe(403);
        expect(data.protected).toBe(true);
      });

      test('should allow deleting regular user', async () => {
        (getRequestUser as jest.Mock).mockResolvedValue(createMockAdmin());
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(
          createMockUser({ id: 'user123', email: 'regular@test.com' })
        );
        (prisma.user.delete as jest.Mock).mockResolvedValue({});
        
        const { DELETE } = await import('@/app/api/admin/users/[id]/route');
        const request = createMockRequest({ 
          method: 'DELETE',
          url: 'http://localhost/api/admin/users/user123',
        });
        
        const response = await DELETE(request, { params: Promise.resolve({ id: 'user123' }) });
        const data = await response.json();
        
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });

      test('should prevent admin from deleting own account', async () => {
        const admin = createMockAdmin({ id: 'admin123' });
        (getRequestUser as jest.Mock).mockResolvedValue(admin);
        
        const { DELETE } = await import('@/app/api/admin/users/[id]/route');
        const request = createMockRequest({ 
          method: 'DELETE',
          url: 'http://localhost/api/admin/users/admin123',
        });
        
        const response = await DELETE(request, { params: Promise.resolve({ id: 'admin123' }) });
        const data = await response.json();
        
        expect(response.status).toBe(400);
        expect(data.error).toContain('own account');
      });
    });

    describe('PATCH /api/admin/users/:id', () => {

      test('should return 403 when suspending super admin', async () => {
        (getRequestUser as jest.Mock).mockResolvedValue(createMockAdmin());
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(createMockSuperAdmin());
        
        const { PATCH } = await import('@/app/api/admin/users/[id]/route');
        const request = createMockRequest({ 
          method: 'PATCH',
          url: 'http://localhost/api/admin/users/superadmin123',
          body: { action: 'suspend' },
        });
        
        const response = await PATCH(request, { params: Promise.resolve({ id: 'superadmin123' }) });
        const data = await response.json();
        
        expect(response.status).toBe(403);
        expect(data.protected).toBe(true);
      });

      test('should allow suspending regular user', async () => {
        (getRequestUser as jest.Mock).mockResolvedValue(createMockAdmin());
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(
          createMockUser({ id: 'user123', email: 'regular@test.com' })
        );
        (prisma.user.update as jest.Mock).mockResolvedValue(
          createMockUser({ id: 'user123', status: 'suspended' })
        );
        
        const { PATCH } = await import('@/app/api/admin/users/[id]/route');
        const request = createMockRequest({ 
          method: 'PATCH',
          url: 'http://localhost/api/admin/users/user123',
          body: { action: 'suspend' },
        });
        
        const response = await PATCH(request, { params: Promise.resolve({ id: 'user123' }) });
        const data = await response.json();
        
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });

      test('should return 403 when changing super admin role', async () => {
        (getRequestUser as jest.Mock).mockResolvedValue(createMockAdmin());
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(createMockSuperAdmin());
        
        const { PATCH } = await import('@/app/api/admin/users/[id]/route');
        const request = createMockRequest({ 
          method: 'PATCH',
          url: 'http://localhost/api/admin/users/superadmin123',
          body: { role: 'user' },
        });
        
        const response = await PATCH(request, { params: Promise.resolve({ id: 'superadmin123' }) });
        const data = await response.json();
        
        expect(response.status).toBe(403);
        expect(data.protected).toBe(true);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN REVIEWS API
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Admin Reviews API', () => {

    describe('GET /api/admin/reviews', () => {
      
      test('should return reviews for admin', async () => {
        (getRequestUser as jest.Mock).mockResolvedValue(createMockAdmin());
        (prisma.review.findMany as jest.Mock).mockResolvedValue([
          createMockReview({ id: '1' }),
          createMockReview({ id: '2' }),
        ]);
        
        const { GET } = await import('@/app/api/admin/reviews/route');
        const request = createMockRequest({ method: 'GET' });
        
        const response = await GET(request);
        const data = await response.json();
        
        expect(response.status).toBe(200);
        expect(data.reviews).toBeDefined();
      });
    });

    describe('PATCH /api/admin/reviews/:id', () => {
      
      test('should update review status', async () => {
        (getRequestUser as jest.Mock).mockResolvedValue(createMockAdmin());
        (prisma.review.update as jest.Mock).mockResolvedValue(
          createMockReview({ id: 'review123', status: 'hidden' })
        );
        
        const { PATCH } = await import('@/app/api/admin/reviews/[id]/route');
        const request = createMockRequest({ 
          method: 'PATCH',
          body: { status: 'hidden' },
        });
        
        const response = await PATCH(request, { params: Promise.resolve({ id: 'review123' }) });
        const data = await response.json();
        
        expect(response.status).toBe(200);
        expect(data.review.status).toBe('hidden');
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN LOGS API
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Admin Logs API', () => {

    describe('GET /api/admin/logs', () => {
      
      test('should return activity logs for admin', async () => {
        (getRequestUser as jest.Mock).mockResolvedValue(createMockAdmin());
        (prisma.activityLog.findMany as jest.Mock).mockResolvedValue([
          createMockActivityLog({ action: 'login' }),
          createMockActivityLog({ action: 'search' }),
        ]);
        (prisma.activityLog.count as jest.Mock).mockResolvedValue(2);
        
        const { GET } = await import('@/app/api/admin/logs/route');
        const request = createMockRequest({ 
          method: 'GET',
          url: 'http://localhost/api/admin/logs',
        });
        
        const response = await GET(request);
        const data = await response.json();
        
        expect(response.status).toBe(200);
        expect(data.logs).toBeDefined();
      });

      test('should filter logs by action', async () => {
        (getRequestUser as jest.Mock).mockResolvedValue(createMockAdmin());
        (prisma.activityLog.findMany as jest.Mock).mockResolvedValue([
          createMockActivityLog({ action: 'login' }),
        ]);
        (prisma.activityLog.count as jest.Mock).mockResolvedValue(1);
        
        const { GET } = await import('@/app/api/admin/logs/route');
        const request = createMockRequest({ 
          method: 'GET',
          url: 'http://localhost/api/admin/logs?action=login',
        });
        
        const response = await GET(request);
        
        expect(response.status).toBe(200);
        expect(prisma.activityLog.findMany).toHaveBeenCalled();
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN DASHBOARD API
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Admin Dashboard API', () => {

    describe('GET /api/admin/dashboard', () => {
      
      test('should return dashboard stats', async () => {
        (getRequestUser as jest.Mock).mockResolvedValue(createMockAdmin());
        (prisma.user.count as jest.Mock).mockResolvedValue(100);
        (prisma.review.count as jest.Mock).mockResolvedValue(50);
        (prisma.location.count as jest.Mock).mockResolvedValue(25);
        
        const { GET } = await import('@/app/api/admin/dashboard/route');
        const request = createMockRequest({ method: 'GET' });
        
        const response = await GET(request);
        const data = await response.json();
        
        expect(response.status).toBe(200);
        expect(data.stats).toBeDefined();
      });
    });
  });
});
