import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { logActivity } from '@/server/utils/activityLogger';
import { getRequestUser } from '@/server/auth/session';
import { hashPassword } from '@/server/utils/security';
import { EmailService } from '@/server/services/email.service';
import crypto from 'crypto';

// Super admin email — only used to protect account from other admins
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'moh.alneama@yahoo.com';

function isSuperAdminEmail(email: string | null | undefined): boolean {
  return email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

function isCurrentUserSuperAdmin(user: any): boolean {
  return isSuperAdminEmail(user?.email);
}

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

/**
 * GET /api/admin/users/:id
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const currentUser = await getRequestUser(request);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, role: true,
        status: true, phone: true, createdAt: true, updatedAt: true,
        _count: { select: { reviews: true } },
      },
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ user });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/users/:id
 * 
 * Permission rules:
 * - Super Admin can modify anyone
 * - Regular Admin CANNOT touch Super Admin
 * - Password reset: sends temp password by email for ALL users including super admin
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const currentUser = await getRequestUser(request);

    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (currentUser.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const body = await request.json();
    const { action, role, status, name, email, phone, resetPassword } = body;

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, status: true },
    });

    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const targetIsSuperAdmin = isSuperAdminEmail(targetUser.email);
    const currentIsSuperAdmin = isCurrentUserSuperAdmin(currentUser);

    // Regular admin cannot touch super admin at all
    if (targetIsSuperAdmin && !currentIsSuperAdmin) {
      return NextResponse.json({
        error: '🔒 ACCESS DENIED: Only Super Admin can modify the Super Admin account.',
        protected: true,
      }, { status: 403 });
    }

    // Super admin cannot be suspended
    if (targetIsSuperAdmin && (action === 'suspend' || status === 'suspended')) {
      return NextResponse.json({
        error: '🔒 Super Admin cannot be suspended.',
        protected: true,
      }, { status: 403 });
    }

    // Super admin role cannot be changed
    if (targetIsSuperAdmin && role && role !== 'admin') {
      return NextResponse.json({
        error: '🔒 Super Admin role cannot be changed.',
        protected: true,
      }, { status: 403 });
    }

    // ── RESET PASSWORD ──────────────────────────────────────────────────────
    // Works the same for ALL users including super admin: sends temp password by email
    if (action === 'resetPassword' || resetPassword) {
      const tempPassword = generateTempPassword();
      const hashedPassword = await hashPassword(tempPassword);

      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword, mustChangePassword: true },
      });

      // Send temp password by email
      const html = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f0f1a; margin: 0; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(139, 92, 246, 0.3);">
            <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 32px 30px; text-align: center;">
              <h1 style="color: #fff; margin: 0; font-size: 26px; font-weight: 700;">🔐 Password Reset by Admin</h1>
            </div>
            <div style="padding: 36px 30px;">
              <h2 style="color: #fff; margin: 0 0 16px;">Hi ${targetUser.name || 'there'},</h2>
              <p style="color: #a0a0b0; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                An admin has reset your password. Here is your temporary password:
              </p>
              <div style="background: #0f0f1a; border: 2px solid #8b5cf6; border-radius: 10px; padding: 20px; text-align: center; margin: 0 0 24px;">
                <p style="color: #a0a0b0; font-size: 12px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Temporary Password</p>
                <p style="color: #fff; font-size: 26px; font-weight: 700; letter-spacing: 4px; margin: 0; font-family: monospace;">${tempPassword}</p>
              </div>
              <p style="color: #a0a0b0; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                Use this to log in. <strong style="color: #fff;">You will be required to set a new password immediately after logging in.</strong>
              </p>
              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.findmyfitness.fit'}/login"
                   style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #fff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-weight: 600; font-size: 15px;">
                  Log In Now →
                </a>
              </div>
            </div>
            <div style="background-color: rgba(139,92,246,0.1); padding: 18px 30px; text-align: center; border-top: 1px solid rgba(139,92,246,0.2);">
              <p style="color: #606070; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Find My Fitness. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        await EmailService.sendEmail({
          to: targetUser.email,
          subject: '🔐 Your password has been reset — Find My Fitness',
          html,
          text: `Hi ${targetUser.name || 'there'},\n\nAn admin reset your password.\n\nTemporary password: ${tempPassword}\n\nLog in and you will be asked to set a new password immediately.`,
        });
      } catch (emailError) {
        console.error('Failed to send reset email:', emailError);
      }

      try {
        await prisma.activityLog.create({
          data: {
            userId: currentUser.id,
            action: 'admin_password_reset',
            details: JSON.stringify({ targetUserId: userId, targetEmail: targetUser.email, resetBy: currentUser.email }),
            ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown',
            userAgent: request.headers.get('user-agent')?.substring(0, 500) || 'unknown',
          },
        });
      } catch (e) { console.error('Failed to log reset:', e); }

      return NextResponse.json({
        success: true,
        message: `Temporary password sent to ${targetUser.email}. They will be required to set a new password on next login.`,
      });
    }

    // ── SUSPEND ─────────────────────────────────────────────────────────────
    if (action === 'suspend') {
      if (currentUser.id === userId) return NextResponse.json({ error: 'Cannot suspend your own account' }, { status: 400 });
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { status: 'suspended' },
        select: { id: true, email: true, name: true, status: true },
      });
      return NextResponse.json({ success: true, message: `${updatedUser.name || updatedUser.email} has been suspended`, user: updatedUser });
    }

    // ── ACTIVATE ────────────────────────────────────────────────────────────
    if (action === 'activate') {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { status: 'active' },
        select: { id: true, email: true, name: true, status: true },
      });
      return NextResponse.json({ success: true, message: `${updatedUser.name || updatedUser.email} has been activated`, user: updatedUser });
    }

    // ── RESTORE DELETED USER ─────────────────────────────────────────────────
    if (action === 'restore') {
      const deletedUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { deletedAt: true, email: true, name: true },
      });
      if (!deletedUser?.deletedAt) return NextResponse.json({ error: 'This user is not deleted.' }, { status: 400 });
      const daysSinceDeleted = Math.floor((Date.now() - new Date(deletedUser.deletedAt).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceDeleted > 90) return NextResponse.json({ error: 'Cannot restore. The 90-day retention period has expired.' }, { status: 400 });

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { deletedAt: null, deletedBy: null, status: 'active' },
        select: { id: true, email: true, name: true, status: true },
      });
      return NextResponse.json({ success: true, message: `${updatedUser.name || updatedUser.email} has been restored`, user: updatedUser });
    }

    // ── OVERRIDE VERIFICATION (Super Admin only) ─────────────────────────────
    if (action === 'overrideVerification') {
      if (!isCurrentUserSuperAdmin(currentUser)) {
        return NextResponse.json({ error: '🔒 Only Super Admin can override email verification.', protected: true }, { status: 403 });
      }
      const fullUser = await prisma.user.findUnique({ where: { id: userId }, select: { emailVerified: true, email: true, name: true } });
      if (!fullUser) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
      if (fullUser.emailVerified) return NextResponse.json({ error: 'This user is already verified.' }, { status: 400 });

      await prisma.user.update({
        where: { id: userId },
        data: { emailVerified: true, verificationToken: null, verificationExpires: null, status: 'active' },
      });
      return NextResponse.json({ success: true, message: `✅ Email verification overridden for ${fullUser.name || fullUser.email}.` });
    }

    // ── RESEND VERIFICATION EMAIL ────────────────────────────────────────────
    if (action === 'resendVerification') {
      const fullUser = await prisma.user.findUnique({ where: { id: userId }, select: { emailVerified: true, email: true, name: true } });
      if (!fullUser) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
      if (fullUser.emailVerified) return NextResponse.json({ error: 'This user is already verified.' }, { status: 400 });

      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);
      await prisma.user.update({ where: { id: userId }, data: { verificationToken, verificationExpires, status: 'pending' } });

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
      const emailResult = await EmailService.sendVerificationEmail(fullUser.email, fullUser.name || 'there', verificationUrl);

      if (!emailResult.success) return NextResponse.json({ error: `Failed to send email: ${emailResult.error}` }, { status: 500 });
      return NextResponse.json({ success: true, message: `Verification email sent to ${fullUser.email}` });
    }

    // ── UPDATE ROLE ──────────────────────────────────────────────────────────
    if (role) {
      if (currentUser.id === userId) return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 });
      if (!['user', 'admin', 'business_owner'].includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      if (role === 'admin' && !isCurrentUserSuperAdmin(currentUser)) {
        return NextResponse.json({ error: '🔒 Only Super Admin can promote users to Admin.', protected: true }, { status: 403 });
      }
      const updatedUser = await prisma.user.update({ where: { id: userId }, data: { role }, select: { id: true, email: true, name: true, role: true } });
      await logActivity({ userId, action: 'role_changed', details: { newRole: role, changedBy: currentUser.email }, ipAddress: request.headers.get('x-forwarded-for'), userAgent: request.headers.get('user-agent') });
      return NextResponse.json({ success: true, user: updatedUser });
    }

    // ── UPDATE STATUS ────────────────────────────────────────────────────────
    if (status) {
      if (currentUser.id === userId && status === 'suspended') return NextResponse.json({ error: 'Cannot suspend your own account' }, { status: 400 });
      const updatedUser = await prisma.user.update({ where: { id: userId }, data: { status }, select: { id: true, email: true, name: true, status: true } });
      return NextResponse.json({ success: true, user: updatedUser });
    }

    // ── UPDATE PROFILE ───────────────────────────────────────────────────────
    if (action === 'updateProfile') {
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email.toLowerCase();
      if (phone !== undefined) updateData.phone = phone;
      const updatedUser = await prisma.user.update({ where: { id: userId }, data: updateData, select: { id: true, email: true, name: true, phone: true } });
      return NextResponse.json({ success: true, message: 'Profile updated successfully', user: updatedUser });
    }

    return NextResponse.json({ error: 'No valid action provided' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: error.message || 'Failed to update user' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/users/:id
 * Soft delete — data retained 90 days
 * Super Admin can only be deleted by themselves
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const currentUser = await getRequestUser(request);

    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (currentUser.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    if (currentUser.id === userId) return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });

    const userToDelete = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
    if (!userToDelete) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const targetIsSuperAdmin = isSuperAdminEmail(userToDelete.email);
    const currentIsSuperAdmin = isCurrentUserSuperAdmin(currentUser);

    if (targetIsSuperAdmin && !currentIsSuperAdmin) {
      return NextResponse.json({
        error: '🔒 ACCESS DENIED: Only Super Admin can delete the Super Admin account.',
        protected: true,
      }, { status: 403 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date(), deletedBy: currentUser.id, status: 'deleted' },
    });

    try {
      await prisma.activityLog.create({
        data: {
          userId: currentUser.id,
          action: 'user_soft_deleted',
          details: JSON.stringify({ deletedUserId: userId, deletedUserEmail: userToDelete.email, deletedBy: currentUser.email, retentionDays: 90 }),
          ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown',
          userAgent: request.headers.get('user-agent')?.substring(0, 500) || 'unknown',
        },
      });
    } catch (e) { console.error('Failed to log deletion:', e); }

    return NextResponse.json({
      success: true,
      message: `${userToDelete.name || userToDelete.email} has been deleted. Data retained for 90 days.`,
      retentionDays: 90,
      canRestore: true,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete user' }, { status: 500 });
  }
}
