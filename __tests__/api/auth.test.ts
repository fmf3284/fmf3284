/**
 * Authentication API Tests
 * Tests for login, register, session, logout, password reset endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { createMockRequest, createMockUser, createMockSuperAdmin } from '../mocks/testUtils';

// Mock Prisma
jest.mock('@/server/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    activityLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn((ops) => Promise.all(ops)),
  },
}));

// Mock security utilities
jest.mock('@/server/utils/security', () => ({
  hashPassword: jest.fn().mockResolvedValue('$2b$12$hashedpassword'),
  verifyPassword: jest.fn(),
  validatePassword: jest.fn().mockReturnValue({ isValid: true, errors: [], strength: 'strong' }),
  createSessionToken: jest.fn().mockReturnValue('mock-session-token'),
  verifySessionToken: jest.fn(),
  checkLoginAttempt: jest.fn().mockReturnValue({ allowed: true }),
  recordFailedLogin: jest.fn().mockReturnValue({ remainingAttempts: 4 }),
  clearLoginAttempts: jest.fn(),
  sanitizeEmail: jest.fn((email) => email?.toLowerCase().trim() || ''),
  sanitizeInput: jest.fn((input) => input || ''),
  isValidEmail: jest.fn().mockReturnValue(true),
  securityHeaders: {},
  getSessionDurationSeconds: jest.fn().mockReturnValue(3600),
}));

import { prisma } from '@/server/db/prisma';
import * as security from '@/server/utils/security';

describe('Authentication API', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // LOGIN API
  // ═══════════════════════════════════════════════════════════════════════════
  describe('POST /api/auth/login', () => {
    
    test('should return 400 for missing email', async () => {
      const { POST } = await import('@/app/api/auth/login/route');
      
      const request = createMockRequest({
        method: 'POST',
        body: { password: 'password123' },
        headers: { 'content-type': 'application/json' },
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    test('should return 400 for missing password', async () => {
      const { POST } = await import('@/app/api/auth/login/route');
      
      const request = createMockRequest({
        method: 'POST',
        body: { email: 'test@example.com' },
        headers: { 'content-type': 'application/json' },
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
    });

    test('should return 401 for non-existent user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      
      const { POST } = await import('@/app/api/auth/login/route');
      
      const request = createMockRequest({
        method: 'POST',
        body: { email: 'nonexistent@example.com', password: 'password123' },
        headers: { 'content-type': 'application/json' },
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid email or password');
    });

    test('should return 403 for suspended user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(
        createMockUser({ status: 'suspended' })
      );
      
      const { POST } = await import('@/app/api/auth/login/route');
      
      const request = createMockRequest({
        method: 'POST',
        body: { email: 'suspended@example.com', password: 'password123' },
        headers: { 'content-type': 'application/json' },
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(403);
    });

    test('should return 403 for pending verification user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(
        createMockUser({ status: 'pending' })
      );
      
      const { POST } = await import('@/app/api/auth/login/route');
      
      const request = createMockRequest({
        method: 'POST',
        body: { email: 'pending@example.com', password: 'password123' },
        headers: { 'content-type': 'application/json' },
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(403);
    });

    test('should return 401 for incorrect password', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(
        createMockUser({ status: 'active' })
      );
      (security.verifyPassword as jest.Mock).mockResolvedValue(false);
      
      const { POST } = await import('@/app/api/auth/login/route');
      
      const request = createMockRequest({
        method: 'POST',
        body: { email: 'test@example.com', password: 'wrongpassword' },
        headers: { 'content-type': 'application/json' },
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.remainingAttempts).toBeDefined();
    });

    test('should return 200 for successful login', async () => {
      const mockUser = createMockUser({ status: 'active', loginCount: 5 });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (security.verifyPassword as jest.Mock).mockResolvedValue(true);
      (prisma.$transaction as jest.Mock).mockResolvedValue([mockUser, {}]);
      
      const { POST } = await import('@/app/api/auth/login/route');
      
      const request = createMockRequest({
        method: 'POST',
        body: { email: 'test@example.com', password: 'correctpassword' },
        headers: { 'content-type': 'application/json' },
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
    });

    test('should return 429 when account is locked', async () => {
      (security.checkLoginAttempt as jest.Mock).mockReturnValue({
        allowed: false,
        lockedUntil: new Date(Date.now() + 900000),
        message: 'Account locked',
      });
      
      const { POST } = await import('@/app/api/auth/login/route');
      
      const request = createMockRequest({
        method: 'POST',
        body: { email: 'test@example.com', password: 'password' },
        headers: { 'content-type': 'application/json' },
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(429);
      expect(data.lockedUntil).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REGISTER API
  // ═══════════════════════════════════════════════════════════════════════════
  describe('POST /api/auth/register', () => {
    
    beforeEach(() => {
      (security.checkLoginAttempt as jest.Mock).mockReturnValue({ allowed: true });
      (security.isValidEmail as jest.Mock).mockReturnValue(true);
      (security.validatePassword as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
        strength: 'strong',
      });
    });

    test('should return 400 for missing required fields', async () => {
      const { POST } = await import('@/app/api/auth/register/route');
      
      const request = createMockRequest({
        method: 'POST',
        body: { email: 'test@example.com' },
        headers: { 'content-type': 'application/json' },
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(400);
    });

    test('should return 400 for invalid email', async () => {
      (security.isValidEmail as jest.Mock).mockReturnValue(false);
      
      const { POST } = await import('@/app/api/auth/register/route');
      
      const request = createMockRequest({
        method: 'POST',
        body: { email: 'invalid', password: 'Password123!', name: 'Test' },
        headers: { 'content-type': 'application/json' },
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(400);
    });

    test('should return 400 for weak password', async () => {
      (security.validatePassword as jest.Mock).mockReturnValue({
        isValid: false,
        errors: ['Password too weak'],
        strength: 'weak',
      });
      
      const { POST } = await import('@/app/api/auth/register/route');
      
      const request = createMockRequest({
        method: 'POST',
        body: { email: 'test@example.com', password: 'weak', name: 'Test' },
        headers: { 'content-type': 'application/json' },
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.passwordErrors).toBeDefined();
    });

    test('should return 400 for existing email', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(createMockUser());
      
      const { POST } = await import('@/app/api/auth/register/route');
      
      const request = createMockRequest({
        method: 'POST',
        body: { email: 'existing@example.com', password: 'Password123!', name: 'Test' },
        headers: { 'content-type': 'application/json' },
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(400);
    });

    test('should return 201 for successful registration', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(
        createMockUser({ status: 'pending', emailVerified: false })
      );
      
      const { POST } = await import('@/app/api/auth/register/route');
      
      const request = createMockRequest({
        method: 'POST',
        body: { email: 'new@example.com', password: 'Password123!', name: 'New User' },
        headers: { 'content-type': 'application/json' },
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });

    test('should auto-activate super admin on registration', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(
        createMockSuperAdmin({ status: 'active', emailVerified: true })
      );
      
      const { POST } = await import('@/app/api/auth/register/route');
      
      const request = createMockRequest({
        method: 'POST',
        body: { 
          email: 'moh.alneama@yahoo.com', 
          password: 'Password123!', 
          name: 'Mo Alneama' 
        },
        headers: { 'content-type': 'application/json' },
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data.redirect).toBe('/admin');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SESSION API
  // ═══════════════════════════════════════════════════════════════════════════
  describe('GET /api/auth/session', () => {
    
    test('should return authenticated false without token', async () => {
      const { GET } = await import('@/app/api/auth/session/route');
      
      const request = createMockRequest({
        method: 'GET',
      });
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.authenticated).toBe(false);
    });

    test('should return authenticated false for invalid token', async () => {
      (security.verifySessionToken as jest.Mock).mockReturnValue(null);
      
      const { GET } = await import('@/app/api/auth/session/route');
      
      const request = createMockRequest({
        method: 'GET',
        cookies: { auth_token: 'invalid-token' },
      });
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(data.authenticated).toBe(false);
    });

    test('should return user for valid session', async () => {
      const mockUser = createMockUser();
      (security.verifySessionToken as jest.Mock).mockReturnValue({
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        expiresAt: Date.now() + 3600000,
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      
      const { GET } = await import('@/app/api/auth/session/route');
      
      const request = createMockRequest({
        method: 'GET',
        cookies: { auth_token: 'valid-token' },
      });
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.authenticated).toBe(true);
      expect(data.user.email).toBe(mockUser.email);
    });

    test('should return 403 for suspended user', async () => {
      const mockUser = createMockUser({ status: 'suspended' });
      (security.verifySessionToken as jest.Mock).mockReturnValue({
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        expiresAt: Date.now() + 3600000,
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      
      const { GET } = await import('@/app/api/auth/session/route');
      
      const request = createMockRequest({
        method: 'GET',
        cookies: { auth_token: 'valid-token' },
      });
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(403);
      expect(data.reason).toBe('account_suspended');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // LOGOUT API
  // ═══════════════════════════════════════════════════════════════════════════
  describe('POST /api/auth/logout', () => {
    
    test('should return success on logout', async () => {
      const { POST } = await import('@/app/api/auth/logout/route');
      
      const request = createMockRequest({
        method: 'POST',
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PASSWORD RESET API
  // ═══════════════════════════════════════════════════════════════════════════
  describe('POST /api/auth/reset-password', () => {
    
    test('should return 400 for missing fields', async () => {
      const { POST } = await import('@/app/api/auth/reset-password/route');
      
      const request = createMockRequest({
        method: 'POST',
        body: { email: 'test@example.com' },
        headers: { 'content-type': 'application/json' },
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(400);
    });

    test('should return 403 for non-super-admin email', async () => {
      const { POST } = await import('@/app/api/auth/reset-password/route');
      
      const request = createMockRequest({
        method: 'POST',
        body: { 
          email: 'regular@example.com', 
          unlockCode: '1954',
          newPassword: 'newpass123' 
        },
        headers: { 'content-type': 'application/json' },
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(403);
      expect(data.error).toContain('Super Admin');
    });

    test('should return 403 for incorrect master code', async () => {
      const { POST } = await import('@/app/api/auth/reset-password/route');
      
      const request = createMockRequest({
        method: 'POST',
        body: { 
          email: 'moh.alneama@yahoo.com', 
          unlockCode: 'wrong',
          newPassword: 'newpass123' 
        },
        headers: { 'content-type': 'application/json' },
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(403);
    });

    test('should return 200 for correct super admin reset', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(createMockSuperAdmin());
      (prisma.user.update as jest.Mock).mockResolvedValue(createMockSuperAdmin());
      
      const { POST } = await import('@/app/api/auth/reset-password/route');
      
      const request = createMockRequest({
        method: 'POST',
        body: { 
          email: 'moh.alneama@yahoo.com', 
          unlockCode: '1954',
          newPassword: 'newpassword123' 
        },
        headers: { 'content-type': 'application/json' },
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
