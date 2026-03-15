import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { rateLimit, rateLimitPresets } from '@/server/middleware/rateLimit';
import { EmailService } from '@/server/services/email.service';
import crypto from 'crypto';
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

    // Password correct — send 2FA OTP before creating session
    const otp = String(crypto.randomInt(100000, 999999));
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: otp, otpExpires, otpPurpose: 'login' },
    });

    try {
      await EmailService.sendEmail({
        to: user.email,
        subject: `${otp} — Your Find My Fitness verification code`,
        html: `<div style="font-family:sans-serif;background:#0f0f1a;padding:40px 20px;"><div style="max-width:500px;margin:0 auto;background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:16px;overflow:hidden;"><div style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);padding:30px;text-align:center;"><h1 style="color:#fff;margin:0;font-size:24px;">🔐 Verification Code</h1></div><div style="padding:30px;text-align:center;"><p style="color:#a0a0b0;margin:0 0 20px;">Hi ${user.name || 'there'}, your sign-in code is:</p><div style="background:#0f0f1a;border:2px solid #8b5cf6;border-radius:12px;padding:24px;margin:0 0 20px;"><p style="color:#fff;font-size:44px;font-weight:800;letter-spacing:10px;margin:0;font-family:monospace;">${otp}</p></div><p style="color:#f87171;font-size:14px;margin:0;">⏱️ Expires in <strong>15 minutes</strong>. Never share this code.</p></div><div style="background:rgba(139,92,246,0.1);padding:16px;text-align:center;border-top:1px solid rgba(139,92,246,0.2);"><p style="color:#606070;font-size:12px;margin:0;">© ${new Date().getFullYear()} Find My Fitness</p></div></div></div>`,
        text: `Your Find My Fitness verification code is: ${otp}

Expires in 15 minutes. Do not share it.`,
      });
    } catch (emailError) {
      console.error('Failed to send 2FA OTP:', emailError);
    }

    return NextResponse.json(
      {
        success: true,
        requires2FA: true,
        email: user.email,
        message: 'Verification code sent to your email.',
      },
      { status: 200, headers: securityHeaders }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500, headers: securityHeaders }
    );
  }
}
