import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { EmailService } from '@/server/services/email.service';
import { createSessionToken, getSessionDurationSeconds, securityHeaders } from '@/server/utils/security';

/**
 * GET /api/auth/verify-email?token=xxx
 * Verify user email address
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400, headers: securityHeaders }
      );
    }

    // Find user with this verification token
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationExpires: {
          gt: new Date(), // Token not expired
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification link. Please request a new one.' },
        { status: 400, headers: securityHeaders }
      );
    }

    // Update user to verified
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        status: 'active',
        verificationToken: null,
        verificationExpires: null,
      },
      select: { id: true, email: true, name: true, role: true },
    });

    // Log verification activity
    try {
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      
      await prisma.activityLog.create({
        data: {
          userId: updatedUser.id,
          action: 'email_verified',
          details: JSON.stringify({ method: 'token' }),
          ipAddress: ipAddress.split(',')[0].trim(),
          userAgent: userAgent.substring(0, 500),
        },
      });
    } catch (e) {
      console.error('Failed to log email verification:', e);
    }

    // Send welcome email
    try {
      await EmailService.sendWelcomeEmail(updatedUser.email, updatedUser.name || 'there');
      console.log('📧 Welcome email sent to:', updatedUser.email);
    } catch (emailError) {
      console.error('📧 Failed to send welcome email:', emailError);
      // Don't fail verification if welcome email fails
    }

    // Create session token and log them in
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Don't auto-login - just return success
    const response = NextResponse.json(
      {
        success: true,
        message: 'Your email has been verified successfully! You can now log in to your account.',
        userName: updatedUser.name,
      },
      { status: 200, headers: securityHeaders }
    );

    return response;
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed. Please try again.' },
      { status: 500, headers: securityHeaders }
    );
  }
}

/**
 * POST /api/auth/verify-email
 * Resend verification email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400, headers: securityHeaders }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if user exists
      return NextResponse.json(
        { success: true, message: 'If this email exists, a verification link will be sent.' },
        { status: 200, headers: securityHeaders }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'This email is already verified. You can log in.' },
        { status: 400, headers: securityHeaders }
      );
    }

    // Generate new verification token
    const crypto = await import('crypto');
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationExpires,
      },
    });

    // Generate verification URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;

    // Send verification email
    try {
      const emailResult = await EmailService.sendVerificationEmail(
        user.email,
        user.name || 'there',
        verificationUrl
      );
      
      if (emailResult.success) {
        console.log('📧 Verification email resent to:', email);
      } else {
        console.error('📧 Failed to resend verification email:', emailResult.error);
      }
    } catch (emailError) {
      console.error('📧 Email service error:', emailError);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Verification email sent! Please check your inbox.',
        // Only include in development
        ...(process.env.NODE_ENV !== 'production' && { 
          verificationUrl,
          verificationToken 
        }),
      },
      { status: 200, headers: securityHeaders }
    );
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Failed to resend verification email.' },
      { status: 500, headers: securityHeaders }
    );
  }
}
