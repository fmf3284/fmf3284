import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// =============================================================================
// PASSWORD SECURITY
// =============================================================================

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Password strength requirements:
 * - At least 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 */
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{};\':"|,.<>/?)');
  }
  
  // Check for common weak passwords
  const commonPasswords = [
    'password', '12345678', 'qwerty123', 'abc12345', 'password1',
    'iloveyou', 'admin123', '123456789', 'welcome1', 'monkey123'
  ];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a stronger password');
  }
  
  // Calculate strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (errors.length === 0) {
    if (password.length >= 12 && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?].*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      strength = 'strong';
    } else {
      strength = 'medium';
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
}

// =============================================================================
// SESSION SECURITY
// =============================================================================

const SESSION_DURATION_MS = 60 * 60 * 1000; // 1 hour

// Use a stable secret in development, or generate one if SESSION_SECRET is not set
// IMPORTANT: In production, always set SESSION_SECRET in environment variables!
const getSessionSecret = () => {
  if (process.env.SESSION_SECRET) {
    return process.env.SESSION_SECRET;
  }
  // Stable default for development - DO NOT use in production!
  if (process.env.NODE_ENV !== 'production') {
    return 'findmyfitness-dev-secret-key-2024-do-not-use-in-production';
  }
  // Generate random secret for production (will cause issues on restart without proper SESSION_SECRET)
  console.warn('⚠️  SESSION_SECRET not set! Sessions will not persist across server restarts.');
  return crypto.randomBytes(32).toString('hex');
};

const SESSION_SECRET = getSessionSecret();

export interface SessionData {
  userId: string;
  email: string;
  role: string;
  createdAt: number;
  expiresAt: number;
  ipAddress: string;
  userAgent: string;
}

/**
 * Generate a secure session token
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a signed session token with expiration
 */
export function createSessionToken(userId: string, email: string, role: string, ipAddress: string, userAgent: string): string {
  const now = Date.now();
  const sessionData: SessionData = {
    userId,
    email,
    role,
    createdAt: now,
    expiresAt: now + SESSION_DURATION_MS,
    ipAddress: ipAddress.split(',')[0].trim().substring(0, 45), // Limit IP length
    userAgent: userAgent.substring(0, 200), // Limit user agent length
  };
  
  const dataStr = JSON.stringify(sessionData);
  const dataB64 = Buffer.from(dataStr).toString('base64');
  
  // Create HMAC signature
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(dataB64)
    .digest('hex');
  
  return `${dataB64}.${signature}`;
}

/**
 * Verify and decode a session token
 */
export function verifySessionToken(token: string): SessionData | null {
  try {
    const [dataB64, signature] = token.split('.');
    
    if (!dataB64 || !signature) {
      return null;
    }
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(dataB64)
      .digest('hex');
    
    // Timing-safe comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }
    
    // Decode data
    const dataStr = Buffer.from(dataB64, 'base64').toString('utf-8');
    const sessionData: SessionData = JSON.parse(dataStr);
    
    // Check expiration
    if (Date.now() > sessionData.expiresAt) {
      return null;
    }
    
    return sessionData;
  } catch {
    return null;
  }
}

/**
 * Get session duration in seconds (for cookie maxAge)
 */
export function getSessionDurationSeconds(): number {
  return SESSION_DURATION_MS / 1000;
}

// =============================================================================
// BRUTE FORCE PROTECTION
// =============================================================================

const loginAttempts = new Map<string, { count: number; lockedUntil: number | null; lastAttempt: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW_MS = 60 * 60 * 1000; // 1 hour window for counting attempts

export interface LoginAttemptResult {
  allowed: boolean;
  remainingAttempts: number;
  lockedUntil: Date | null;
  message?: string;
}

/**
 * Check if a login attempt is allowed (brute force protection)
 */
export function checkLoginAttempt(identifier: string): LoginAttemptResult {
  const now = Date.now();
  const key = identifier.toLowerCase();
  let entry = loginAttempts.get(key);
  
  // Clean up old entries periodically
  if (Math.random() < 0.01) {
    cleanupLoginAttempts();
  }
  
  // Create new entry if doesn't exist or expired
  if (!entry || now - entry.lastAttempt > ATTEMPT_WINDOW_MS) {
    entry = { count: 0, lockedUntil: null, lastAttempt: now };
    loginAttempts.set(key, entry);
  }
  
  // Check if currently locked out
  if (entry.lockedUntil && now < entry.lockedUntil) {
    const remainingLockout = Math.ceil((entry.lockedUntil - now) / 1000 / 60);
    return {
      allowed: false,
      remainingAttempts: 0,
      lockedUntil: new Date(entry.lockedUntil),
      message: `Account temporarily locked. Try again in ${remainingLockout} minutes.`,
    };
  }
  
  // Reset lockout if expired
  if (entry.lockedUntil && now >= entry.lockedUntil) {
    entry.count = 0;
    entry.lockedUntil = null;
  }
  
  const remainingAttempts = Math.max(0, MAX_LOGIN_ATTEMPTS - entry.count);
  
  return {
    allowed: true,
    remainingAttempts,
    lockedUntil: null,
  };
}

/**
 * Record a failed login attempt
 */
export function recordFailedLogin(identifier: string): LoginAttemptResult {
  const now = Date.now();
  const key = identifier.toLowerCase();
  let entry = loginAttempts.get(key);
  
  if (!entry) {
    entry = { count: 0, lockedUntil: null, lastAttempt: now };
    loginAttempts.set(key, entry);
  }
  
  entry.count++;
  entry.lastAttempt = now;
  
  // Lock account if too many attempts
  if (entry.count >= MAX_LOGIN_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_DURATION_MS;
    return {
      allowed: false,
      remainingAttempts: 0,
      lockedUntil: new Date(entry.lockedUntil),
      message: 'Too many failed login attempts. Account temporarily locked for 15 minutes.',
    };
  }
  
  const remainingAttempts = MAX_LOGIN_ATTEMPTS - entry.count;
  return {
    allowed: true,
    remainingAttempts,
    lockedUntil: null,
    message: `Invalid credentials. ${remainingAttempts} attempts remaining.`,
  };
}

/**
 * Clear login attempts on successful login
 */
export function clearLoginAttempts(identifier: string): void {
  loginAttempts.delete(identifier.toLowerCase());
}

/**
 * Clean up expired login attempt entries
 */
function cleanupLoginAttempts(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  loginAttempts.forEach((entry, key) => {
    if (now - entry.lastAttempt > ATTEMPT_WINDOW_MS && (!entry.lockedUntil || now > entry.lockedUntil)) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => loginAttempts.delete(key));
}

// =============================================================================
// INPUT SANITIZATION
// =============================================================================

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') return '';
  return email.toLowerCase().trim().substring(0, 254);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
}

// =============================================================================
// CSRF PROTECTION
// =============================================================================

const csrfTokens = new Map<string, { token: string; expiresAt: number }>();
const CSRF_TOKEN_DURATION_MS = 60 * 60 * 1000; // 1 hour

/**
 * Generate a CSRF token for a session
 */
export function generateCsrfToken(sessionId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + CSRF_TOKEN_DURATION_MS;
  
  csrfTokens.set(sessionId, { token, expiresAt });
  
  // Cleanup old tokens periodically
  if (Math.random() < 0.01) {
    cleanupCsrfTokens();
  }
  
  return token;
}

/**
 * Verify a CSRF token
 */
export function verifyCsrfToken(sessionId: string, token: string): boolean {
  const entry = csrfTokens.get(sessionId);
  
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    csrfTokens.delete(sessionId);
    return false;
  }
  
  // Timing-safe comparison
  try {
    return crypto.timingSafeEqual(Buffer.from(entry.token), Buffer.from(token));
  } catch {
    return false;
  }
}

function cleanupCsrfTokens(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  csrfTokens.forEach((entry, key) => {
    if (now > entry.expiresAt) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => csrfTokens.delete(key));
}

// =============================================================================
// SECURITY HEADERS
// =============================================================================

export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://maps.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://maps.googleapis.com https://ipapi.co; frame-ancestors 'none';",
};
