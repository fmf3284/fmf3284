import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { hashPassword, securityHeaders } from '@/server/utils/security';
import { EmailService } from '@/server/services/email.service';
import { rateLimit, rateLimitPresets } from '@/server/middleware/rateLimit';
import crypto from 'crypto';

const resetRateLimiter = rateLimit(rateLimitPresets.auth);

function generateTempPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '#@!$';
  const getRand = (str: string) => str[crypto.randomInt(str.length)];
  const password = [
    getRand(upper), getRand(upper),
    getRand(lower), getRand(lower),
    getRand(digits), getRand(digits),
    getRand(special), getRand(lower),
    getRand(upper), getRand(digits),
  ];
  for (let i = password.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [password[i], password[j]] = [password[j], password[i]];
  }
  return password.join('');
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = await resetRateLimiter(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400, headers: securityHeaders });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // Always return success to prevent email enumeration
    if (!user || user.deletedAt) {
      return NextResponse.json(
        { success: true, message: 'If this email exists, a temporary password has been sent.' },
        { status: 200, headers: securityHeaders }
      );
    }

    const tempPassword = generateTempPassword();
    const hashedTemp = await hashPassword(tempPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedTemp, mustChangePassword: true },
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f0f1a; margin: 0; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(139, 92, 246, 0.3);">
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">🔐 Password Reset</h1>
          </div>
          <div style="padding: 40px 30px;">
            <h2 style="color: #ffffff; margin: 0 0 16px; font-size: 22px;">Hi ${user.name || 'there'},</h2>
            <p style="color: #a0a0b0; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
              We received a request to reset your password. Here is your temporary password:
            </p>
            <div style="background: #0f0f1a; border: 2px solid #8b5cf6; border-radius: 10px; padding: 20px; text-align: center; margin: 0 0 24px;">
              <p style="color: #a0a0b0; font-size: 13px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Temporary Password</p>
              <p style="color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: 4px; margin: 0; font-family: monospace;">${tempPassword}</p>
            </div>
            <p style="color: #a0a0b0; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
              Use this to log in. <strong style="color: #ffffff;">You will be required to set a new password immediately after logging in.</strong>
            </p>
            <div style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; padding: 16px; margin: 0 0 24px;">
              <p style="color: #f87171; font-size: 14px; margin: 0;">⚠️ If you did not request this, please ignore this email.</p>
            </div>
            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.findmyfitness.fit'}/login"
                 style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Log In Now →
              </a>
            </div>
          </div>
          <div style="background-color: rgba(139,92,246,0.1); padding: 20px 30px; text-align: center; border-top: 1px solid rgba(139,92,246,0.2);">
            <p style="color: #606070; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Find My Fitness. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await EmailService.sendEmail({
      to: normalizedEmail,
      subject: '🔐 Your temporary password — Find My Fitness',
      html,
      text: `Hi ${user.name || 'there'},\n\nYour temporary password is: ${tempPassword}\n\nLog in and you will be prompted to set a new password immediately.\n\nIf you did not request this, please ignore this email.`,
    });

    try {
      const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'password_reset_requested',
          details: JSON.stringify({ method: 'temp_password_email' }),
          ipAddress: ipAddress.split(',')[0].trim(),
          userAgent: (request.headers.get('user-agent') || '').substring(0, 500),
        },
      });
    } catch (e) { console.error('Failed to log reset:', e); }

    return NextResponse.json(
      { success: true, message: 'If this email exists, a temporary password has been sent.' },
      { status: 200, headers: securityHeaders }
    );
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json({ error: 'Password reset failed. Please try again.' }, { status: 500, headers: securityHeaders });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { newPassword, confirmPassword, userId } = body;

    if (!newPassword || !confirmPassword || !userId) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400, headers: securityHeaders });
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400, headers: securityHeaders });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400, headers: securityHeaders });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.mustChangePassword) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400, headers: securityHeaders });
    }

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword, mustChangePassword: false },
    });

    try {
      const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'password_changed_after_reset',
          details: JSON.stringify({ method: 'forced_change' }),
          ipAddress: ipAddress.split(',')[0].trim(),
          userAgent: (request.headers.get('user-agent') || '').substring(0, 500),
        },
      });
    } catch (e) { console.error('Failed to log change:', e); }

    return NextResponse.json(
      { success: true, message: 'Password updated successfully! You can now use your new password.' },
      { status: 200, headers: securityHeaders }
    );
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json({ error: 'Failed to update password. Please try again.' }, { status: 500, headers: securityHeaders });
  }
}
