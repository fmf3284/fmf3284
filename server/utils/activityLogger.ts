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
  | 'profile_updated'
  | 'account_suspended'
  | 'account_unsuspended'
  | 'account_deleted'
  | 'role_changed'
  | 'admin_password_reset'
  | 'admin_action';

interface LogActivityParams {
  userId: string;
  action: ActivityAction;
  details?: Record<string, any>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function logActivity({
  userId,
  action,
  details,
  ipAddress,
  userAgent,
}: LogActivityParams) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        details: details ? JSON.stringify(details) : null,
        ipAddress: ipAddress?.split(',')[0].trim() || null,
        userAgent: userAgent?.substring(0, 500) || null,
      },
    });
  } catch (e) {
    // Never throw — logging should never break the app
    console.error('Failed to log activity:', e);
  }
}

// Action labels for display
export const ACTION_LABELS: Record<string, { label: string; icon: string; color: string; severity: 'info' | 'warning' | 'danger' | 'success' }> = {
  login:                    { label: 'Logged In',               icon: '✅', color: 'text-green-400',  severity: 'success' },
  login_failed:             { label: 'Failed Login',            icon: '❌', color: 'text-red-400',    severity: 'danger' },
  login_locked:             { label: 'Account Locked',          icon: '🔒', color: 'text-red-500',    severity: 'danger' },
  login_suspicious:         { label: 'Suspicious Login',        icon: '⚠️', color: 'text-orange-400', severity: 'warning' },
  logout:                   { label: 'Logged Out',              icon: '👋', color: 'text-gray-400',   severity: 'info' },
  register:                 { label: 'Registered',              icon: '🎉', color: 'text-blue-400',   severity: 'success' },
  email_verified:           { label: 'Email Verified',          icon: '📧', color: 'text-blue-400',   severity: 'success' },
  password_reset_requested: { label: 'Password Reset Requested',icon: '🔑', color: 'text-yellow-400', severity: 'warning' },
  password_changed:         { label: 'Password Changed',        icon: '🔐', color: 'text-yellow-400', severity: 'warning' },
  password_changed_after_reset: { label: 'Password Reset',      icon: '🔐', color: 'text-yellow-400', severity: 'warning' },
  '2fa_sent':               { label: '2FA Code Sent',           icon: '📱', color: 'text-blue-400',   severity: 'info' },
  '2fa_failed':             { label: '2FA Failed',              icon: '⚠️', color: 'text-orange-400', severity: 'warning' },
  profile_updated:          { label: 'Profile Updated',         icon: '✏️', color: 'text-violet-400', severity: 'info' },
  account_suspended:        { label: 'Account Suspended',       icon: '🚫', color: 'text-red-500',    severity: 'danger' },
  account_unsuspended:      { label: 'Account Restored',        icon: '✅', color: 'text-green-400',  severity: 'success' },
  account_deleted:          { label: 'Account Deleted',         icon: '🗑️', color: 'text-red-500',    severity: 'danger' },
  role_changed:             { label: 'Role Changed',            icon: '👑', color: 'text-violet-400', severity: 'warning' },
  admin_password_reset:     { label: 'Admin Password Reset',    icon: '🔑', color: 'text-orange-400', severity: 'warning' },
  admin_action:             { label: 'Admin Action',            icon: '⚡', color: 'text-violet-400', severity: 'info' },
};
