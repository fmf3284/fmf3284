import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { hashPassword, securityHeaders } from '@/server/utils/security';
import crypto from 'crypto';

// Super Admin Configuration
const SUPER_ADMIN_EMAIL = 'moh.alneama@yahoo.com';

// Highly encrypted master code using SHA-512 + salt
// The actual code is "1954" but we store it encrypted
const MASTER_CODE_SALT = 'FindMyFitness_SuperAdmin_2024_SecureKey';
const ENCRYPTED_MASTER_CODE = crypto
  .createHash('sha512')
  .update('1954' + MASTER_CODE_SALT)
  .digest('hex');

/**
 * Verify the master code using secure comparison
 */
function verifyMasterCode(inputCode: string): boolean {
  const inputHash = crypto
    .createHash('sha512')
    .update(inputCode + MASTER_CODE_SALT)
    .digest('hex');
  
  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(inputHash),
      Buffer.from(ENCRYPTED_MASTER_CODE)
    );
  } catch {
    return false;
  }
}

/**
 * POST /api/auth/reset-password
 * Reset password for super admin using master code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, unlockCode, newPassword } = body;

    // Validate inputs
    if (!email || !unlockCode || !newPassword) {
      return NextResponse.json(
        { error: 'Email, master code, and new password are required' },
        { status: 400, headers: securityHeaders }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if this is the super admin email
    if (normalizedEmail !== SUPER_ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json(
        { error: 'This feature is only available for the Super Admin account' },
        { status: 403, headers: securityHeaders }
      );
    }

    // Verify the encrypted master code using secure comparison
    if (!verifyMasterCode(unlockCode)) {
      // Log failed attempt
      console.warn(`[SECURITY] Failed master code attempt for ${normalizedEmail} from ${request.headers.get('x-forwarded-for')}`);
      
      return NextResponse.json(
        { error: 'Invalid master code. Access denied.' },
        { status: 403, headers: securityHeaders }
      );
    }

    // Validate new password (minimum 4 chars for super admin)
    if (newPassword.length < 4) {
      return NextResponse.json(
        { error: 'Password must be at least 4 characters' },
        { status: 400, headers: securityHeaders }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Create the super admin user if they don't exist
      const hashedPassword = await hashPassword(newPassword);
      
      const newUser = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: 'Mo Alneama',
          password: hashedPassword,
          role: 'admin',
          status: 'active',
          emailVerified: true,
        },
      });

      // Log the creation
      try {
        const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';
        
        await prisma.activityLog.create({
          data: {
            userId: newUser.id,
            action: 'super_admin_created',
            details: JSON.stringify({ method: 'master_code_reset' }),
            ipAddress: ipAddress.split(',')[0].trim(),
            userAgent: userAgent.substring(0, 500),
          },
        });
      } catch (e) {
        console.error('Failed to log super admin creation:', e);
      }

      return NextResponse.json(
        { 
          success: true, 
          message: 'Super Admin account created with new password',
        },
        { status: 200, headers: securityHeaders }
      );
    }

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // Update the user's password and ensure they're active admin
    await prisma.user.update({
      where: { email: normalizedEmail },
      data: {
        password: hashedPassword,
        role: 'admin',
        status: 'active',
        emailVerified: true,
      },
    });

    // Log the password reset
    try {
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'super_admin_password_reset',
          details: JSON.stringify({ 
            method: 'master_code',
            timestamp: new Date().toISOString(),
          }),
          ipAddress: ipAddress.split(',')[0].trim(),
          userAgent: userAgent.substring(0, 500),
        },
      });
    } catch (e) {
      console.error('Failed to log password reset:', e);
    }

    console.log(`[SECURITY] Super Admin password reset successful for ${normalizedEmail}`);

    return NextResponse.json(
      { 
        success: true, 
        message: 'Password reset successfully',
      },
      { status: 200, headers: securityHeaders }
    );
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Password reset failed. Please try again.' },
      { status: 500, headers: securityHeaders }
    );
  }
}
