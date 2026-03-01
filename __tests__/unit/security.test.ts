/**
 * Security Utilities Unit Tests
 * Comprehensive tests for password, session, brute force protection, and sanitization
 */

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn((password: string) => Promise.resolve(`$2b$12$hashed_${password}`)),
  compare: jest.fn((password: string, hash: string) => Promise.resolve(hash === `$2b$12$hashed_${password}`)),
}));

import {
  hashPassword,
  verifyPassword,
  validatePassword,
  createSessionToken,
  verifySessionToken,
  checkLoginAttempt,
  recordFailedLogin,
  clearLoginAttempts,
  sanitizeEmail,
  sanitizeInput,
  isValidEmail,
  getSessionDurationSeconds,
} from '@/server/utils/security';

describe('Security Utilities', () => {

  // ═══════════════════════════════════════════════════════════════════════════
  // PASSWORD HASHING
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Password Hashing', () => {
    test('hashPassword should hash a password', async () => {
      const password = 'TestPassword123!';
      const hashed = await hashPassword(password);
      
      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed).toContain('$2b$12$');
    });

    test('verifyPassword should return true for correct password', async () => {
      const password = 'SecurePass456!';
      const hashed = await hashPassword(password);
      const isValid = await verifyPassword(password, hashed);
      
      expect(isValid).toBe(true);
    });

    test('verifyPassword should return false for incorrect password', async () => {
      const password = 'CorrectPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hashed = await hashPassword(password);
      const isValid = await verifyPassword(wrongPassword, hashed);
      
      expect(isValid).toBe(false);
    });

    test('hashPassword should handle empty string', async () => {
      const hashed = await hashPassword('');
      expect(hashed).toBeDefined();
    });

    test('hashPassword should handle special characters', async () => {
      const password = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hashed = await hashPassword(password);
      expect(hashed).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PASSWORD VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Password Validation', () => {
    test('should accept valid strong password', () => {
      const result = validatePassword('SecurePass123!');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(['medium', 'strong']).toContain(result.strength);
    });

    test('should reject password shorter than 8 characters', () => {
      const result = validatePassword('Short1!');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    test('should reject password without uppercase', () => {
      const result = validatePassword('lowercase123!');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    test('should reject password without lowercase', () => {
      const result = validatePassword('UPPERCASE123!');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    test('should reject password without number', () => {
      const result = validatePassword('NoNumbersHere!');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    test('should reject password without special character', () => {
      const result = validatePassword('NoSpecial123');
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('special character'))).toBe(true);
    });

    test('should return weak strength for weak password', () => {
      const result = validatePassword('weak');
      expect(result.strength).toBe('weak');
    });

    test('should reject common passwords', () => {
      const result = validatePassword('Password1!');
      expect(result.errors.some(e => e.includes('common'))).toBe(true);
    });

    test('should return multiple errors for very weak password', () => {
      const result = validatePassword('ab');
      expect(result.errors.length).toBeGreaterThan(3);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SESSION TOKENS
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Session Tokens', () => {
    const userId = 'user_123';
    const email = 'test@example.com';
    const role = 'user';
    const ip = '127.0.0.1';
    const userAgent = 'Jest Test Agent';

    test('createSessionToken should create a valid token', () => {
      const token = createSessionToken(userId, email, role, ip, userAgent);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(50);
      expect(token).toContain('.');
    });

    test('verifySessionToken should verify valid token', () => {
      const token = createSessionToken(userId, email, role, ip, userAgent);
      const data = verifySessionToken(token);
      
      expect(data).not.toBeNull();
      expect(data?.userId).toBe(userId);
      expect(data?.email).toBe(email);
      expect(data?.role).toBe(role);
    });

    test('verifySessionToken should include expiration time', () => {
      const token = createSessionToken(userId, email, role, ip, userAgent);
      const data = verifySessionToken(token);
      
      expect(data?.expiresAt).toBeDefined();
      expect(data!.expiresAt).toBeGreaterThan(Date.now());
    });

    test('verifySessionToken should reject invalid token', () => {
      const data = verifySessionToken('invalid-token');
      expect(data).toBeNull();
    });

    test('verifySessionToken should reject empty token', () => {
      const data = verifySessionToken('');
      expect(data).toBeNull();
    });

    test('verifySessionToken should reject tampered token', () => {
      const token = createSessionToken(userId, email, role, ip, userAgent);
      const tamperedToken = token.slice(0, -10) + 'tampered!!';
      const data = verifySessionToken(tamperedToken);
      
      expect(data).toBeNull();
    });

    test('getSessionDurationSeconds should return 3600', () => {
      const duration = getSessionDurationSeconds();
      expect(duration).toBe(3600);
    });

    test('should handle special characters in user agent', () => {
      const specialAgent = 'Mozilla/5.0 <script>alert("test")</script>';
      const token = createSessionToken(userId, email, role, ip, specialAgent);
      const data = verifySessionToken(token);
      
      expect(data).not.toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BRUTE FORCE PROTECTION
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Brute Force Protection', () => {
    const testKey = 'brute-force-test-' + Date.now();

    beforeEach(() => {
      clearLoginAttempts(testKey);
    });

    afterEach(() => {
      clearLoginAttempts(testKey);
    });

    test('checkLoginAttempt should allow first attempt', () => {
      const result = checkLoginAttempt(testKey);
      expect(result.allowed).toBe(true);
    });

    test('recordFailedLogin should decrement remaining attempts', () => {
      const result1 = recordFailedLogin(testKey);
      expect(result1.remainingAttempts).toBe(4);

      const result2 = recordFailedLogin(testKey);
      expect(result2.remainingAttempts).toBe(3);
    });

    test('should lock after 5 failed attempts', () => {
      for (let i = 0; i < 5; i++) {
        recordFailedLogin(testKey);
      }
      
      const result = checkLoginAttempt(testKey);
      expect(result.allowed).toBe(false);
      expect(result.lockedUntil).toBeDefined();
    });

    test('clearLoginAttempts should reset attempts', () => {
      recordFailedLogin(testKey);
      recordFailedLogin(testKey);
      
      clearLoginAttempts(testKey);
      
      const result = checkLoginAttempt(testKey);
      expect(result.allowed).toBe(true);
    });

    test('different keys should be independent', () => {
      const key1 = testKey + '-1';
      const key2 = testKey + '-2';

      for (let i = 0; i < 5; i++) {
        recordFailedLogin(key1);
      }

      const result1 = checkLoginAttempt(key1);
      const result2 = checkLoginAttempt(key2);

      expect(result1.allowed).toBe(false);
      expect(result2.allowed).toBe(true);

      clearLoginAttempts(key1);
      clearLoginAttempts(key2);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // INPUT SANITIZATION
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Input Sanitization', () => {
    
    describe('sanitizeEmail', () => {
      test('should lowercase email', () => {
        expect(sanitizeEmail('Test@Example.COM')).toBe('test@example.com');
      });

      test('should trim whitespace', () => {
        expect(sanitizeEmail('  test@example.com  ')).toBe('test@example.com');
      });

      test('should handle empty string', () => {
        expect(sanitizeEmail('')).toBe('');
      });

      test('should handle null', () => {
        expect(sanitizeEmail(null as any)).toBe('');
      });

      test('should handle undefined', () => {
        expect(sanitizeEmail(undefined as any)).toBe('');
      });

      test('should preserve plus addressing', () => {
        expect(sanitizeEmail('User+Tag@Example.com')).toBe('user+tag@example.com');
      });
    });

    describe('sanitizeInput', () => {
      test('should escape HTML tags', () => {
        const input = '<script>alert("xss")</script>';
        const sanitized = sanitizeInput(input);
        expect(sanitized).not.toContain('<script>');
      });

      test('should preserve normal text', () => {
        const input = 'Hello, World!';
        expect(sanitizeInput(input)).toBe(input);
      });

      test('should handle empty string', () => {
        expect(sanitizeInput('')).toBe('');
      });

      test('should escape angle brackets', () => {
        const input = '<div>test</div>';
        const sanitized = sanitizeInput(input);
        expect(sanitized).not.toContain('<div>');
      });
    });

    describe('isValidEmail', () => {
      test('should accept valid emails', () => {
        expect(isValidEmail('test@example.com')).toBe(true);
        expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
        expect(isValidEmail('user+tag@example.org')).toBe(true);
      });

      test('should reject invalid emails', () => {
        expect(isValidEmail('notanemail')).toBe(false);
        expect(isValidEmail('missing@')).toBe(false);
        expect(isValidEmail('@nodomain.com')).toBe(false);
        expect(isValidEmail('')).toBe(false);
        expect(isValidEmail('spaces in@email.com')).toBe(false);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SUPER ADMIN PROTECTION
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Super Admin Configuration', () => {
    const SUPER_ADMIN_EMAIL = 'moh.alneama@yahoo.com';
    const MASTER_CODE = '1954';

    test('should have correct super admin email', () => {
      expect(SUPER_ADMIN_EMAIL).toBe('moh.alneama@yahoo.com');
    });

    test('should have correct master code', () => {
      expect(MASTER_CODE).toBe('1954');
    });

    test('email should match case-insensitively', () => {
      const variations = [
        'moh.alneama@yahoo.com',
        'MOH.ALNEAMA@YAHOO.COM',
        'Moh.Alneama@Yahoo.Com',
      ];

      variations.forEach(email => {
        expect(email.toLowerCase()).toBe(SUPER_ADMIN_EMAIL.toLowerCase());
      });
    });
  });
});
