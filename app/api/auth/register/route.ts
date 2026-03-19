import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { rateLimit, rateLimitPresets } from '@/server/middleware/rateLimit';
import { EmailService } from '@/server/services/email.service';
import crypto from 'crypto';
import {
  hashPassword,
  validatePassword,
  createSessionToken,
  getSessionDurationSeconds,
  sanitizeEmail,
  sanitizeInput,
  isValidEmail,
  securityHeaders,
} from '@/server/utils/security';

const registerRateLimiter = rateLimit(rateLimitPresets.auth);

// Super Admin auto-verification
const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || process.env.SUPER_ADMIN_EMAIL || '';

export async function POST(request: NextRequest) {
  const rateLimitResponse = await registerRateLimiter(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json();
    const { email, password, full_name, name } = body;
    
    // Get IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Sanitize inputs
    const sanitizedEmail = sanitizeEmail(email || '');
    const userName = sanitizeInput(full_name || name || '').substring(0, 100);

    // Validate required fields
    if (!sanitizedEmail || !password || !userName) {
      return NextResponse.json(
        { error: 'All fields are required (email, password, name)' },
        { status: 400, headers: securityHeaders }
      );
    }

    // Validate email format
    if (!isValidEmail(sanitizedEmail)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400, headers: securityHeaders }
      );
    }

    // Validate name length
    if (userName.length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters long' },
        { status: 400, headers: securityHeaders }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'Password does not meet requirements',
          passwordErrors: passwordValidation.errors,
        },
        { status: 400, headers: securityHeaders }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
    });

    if (existingUser) {
      // Don't reveal that the email exists (prevents enumeration)
      return NextResponse.json(
        { error: 'Unable to create account. Please try again or use a different email.' },
        { status: 400, headers: securityHeaders }
      );
    }

    // Hash the password securely
    const hashedPassword = await hashPassword(password);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Check if this is the super admin email
    const isSuperAdmin = sanitizedEmail.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

    // Create user in database
    const newUser = await prisma.user.create({
      data: {
        email: sanitizedEmail,
        name: userName,
        password: hashedPassword,
        status: isSuperAdmin ? 'active' : 'pending', // Super admin is auto-activated
        role: isSuperAdmin ? 'admin' : 'user', // Super admin gets admin role
        emailVerified: isSuperAdmin, // Super admin is auto-verified
        verificationToken: isSuperAdmin ? null : verificationToken,
        verificationExpires: isSuperAdmin ? null : verificationExpires,
      },
      select: { id: true, email: true, name: true, role: true, status: true, emailVerified: true },
    });

    // Log registration activity
    try {
      await prisma.activityLog.create({
        data: {
          userId: newUser.id,
          action: 'register',
          details: JSON.stringify({ 
            method: 'email',
            isSuperAdmin,
          }),
          ipAddress: ipAddress.split(',')[0].trim(),
          userAgent: userAgent.substring(0, 500),
        },
      });
    } catch (e) {
      console.error('Failed to log registration:', e);
    }

    // For non-super-admin users, return pending status
    if (!isSuperAdmin) {
      // Generate verification URL
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
      
      // Send verification email
      try {
        const emailResult = await EmailService.sendVerificationEmail(
          sanitizedEmail,
          userName,
          verificationUrl
        );
        
        if (emailResult.success) {
          console.log('📧 Verification email sent to:', sanitizedEmail);
        } else {
          console.error('📧 Failed to send verification email:', emailResult.error);
        }
      } catch (emailError) {
        console.error('📧 Email service error:', emailError);
        // Don't fail registration if email fails - user can resend
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Registration successful! Please check your email to verify your account.',
          requiresVerification: true,
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
          },
          // Only include in development for testing
          ...(process.env.NODE_ENV !== 'production' && { 
            verificationUrl,
            verificationToken 
          }),
          redirect: '/verify-pending',
        },
        { status: 201, headers: securityHeaders }
      );
    }

    // Super admin gets logged in immediately
    const sessionToken = createSessionToken(
      newUser.id,
      newUser.email,
      newUser.role || 'admin',
      ipAddress,
      userAgent
    );

    const response = NextResponse.json(
      {
        success: true,
        message: 'Registration successful! Welcome, Super Admin.',
        user: newUser,
        redirect: '/admin',
      },
      { status: 201, headers: securityHeaders }
    );

    // Set secure session cookie - 1 HOUR EXPIRATION
    response.cookies.set('auth_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: getSessionDurationSeconds(), // 1 hour
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration. Please try again.' },
      { status: 500, headers: securityHeaders }
    );
  }
}
