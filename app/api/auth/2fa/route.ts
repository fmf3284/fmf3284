import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { EmailService } from '@/server/services/email.service';
import { securityHeaders } from '@/server/utils/security';
import { rateLimit, rateLimitPresets } from '@/server/middleware/rateLimit';
import crypto from 'crypto';

const rateLimiter = rateLimit(rateLimitPresets.auth);
const OTP_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

function generateOTP(): string {
  return String(crypto.randomInt(100000, 999999));
}

/**
 * POST /api/auth/2fa
 * Send OTP to user email
 * Body: { email, purpose: 'login' | 'reset' }
 */
export async function POST(request: NextRequest) {
  const rl = await rateLimiter(request);
  if (rl) return rl;

  try {
    const { email, purpose } = await request.json();

    if (!email || !['login', 'reset'].includes(purpose)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400, headers: securityHeaders });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, email: true, name: true, status: true, deletedAt: true },
    });

    // Always return success to prevent enumeration
    if (!user || user.deletedAt) {
      return NextResponse.json({ success: true, message: 'If this email exists, a code has been sent.' }, { status: 200, headers: securityHeaders });
    }

    if (purpose === 'login' && user.status === 'suspended') {
      return NextResponse.json({ error: 'Your account has been suspended.' }, { status: 403, headers: securityHeaders });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + OTP_EXPIRY_MS);

    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: otp, otpExpires, otpPurpose: purpose },
    });

    const purposeLabel = purpose === 'login' ? 'sign in to' : 'reset your password on';

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#0f0f1a;margin:0;padding:40px 20px;">
        <div style="max-width:600px;margin:0 auto;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(139,92,246,0.3);">
          <div style="background:linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%);padding:36px 30px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:26px;font-weight:700;">🔐 Verification Code</h1>
          </div>
          <div style="padding:36px 30px;text-align:center;">
            <p style="color:#a0a0b0;font-size:16px;margin:0 0 8px;">Hi ${user.name || 'there'}, use this code to ${purposeLabel} Find My Fitness:</p>
            <div style="background:#0f0f1a;border:2px solid #8b5cf6;border-radius:12px;padding:28px;margin:24px 0;box-sizing:border-box;">
              <p style="color:#a0a0b0;font-size:12px;margin:0 0 10px;text-transform:uppercase;letter-spacing:2px;">Your Code</p>
              <p style="color:#ffffff;font-size:48px;font-weight:800;letter-spacing:12px;margin:0;font-family:monospace;">${otp}</p>
            </div>
            <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:14px 18px;">
              <p style="color:#f87171;font-size:14px;margin:0;">⏱️ This code expires in <strong>15 minutes</strong>. Do not share it with anyone.</p>
            </div>
            <p style="color:#606070;font-size:13px;margin:20px 0 0;">If you didn't request this, you can safely ignore this email.</p>
          </div>
          <div style="background-color:rgba(139,92,246,0.1);padding:18px 30px;text-align:center;border-top:1px solid rgba(139,92,246,0.2);">
            <p style="color:#606070;font-size:12px;margin:0;">© ${new Date().getFullYear()} Find My Fitness. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await EmailService.sendEmail({
      to: user.email,
      subject: `${otp} — Your Find My Fitness verification code`,
      html,
      text: `Your Find My Fitness verification code is: ${otp}\n\nThis code expires in 15 minutes. Do not share it with anyone.`,
    });

    return NextResponse.json({ success: true, message: 'Verification code sent to your email.' }, { status: 200, headers: securityHeaders });
  } catch (error) {
    console.error('2FA send error:', error);
    return NextResponse.json({ error: 'Failed to send code. Please try again.' }, { status: 500, headers: securityHeaders });
  }
}

/**
 * PUT /api/auth/2fa
 * Verify OTP (used for reset flow only)
 * Body: { email, otp, purpose: 'reset' }
 */
export async function PUT(request: NextRequest) {
  const rl = await rateLimiter(request);
  if (rl) return rl;

  try {
    const { email, otp, purpose } = await request.json();

    if (!email || !otp || !purpose) {
      return NextResponse.json({ error: 'Email, code, and purpose are required' }, { status: 400, headers: securityHeaders });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, email: true, otpCode: true, otpExpires: true, otpPurpose: true },
    });

    if (!user || !user.otpCode || !user.otpExpires) {
      return NextResponse.json({ error: 'No verification code found. Please request a new one.' }, { status: 400, headers: securityHeaders });
    }

    if (user.otpPurpose !== purpose) {
      return NextResponse.json({ error: 'Invalid code purpose.' }, { status: 400, headers: securityHeaders });
    }

    if (new Date() > user.otpExpires) {
      await prisma.user.update({ where: { id: user.id }, data: { otpCode: null, otpExpires: null, otpPurpose: null } });
      return NextResponse.json({ error: 'Code has expired. Please request a new one.' }, { status: 400, headers: securityHeaders });
    }

    let valid = false;
    try {
      valid = crypto.timingSafeEqual(Buffer.from(otp.trim().padEnd(6)), Buffer.from(user.otpCode.padEnd(6)));
    } catch { valid = false; }

    if (!valid) {
      return NextResponse.json({ error: 'Incorrect code. Please try again.' }, { status: 400, headers: securityHeaders });
    }

    await prisma.user.update({ where: { id: user.id }, data: { otpCode: null, otpExpires: null, otpPurpose: null } });

    return NextResponse.json({ success: true, verified: true }, { status: 200, headers: securityHeaders });
  } catch (error) {
    console.error('2FA verify error:', error);
    return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 500, headers: securityHeaders });
  }
}
