import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { rateLimit, rateLimitPresets } from '@/server/middleware/rateLimit';
import {
  verifyPassword,
  createSessionToken,
  getSessionDurationSeconds,
  checkLoginAttempt,
  recordFailedLogin,
  clearLoginAttempts,
  sanitizeEmail,
  isValidEmail,
  securityHeaders,
} from '@/server/utils/security';

const loginRateLimiter = rateLimit(rateLimitPresets.auth);

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await loginRateLimiter(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json();
    const { email, password } = body;
    
    // Get IP and user agent for security
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Validate inputs
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400, headers: securityHeaders }
      );
    }

    // Sanitize email
    const sanitizedEmail = sanitizeEmail(email);
    
    if (!isValidEmail(sanitizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400, headers: securityHeaders }
      );
    }

    // Check brute force protection (by IP + email combination)
    const bruteForceKey = `${ipAddress.split(',')[0].trim()}_${sanitizedEmail}`;
    const attemptCheck = checkLoginAttempt(bruteForceKey);
    
    if (!attemptCheck.allowed) {
      // Log the lockout
      console.warn(`Login locked out: ${sanitizedEmail} from ${ipAddress}`);
      
      return NextResponse.json(
        { 
          error: attemptCheck.message,
          lockedUntil: attemptCheck.lockedUntil?.toISOString(),
        },
        { status: 429, headers: securityHeaders }
      );
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        password: true, 
        role: true,
        status: true, 
        loginCount: true,
        mustChangePassword: true 
      },
    });

    // Generic error message to prevent user enumeration
    const invalidCredentialsError = 'Invalid email or password';

    if (!user) {
      const failedAttempt = recordFailedLogin(bruteForceKey);
      return NextResponse.json(
        { 
          error: invalidCredentialsError,
          remainingAttempts: failedAttempt.remainingAttempts,
        },
        { status: 401, headers: securityHeaders }
      );
    }

    // Check if user is suspended
    if (user.status === 'suspended') {
      return NextResponse.json(
        { error: 'Your account has been suspended. Please contact support.' },
        { status: 403, headers: securityHeaders }
      );
    }

    // Check if user account is pending verification
    if (user.status === 'pending') {
      return NextResponse.json(
        { error: 'Please verify your email address before logging in.' },
        { status: 403, headers: securityHeaders }
      );
    }

    // Verify password
    let passwordValid = false;
    
    // Check if password is hashed (starts with $2a$ or $2b$ for bcrypt)
    if (user.password?.startsWith('$2')) {
      passwordValid = await verifyPassword(password, user.password);
    } else {
      // Legacy plain text password (for migration) - not recommended!
      passwordValid = user.password === password;
    }

    if (!passwordValid) {
      const failedAttempt = recordFailedLogin(bruteForceKey);
      
      // Log failed attempt
      try {
        await prisma.activityLog.create({
          data: {
            userId: user.id,
            action: 'login_failed',
            details: JSON.stringify({ reason: 'invalid_password' }),
            ipAddress: ipAddress.split(',')[0].trim(),
            userAgent: userAgent.substring(0, 500),
          },
        });
      } catch (e) {
        console.error('Failed to log failed login:', e);
      }
      
      return NextResponse.json(
        { 
          error: invalidCredentialsError,
          remainingAttempts: failedAttempt.remainingAttempts,
        },
        { status: 401, headers: securityHeaders }
      );
    }

    // Clear failed login attempts on success
    clearLoginAttempts(bruteForceKey);

    // Create secure session token
    const sessionToken = createSessionToken(
      user.id,
      user.email,
      user.role || 'user',
      ipAddress,
      userAgent
    );

    // Update user login stats and log activity
    const now = new Date();
    try {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: now,
            lastActiveAt: now,
            loginCount: (user.loginCount || 0) + 1,
          },
        }),
        prisma.activityLog.create({
          data: {
            userId: user.id,
            action: 'login',
            details: JSON.stringify({ method: 'password' }),
            ipAddress: ipAddress.split(',')[0].trim(),
            userAgent: userAgent.substring(0, 500),
          },
        }),
      ]);
    } catch (e) {
      console.error('Failed to update login stats:', e);
    }

    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name,
          role: user.role,
          mustChangePassword: user.mustChangePassword || false,
        },
        redirect: user.mustChangePassword ? '/change-password' : '/dashboard',
      },
      { status: 200, headers: securityHeaders }
    );

    // Set secure session cookie - 1 HOUR EXPIRATION
    response.cookies.set('auth_token', sessionToken, {
      httpOnly: true,                              // Prevents XSS access to cookie
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax',                             // CSRF protection
      maxAge: getSessionDurationSeconds(),         // 1 hour expiration
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500, headers: securityHeaders }
    );
  }
}
