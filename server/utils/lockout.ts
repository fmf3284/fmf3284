/**
 * Database-backed progressive lockout system
 * Persists across server restarts and multiple instances
 *
 * Progressive tiers:
 *  3 failed  → locked  5 minutes
 *  5 failed  → locked 30 minutes
 * 10 failed  → locked 24 hours  + security email
 * 20+ failed → locked permanently (admin must unlock)
 */

import { prisma } from '@/server/db/prisma';
import { EmailService } from '@/server/services/email.service';

export interface LockoutResult {
  allowed: boolean;
  remainingAttempts: number;
  lockedUntil: Date | null;
  isPermanent: boolean;
  message?: string;
}

const TIERS = [
  { threshold: 3,  durationMs: 5  * 60 * 1000,        label: '5 minutes' },
  { threshold: 5,  durationMs: 30 * 60 * 1000,         label: '30 minutes' },
  { threshold: 10, durationMs: 24 * 60 * 60 * 1000,    label: '24 hours' },
  { threshold: 20, durationMs: 365 * 24 * 60 * 60 * 1000, label: 'permanently' }, // 1 year = permanent
];

function getLockoutDuration(failedCount: number): { ms: number; label: string } | null {
  // Find highest tier exceeded
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (failedCount >= TIERS[i].threshold) {
      return { ms: TIERS[i].durationMs, label: TIERS[i].label };
    }
  }
  return null;
}

function getNextThreshold(failedCount: number): number {
  for (const tier of TIERS) {
    if (failedCount < tier.threshold) return tier.threshold;
  }
  return TIERS[TIERS.length - 1].threshold;
}

/**
 * Check if login is allowed for this user
 */
export async function checkDbLockout(email: string): Promise<LockoutResult> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true, failedLoginCount: true, lockedUntil: true },
  });

  if (!user) {
    // User doesn't exist — still allow attempt (will fail at password check)
    return { allowed: true, remainingAttempts: TIERS[0].threshold, lockedUntil: null, isPermanent: false };
  }

  const now = new Date();

  if (user.lockedUntil && user.lockedUntil > now) {
    const isPermanent = user.failedLoginCount >= TIERS[TIERS.length - 1].threshold;
    const remainingMs = user.lockedUntil.getTime() - now.getTime();
    const remainingMins = Math.ceil(remainingMs / 1000 / 60);
    const remainingHours = Math.ceil(remainingMs / 1000 / 60 / 60);

    let timeMsg = remainingMins < 60
      ? `${remainingMins} minute${remainingMins !== 1 ? 's' : ''}`
      : `${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`;

    return {
      allowed: false,
      remainingAttempts: 0,
      lockedUntil: user.lockedUntil,
      isPermanent,
      message: isPermanent
        ? 'Your account has been permanently locked due to too many failed attempts. Please contact support@findmyfitness.fit.'
        : `Account locked. Try again in ${timeMsg}.`,
    };
  }

  // Not locked — calculate remaining attempts before next lockout
  const nextThreshold = getNextThreshold(user.failedLoginCount);
  const remaining = nextThreshold - user.failedLoginCount;

  return {
    allowed: true,
    remainingAttempts: remaining,
    lockedUntil: null,
    isPermanent: false,
  };
}

/**
 * Record a failed login attempt — applies progressive lockout
 */
export async function recordDbFailedLogin(
  email: string,
  ipAddress: string,
  userName?: string
): Promise<LockoutResult> {
  const lowerEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: lowerEmail },
    select: { id: true, failedLoginCount: true, lockNotifiedAt: true, name: true },
  });

  if (!user) {
    return { allowed: true, remainingAttempts: TIERS[0].threshold - 1, lockedUntil: null, isPermanent: false };
  }

  const newCount = (user.failedLoginCount || 0) + 1;
  const lockout = getLockoutDuration(newCount);
  const now = new Date();

  const updateData: any = {
    failedLoginCount: newCount,
    lastFailedLoginAt: now,
  };

  if (lockout) {
    updateData.lockedUntil = new Date(now.getTime() + lockout.ms);
  }

  await prisma.user.update({ where: { id: user.id }, data: updateData });

  // Log to activity
  try {
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'login_failed',
        details: JSON.stringify({
          reason: 'invalid_password',
          failedCount: newCount,
          ipAddress,
          locked: !!lockout,
          lockDuration: lockout?.label,
        }),
        ipAddress: ipAddress.split(',')[0].trim(),
        userAgent: '',
      },
    });
  } catch (e) { /* non-blocking */ }

  // Send security email on significant lockouts (10+ attempts) — once per lockout
  if (newCount >= 10 && lockout) {
    const shouldNotify = !user.lockNotifiedAt ||
      now.getTime() - user.lockNotifiedAt.getTime() > 60 * 60 * 1000; // max 1 email/hour

    if (shouldNotify) {
      try {
        await prisma.user.update({ where: { id: user.id }, data: { lockNotifiedAt: now } });

        const isPermanent = newCount >= TIERS[TIERS.length - 1].threshold;
        const html = `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="font-family:-apple-system,sans-serif;background:#0f0f1a;margin:0;padding:40px 20px;">
            <div style="max-width:560px;margin:0 auto;background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(239,68,68,0.2);">
              <div style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:32px 30px;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">🚨 Security Alert</h1>
              </div>
              <div style="padding:32px 30px;">
                <h2 style="color:#fff;margin:0 0 16px;">Hi ${user.name || 'there'},</h2>
                <p style="color:#a0a0b0;font-size:15px;line-height:1.6;margin:0 0 20px;">
                  We detected <strong style="color:#f87171;">${newCount} failed login attempts</strong> on your Find My Fitness account.
                </p>
                <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:10px;padding:16px 20px;margin:0 0 20px;">
                  <p style="color:#fca5a5;margin:0 0 8px;font-size:14px;">📍 Last attempt from IP: <strong>${ipAddress.split(',')[0].trim()}</strong></p>
                  <p style="color:#fca5a5;margin:0 0 8px;font-size:14px;">🕐 Time: <strong>${now.toUTCString()}</strong></p>
                  <p style="color:#fca5a5;margin:0;font-size:14px;">🔒 Account locked: <strong>${isPermanent ? 'Permanently' : lockout.label}</strong></p>
                </div>
                ${isPermanent
                  ? `<p style="color:#a0a0b0;font-size:14px;line-height:1.6;margin:0 0 20px;">Your account has been <strong style="color:#f87171;">permanently locked</strong>. Contact <a href="mailto:support@findmyfitness.fit" style="color:#8b5cf6;">support@findmyfitness.fit</a> to unlock it.</p>`
                  : `<p style="color:#a0a0b0;font-size:14px;line-height:1.6;margin:0 0 20px;">Your account is temporarily locked. If this was you, simply wait and try again. If not, <strong style="color:#fff;">reset your password immediately.</strong></p>`
                }
                <div style="text-align:center;">
                  <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.findmyfitness.fit'}/login"
                     style="display:inline-block;background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;">
                    Reset My Password
                  </a>
                </div>
              </div>
              <div style="background:rgba(139,92,246,0.08);padding:16px 30px;text-align:center;border-top:1px solid rgba(139,92,246,0.2);">
                <p style="color:#606070;font-size:12px;margin:0;">© ${new Date().getFullYear()} Find My Fitness · If you need help, contact support@findmyfitness.fit</p>
              </div>
            </div>
          </body>
          </html>
        `;

        await EmailService.sendEmail({
          to: lowerEmail,
          subject: `🚨 Security Alert: ${newCount} failed login attempts on your account`,
          html,
          text: `Security Alert: ${newCount} failed login attempts detected on your Find My Fitness account from IP ${ipAddress}. Your account has been locked for ${lockout.label}. If this wasn't you, reset your password immediately.`,
        });

        // Also notify admin for permanent lockouts
        if (isPermanent) {
          await EmailService.sendEmail({
            to: process.env.EMAIL_FROM || 'support@findmyfitness.fit',
            subject: `⚠️ Admin Alert: Account permanently locked — ${lowerEmail}`,
            html: `<p>Account <strong>${lowerEmail}</strong> has been permanently locked after ${newCount} failed login attempts from IP <strong>${ipAddress}</strong>.</p><p>Admin action required to unlock.</p>`,
            text: `Account ${lowerEmail} permanently locked after ${newCount} failed attempts from ${ipAddress}. Admin must unlock.`,
          });
        }
      } catch (emailErr) {
        console.error('Failed to send lockout email:', emailErr);
      }
    }
  }

  const isPermanent = newCount >= TIERS[TIERS.length - 1].threshold;

  if (lockout) {
    return {
      allowed: false,
      remainingAttempts: 0,
      lockedUntil: updateData.lockedUntil,
      isPermanent,
      message: isPermanent
        ? 'Account permanently locked. Please contact support@findmyfitness.fit.'
        : `Too many failed attempts. Account locked for ${lockout.label}.`,
    };
  }

  const nextThreshold = getNextThreshold(newCount);
  return {
    allowed: true,
    remainingAttempts: nextThreshold - newCount,
    lockedUntil: null,
    isPermanent: false,
  };
}

/**
 * Clear lockout on successful login
 */
export async function clearDbLockout(email: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { email: email.toLowerCase().trim() },
      data: { failedLoginCount: 0, lockedUntil: null, lastFailedLoginAt: null },
    });
  } catch (e) { /* non-blocking */ }
}

/**
 * Admin unlock — clears all lockout data for a user
 */
export async function adminUnlockUser(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginCount: 0, lockedUntil: null, lastFailedLoginAt: null, lockNotifiedAt: null },
  });
}
