import { prisma } from '@/server/db/prisma';

export type ActivityAction =
  | 'login'
  | 'login_failed'
  | 'login_locked'
  | 'login_suspicious'
  | 'logout'
  | 'register'
  | 'email_verified'
  | 'password_reset_requested'
  | 'password_changed'
  | 'password_changed_after_reset'
  | '2fa_sent'
  | '2fa_failed'
  | 'view_location'
  | 'search'
  | 'profile_updated'
  | 'account_suspended'
  | 'account_unsuspended'
  | 'account_deleted'
  | 'role_changed'
  | 'admin_password_reset'
  | 'admin_action'
  | 'user_soft_deleted';

interface LogActivityParams {
  userId: string;
  action: ActivityAction;
  details?: Record<string, any>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

// Parse device, browser, OS from user agent string
function parseUA(ua: string) {
  if (!ua) return { device: 'unknown', browser: 'unknown', os: 'unknown' };
  const device = /mobile/i.test(ua) ? 'mobile' : /tablet|ipad/i.test(ua) ? 'tablet' : 'desktop';
  const browser =
    /edg\//i.test(ua)    ? 'Edge' :
    /chrome/i.test(ua)   ? 'Chrome' :
    /firefox/i.test(ua)  ? 'Firefox' :
    /safari/i.test(ua)   ? 'Safari' :
    /opera/i.test(ua)    ? 'Opera' : 'Other';
  const os =
    /windows/i.test(ua)          ? 'Windows' :
    /mac os x/i.test(ua)         ? 'macOS' :
    /android/i.test(ua)          ? 'Android' :
    /iphone|ipad|ipod/i.test(ua) ? 'iOS' :
    /linux/i.test(ua)            ? 'Linux' : 'Other';
  return { device, browser, os };
}

// Get geo location from IP — returns city, country etc
async function getGeo(ip: string) {
  if (!ip || ip === '0.0.0.0' || ip.startsWith('127.') || ip.startsWith('::1') || ip === 'unknown') {
    return { country: 'Local', countryCode: 'LO', region: 'Localhost', city: 'Localhost' };
  }
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { 'User-Agent': 'FindMyFitness/1.0' },
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error) return null;
    return {
      country: data.country_name || null,
      countryCode: data.country_code || null,
      region: data.region || null,
      city: data.city || null,
    };
  } catch {
    return null;
  }
}

export async function logActivity({
  userId,
  action,
  details,
  ipAddress,
  userAgent,
}: LogActivityParams) {
  try {
    const cleanIp = ipAddress?.split(',')[0].trim() || null;
    const ua = userAgent?.substring(0, 500) || '';
    const { device, browser, os } = parseUA(ua);

    // Fetch geo in parallel — don't wait if it fails
    const geo = cleanIp ? await getGeo(cleanIp).catch(() => null) : null;

    await prisma.activityLog.create({
      data: {
        userId,
        action,
        details: details ? JSON.stringify(details) : null,
        ipAddress: cleanIp,
        userAgent: ua,
        device,
        browser,
        os,
        country: geo?.country || null,
        countryCode: geo?.countryCode || null,
        city: geo?.city || null,
        region: geo?.region || null,
      },
    });
  } catch (e) {
    // Never throw — logging must never break the app
    console.error('Failed to log activity:', e);
  }
}

// Labels for display in admin logs
export const ACTION_META: Record<string, {
  label: string;
  icon: string;
  bg: string;
  text: string;
  severity: 'info' | 'warning' | 'danger' | 'success';
}> = {
  login:                    { label: 'Logged In',              icon: '✅', bg: 'bg-green-500/15',  text: 'text-green-400',  severity: 'success' },
  login_failed:             { label: 'Failed Login',           icon: '❌', bg: 'bg-red-500/15',    text: 'text-red-400',    severity: 'danger'  },
  login_locked:             { label: 'Account Locked',         icon: '🔒', bg: 'bg-red-500/20',    text: 'text-red-500',    severity: 'danger'  },
  login_suspicious:         { label: 'Suspicious Login',       icon: '⚠️', bg: 'bg-orange-500/15', text: 'text-orange-400', severity: 'warning' },
  logout:                   { label: 'Logged Out',             icon: '👋', bg: 'bg-gray-500/15',   text: 'text-gray-400',   severity: 'info'    },
  register:                 { label: 'Registered',             icon: '🎉', bg: 'bg-blue-500/15',   text: 'text-blue-400',   severity: 'success' },
  email_verified:           { label: 'Email Verified',         icon: '📧', bg: 'bg-blue-500/15',   text: 'text-blue-400',   severity: 'success' },
  password_reset_requested: { label: 'Password Reset Req.',    icon: '🔑', bg: 'bg-yellow-500/15', text: 'text-yellow-400', severity: 'warning' },
  password_changed:         { label: 'Password Changed',       icon: '🔐', bg: 'bg-yellow-500/15', text: 'text-yellow-400', severity: 'warning' },
  password_changed_after_reset: { label: 'Password Reset',     icon: '🔐', bg: 'bg-yellow-500/15', text: 'text-yellow-400', severity: 'warning' },
  '2fa_sent':               { label: '2FA Code Sent',          icon: '📱', bg: 'bg-blue-500/15',   text: 'text-blue-400',   severity: 'info'    },
  '2fa_failed':             { label: '2FA Failed',             icon: '⚠️', bg: 'bg-orange-500/15', text: 'text-orange-400', severity: 'warning' },
  view_location:            { label: 'Viewed Location',        icon: '📍', bg: 'bg-violet-500/15', text: 'text-violet-400', severity: 'info'    },
  search:                   { label: 'Searched',               icon: '🔍', bg: 'bg-violet-500/15', text: 'text-violet-400', severity: 'info'    },
  profile_updated:          { label: 'Profile Updated',        icon: '✏️', bg: 'bg-violet-500/15', text: 'text-violet-400', severity: 'info'    },
  account_suspended:        { label: 'Account Suspended',      icon: '🚫', bg: 'bg-red-500/20',    text: 'text-red-500',    severity: 'danger'  },
  account_unsuspended:      { label: 'Account Restored',       icon: '✅', bg: 'bg-green-500/15',  text: 'text-green-400',  severity: 'success' },
  account_deleted:          { label: 'Account Deleted',        icon: '🗑️', bg: 'bg-red-500/20',    text: 'text-red-500',    severity: 'danger'  },
  role_changed:             { label: 'Role Changed',           icon: '👑', bg: 'bg-violet-500/15', text: 'text-violet-400', severity: 'warning' },
  admin_password_reset:     { label: 'Admin PW Reset',         icon: '🔑', bg: 'bg-orange-500/15', text: 'text-orange-400', severity: 'warning' },
  admin_action:             { label: 'Admin Action',           icon: '⚡', bg: 'bg-violet-500/15', text: 'text-violet-400', severity: 'info'    },
  user_soft_deleted:        { label: 'User Deleted',           icon: '🗑️', bg: 'bg-red-500/20',    text: 'text-red-500',    severity: 'danger'  },
};
