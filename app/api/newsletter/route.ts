import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/server/services/email.service';
import { rateLimit, rateLimitPresets } from '@/server/middleware/rateLimit';
import { securityHeaders, isValidEmail, sanitizeEmail } from '@/server/utils/security';

const rateLimiter = rateLimit(rateLimitPresets.auth);

export async function POST(request: NextRequest) {
  const rl = await rateLimiter(request);
  if (rl) return rl;

  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400, headers: securityHeaders });
    }

    const sanitized = sanitizeEmail(email);
    if (!isValidEmail(sanitized)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400, headers: securityHeaders });
    }

    // Send confirmation to subscriber
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0f0f1a;margin:0;padding:40px 20px;">
        <div style="max-width:560px;margin:0 auto;background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(139,92,246,0.3);">
          <div style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);padding:32px 30px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:26px;font-weight:700;">🏋️ You're In!</h1>
          </div>
          <div style="padding:32px 30px;text-align:center;">
            <p style="color:#a0a0b0;font-size:16px;line-height:1.6;margin:0 0 20px;">
              Thanks for subscribing to <strong style="color:#fff;">Find My Fitness</strong>! You'll be the first to know about:
            </p>
            <div style="text-align:left;background:rgba(139,92,246,0.08);border-radius:10px;padding:20px;margin:0 0 24px;">
              <p style="color:#c4b5fd;margin:0 0 10px;">💪 Expert fitness tips & workout guides</p>
              <p style="color:#c4b5fd;margin:0 0 10px;">🎁 Exclusive deals & discounts on gyms</p>
              <p style="color:#c4b5fd;margin:0 0 10px;">📍 New fitness locations in your area</p>
              <p style="color:#c4b5fd;margin:0;">🏆 Member success stories & inspiration</p>
            </div>
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.findmyfitness.fit'}/locations"
               style="display:inline-block;background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px;">
              Find Fitness Near You →
            </a>
          </div>
          <div style="background:rgba(139,92,246,0.08);padding:16px 30px;text-align:center;border-top:1px solid rgba(139,92,246,0.2);">
            <p style="color:#606070;font-size:12px;margin:0;">© ${new Date().getFullYear()} Find My Fitness · <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.findmyfitness.fit'}/privacy" style="color:#8b5cf6;">Unsubscribe</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    await EmailService.sendEmail({
      to: sanitized,
      subject: '🏋️ Welcome to Find My Fitness newsletter!',
      html,
      text: `Thanks for subscribing to Find My Fitness! You'll receive fitness tips, exclusive deals, and updates about new locations near you.`,
    });

    // Also notify admin
    await EmailService.sendEmail({
      to: process.env.EMAIL_FROM || 'support@findmyfitness.fit',
      subject: `New newsletter subscriber: ${sanitized}`,
      html: `<p>New subscriber: <strong>${sanitized}</strong></p>`,
      text: `New newsletter subscriber: ${sanitized}`,
    });

    return NextResponse.json({ success: true, message: 'You\'re subscribed! Check your inbox.' }, { status: 200, headers: securityHeaders });
  } catch (error) {
    console.error('Newsletter error:', error);
    return NextResponse.json({ error: 'Failed to subscribe. Please try again.' }, { status: 500, headers: securityHeaders });
  }
}
