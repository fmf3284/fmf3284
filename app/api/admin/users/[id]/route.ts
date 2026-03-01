import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { getRequestUser } from '@/server/auth/session';
import { hashPassword } from '@/server/utils/security';
import { EmailService } from '@/server/services/email.service';
import crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════
// SUPER ADMIN CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════
const SUPER_ADMIN_EMAIL = 'moh.alneama@yahoo.com';
const SUPER_ADMIN_UNLOCK_CODE = '1954';

/**
 * Check if email is the super admin
 */
function isSuperAdminEmail(email: string | null | undefined): boolean {
  return email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

/**
 * Check if current user is the super admin
 */
function isCurrentUserSuperAdmin(user: any): boolean {
  return isSuperAdminEmail(user?.email);
}

// ═══════════════════════════════════════════════════════════════════════════
// PERMISSION HIERARCHY
// ═══════════════════════════════════════════════════════════════════════════
// 
// 👑 SUPER ADMIN (moh.alneama@yahoo.com)
//    └── Can do EVERYTHING to ALL users (admins, users, business owners)
//    └── Only SUPER ADMIN can modify themselves (with master code)
//
// ⭐ ADMIN
//    └── Can edit/reset/suspend/delete regular USERS and BUSINESS OWNERS
//    └── Can edit/reset/suspend/delete other ADMINS
//    └── CANNOT touch SUPER ADMIN at all (returns 403)
//
// 👤 USER / BUSINESS OWNER
//    └── Cannot access admin APIs (returns 403)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/users/:id
 * Get single user details
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
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { reviews: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/users/:id
 * Update user - supports role, status (suspend), profile edits, password reset
 * 
 * PERMISSION RULES:
 * - Super Admin can modify anyone (including themselves with master code)
 * - Regular Admin CANNOT touch Super Admin at all
 * - Regular Admin can modify other admins and users
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    
    // Check authentication and admin role
    const currentUser = await getRequestUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { action, role, status, name, email, phone, resetPassword, unlockCode } = body;

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, status: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const targetIsSuperAdmin = isSuperAdminEmail(targetUser.email);
    const currentIsSuperAdmin = isCurrentUserSuperAdmin(currentUser);

    // ═══════════════════════════════════════════════════════════════════════
    // PERMISSION CHECK: Regular Admin CANNOT touch Super Admin
    // ═══════════════════════════════════════════════════════════════════════
    if (targetIsSuperAdmin && !currentIsSuperAdmin) {
      return NextResponse.json({ 
        error: '🔒 ACCESS DENIED: Only Super Admin can modify Super Admin account.',
        protected: true,
        requiredRole: 'super_admin'
      }, { status: 403 });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SUPER ADMIN SELF-MODIFICATION (requires master code)
    // ═══════════════════════════════════════════════════════════════════════
    if (targetIsSuperAdmin && currentIsSuperAdmin) {
      // Super Admin modifying themselves - some actions require master code
      if (action === 'suspend' || status === 'suspended') {
        return NextResponse.json({ 
          error: '🔒 Super Admin cannot be suspended, even by themselves.',
          protected: true
        }, { status: 403 });
      }
      
      if (role && role !== 'admin') {
        return NextResponse.json({ 
          error: '🔒 Super Admin role cannot be changed.',
          protected: true
        }, { status: 403 });
      }

      // Password reset requires master code
      if (action === 'resetPassword' || resetPassword) {
        if (unlockCode !== SUPER_ADMIN_UNLOCK_CODE) {
          return NextResponse.json({ 
            error: '🔐 Master code required to reset Super Admin password.',
            requiresMasterCode: true
          }, { status: 403 });
        }
        
        // Reset with hashed password
        const newTempPassword = crypto.randomBytes(4).toString('hex');
        const hashedPassword = await hashPassword(newTempPassword);
        
        await prisma.user.update({
          where: { id: userId },
          data: { password: hashedPassword },
        });
        
        return NextResponse.json({ 
          success: true, 
          message: 'Super Admin password reset successfully',
          tempPassword: newTempPassword,
        });
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HANDLE ACTIONS (for regular users or super admin modifying others)
    // ═══════════════════════════════════════════════════════════════════════

    // SUSPEND ACTION
    if (action === 'suspend') {
      if (currentUser.id === userId) {
        return NextResponse.json({ error: 'Cannot suspend your own account' }, { status: 400 });
      }
      
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { status: 'suspended' },
        select: { id: true, email: true, name: true, status: true },
      });
      
      return NextResponse.json({ 
        success: true, 
        message: `User ${updatedUser.name || updatedUser.email} has been suspended`,
        user: updatedUser 
      });
    }
    
    // ACTIVATE ACTION
    if (action === 'activate') {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { status: 'active' },
        select: { id: true, email: true, name: true, status: true },
      });
      
      return NextResponse.json({ 
        success: true, 
        message: `User ${updatedUser.name || updatedUser.email} has been activated`,
        user: updatedUser 
      });
    }

    // RESTORE DELETED USER ACTION
    if (action === 'restore') {
      // Check if user is actually deleted
      const deletedUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { deletedAt: true, email: true, name: true },
      });

      if (!deletedUser?.deletedAt) {
        return NextResponse.json({ 
          error: 'This user is not deleted.',
        }, { status: 400 });
      }

      // Check if within 90-day retention period
      const deletedDate = new Date(deletedUser.deletedAt);
      const daysSinceDeleted = Math.floor((Date.now() - deletedDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceDeleted > 90) {
        return NextResponse.json({ 
          error: 'This user cannot be restored. The 90-day retention period has expired.',
        }, { status: 400 });
      }

      // Restore the user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { 
          deletedAt: null,
          deletedBy: null,
          status: 'active',
        },
        select: { id: true, email: true, name: true, status: true },
      });

      // Log the restoration
      try {
        await prisma.activityLog.create({
          data: {
            userId: currentUser.id,
            action: 'user_restored',
            details: JSON.stringify({
              restoredUserId: userId,
              restoredUserEmail: deletedUser.email,
              restoredUserName: deletedUser.name,
              restoredBy: currentUser.email,
              daysSinceDeleted,
            }),
            ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown',
            userAgent: request.headers.get('user-agent')?.substring(0, 500) || 'unknown',
          },
        });
      } catch (e) {
        console.error('Failed to log user restoration:', e);
      }
      
      return NextResponse.json({ 
        success: true, 
        message: `User ${updatedUser.name || updatedUser.email} has been restored`,
        user: updatedUser 
      });
    }

    // OVERRIDE VERIFICATION ACTION (Super Admin Only)
    if (action === 'overrideVerification') {
      // Only Super Admin can override verification
      if (!isCurrentUserSuperAdmin(currentUser)) {
        return NextResponse.json({ 
          error: '🔒 ACCESS DENIED: Only Super Admin can override email verification.',
          protected: true,
        }, { status: 403 });
      }

      // Get user info
      const fullUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { emailVerified: true, email: true, name: true },
      });

      if (!fullUser) {
        return NextResponse.json({ 
          error: 'User not found.',
        }, { status: 404 });
      }

      if (fullUser.emailVerified) {
        return NextResponse.json({ 
          error: 'This user is already verified.',
        }, { status: 400 });
      }

      // Override verification - mark as verified without email
      await prisma.user.update({
        where: { id: userId },
        data: {
          emailVerified: true,
          verificationToken: null,
          verificationExpires: null,
          status: 'active',
        },
      });

      // Log the override
      try {
        await prisma.activityLog.create({
          data: {
            userId: currentUser.id,
            action: 'super_admin_verification_override',
            details: JSON.stringify({
              targetUserId: userId,
              targetEmail: fullUser.email,
              targetName: fullUser.name,
              overriddenBy: currentUser.email,
            }),
            ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown',
            userAgent: request.headers.get('user-agent')?.substring(0, 500) || 'unknown',
          },
        });
      } catch (e) {
        console.error('Failed to log verification override:', e);
      }

      return NextResponse.json({ 
        success: true, 
        message: `✅ Email verification overridden for ${fullUser.name || fullUser.email}. User is now active.`,
      });
    }

    // RESEND VERIFICATION EMAIL ACTION
    if (action === 'resendVerification') {
      // Get full user info
      const fullUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { emailVerified: true, email: true, name: true },
      });

      if (!fullUser) {
        return NextResponse.json({ 
          error: 'User not found.',
        }, { status: 404 });
      }

      if (fullUser.emailVerified) {
        return NextResponse.json({ 
          error: 'This user is already verified.',
        }, { status: 400 });
      }

      // Generate new verification token (15 minutes)
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await prisma.user.update({
        where: { id: userId },
        data: {
          verificationToken,
          verificationExpires,
          status: 'pending', // Ensure status is pending
        },
      });

      // Generate verification URL
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;

      // Send verification email
      try {
        const emailResult = await EmailService.sendVerificationEmail(
          fullUser.email,
          fullUser.name || 'there',
          verificationUrl
        );
        
        if (emailResult.success) {
          // Log the activity
          try {
            await prisma.activityLog.create({
              data: {
                userId: currentUser.id,
                action: 'admin_resend_verification',
                details: JSON.stringify({
                  targetUserId: userId,
                  targetEmail: fullUser.email,
                }),
                ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown',
                userAgent: request.headers.get('user-agent')?.substring(0, 500) || 'unknown',
              },
            });
          } catch (e) {
            console.error('Failed to log resend verification:', e);
          }

          return NextResponse.json({ 
            success: true, 
            message: `Verification email sent to ${fullUser.email}`,
          });
        } else {
          console.error('Email send failed:', emailResult.error);
          return NextResponse.json({ 
            error: `Failed to send email: ${emailResult.error}`,
          }, { status: 500 });
        }
      } catch (emailError: any) {
        console.error('Email service error:', emailError);
        return NextResponse.json({ 
          error: 'Email service error. Please try again.',
        }, { status: 500 });
      }
    }
    
    // RESET PASSWORD ACTION
    if (action === 'resetPassword' || resetPassword) {
      const tempPassword = crypto.randomBytes(4).toString('hex');
      const hashedPassword = await hashPassword(tempPassword);
      
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
        select: { id: true, email: true, name: true },
      });
      
      return NextResponse.json({ 
        success: true, 
        message: `Password reset for ${updatedUser.name || updatedUser.email}`,
        tempPassword: tempPassword,
        user: updatedUser 
      });
    }
    
    // UPDATE PROFILE ACTION
    if (action === 'updateProfile') {
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email.toLowerCase();
      if (phone !== undefined) updateData.phone = phone;
      
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: { id: true, email: true, name: true, phone: true },
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Profile updated successfully',
        user: updatedUser 
      });
    }

    // UPDATE ROLE
    if (role) {
      if (currentUser.id === userId) {
        return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 });
      }

      if (!['user', 'admin', 'business_owner'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }

      // Only Super Admin can promote users to admin
      if (role === 'admin' && !isCurrentUserSuperAdmin(currentUser)) {
        return NextResponse.json({ 
          error: '🔒 ACCESS DENIED: Only Super Admin can promote users to Admin role.',
          protected: true,
        }, { status: 403 });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role },
        select: { id: true, email: true, name: true, role: true },
      });

      // Log admin promotion
      if (role === 'admin') {
        try {
          await prisma.activityLog.create({
            data: {
              userId: currentUser.id,
              action: 'admin_promotion',
              details: JSON.stringify({
                promotedUserId: userId,
                promotedUserEmail: updatedUser.email,
                promotedUserName: updatedUser.name,
                promotedBy: currentUser.email,
              }),
              ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown',
              userAgent: request.headers.get('user-agent')?.substring(0, 500) || 'unknown',
            },
          });
        } catch (e) {
          console.error('Failed to log admin promotion:', e);
        }
      }

      return NextResponse.json({ success: true, user: updatedUser });
    }
    
    // UPDATE STATUS
    if (status) {
      if (currentUser.id === userId && status === 'suspended') {
        return NextResponse.json({ error: 'Cannot suspend your own account' }, { status: 400 });
      }
      
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { status },
        select: { id: true, email: true, name: true, status: true },
      });

      return NextResponse.json({ success: true, user: updatedUser });
    }

    return NextResponse.json({ error: 'No valid action provided' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/:id
 * Delete user
 * 
 * PERMISSION RULES:
 * - Super Admin can delete anyone
 * - Regular Admin CANNOT delete Super Admin
 * - No one can delete their own account
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    
    // Check authentication and admin role
    const currentUser = await getRequestUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Prevent deleting own account
    if (currentUser.id === userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Get target user
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const targetIsSuperAdmin = isSuperAdminEmail(userToDelete.email);
    const currentIsSuperAdmin = isCurrentUserSuperAdmin(currentUser);

    // ═══════════════════════════════════════════════════════════════════════
    // PERMISSION CHECK: Regular Admin CANNOT delete Super Admin
    // ═══════════════════════════════════════════════════════════════════════
    if (targetIsSuperAdmin && !currentIsSuperAdmin) {
      return NextResponse.json({ 
        error: '🔒 ACCESS DENIED: Only Super Admin can delete Super Admin account.',
        protected: true,
        requiredRole: 'super_admin'
      }, { status: 403 });
    }

    // Super Admin can delete themselves but needs confirmation
    if (targetIsSuperAdmin && currentIsSuperAdmin) {
      const url = new URL(request.url);
      const unlockCode = url.searchParams.get('unlockCode');
      
      if (unlockCode !== SUPER_ADMIN_UNLOCK_CODE) {
        return NextResponse.json({ 
          error: '🔐 Master code required to delete Super Admin account.',
          requiresMasterCode: true,
          protected: true
        }, { status: 403 });
      }
    }

    // SOFT DELETE - Set deletedAt instead of actually deleting
    // Data will be retained for 90 days before permanent deletion
    await prisma.user.update({
      where: { id: userId },
      data: { 
        deletedAt: new Date(),
        deletedBy: currentUser.id,
        status: 'deleted',
      },
    });

    // Log the deletion
    try {
      await prisma.activityLog.create({
        data: {
          userId: currentUser.id,
          action: 'user_soft_deleted',
          details: JSON.stringify({
            deletedUserId: userId,
            deletedUserEmail: userToDelete.email,
            deletedUserName: userToDelete.name,
            deletedBy: currentUser.email,
            retentionDays: 90,
            permanentDeleteDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          }),
          ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown',
          userAgent: request.headers.get('user-agent')?.substring(0, 500) || 'unknown',
        },
      });
    } catch (e) {
      console.error('Failed to log user deletion:', e);
    }

    return NextResponse.json({ 
      success: true, 
      message: `User ${userToDelete.name || userToDelete.email} has been deleted. Data will be retained for 90 days.`,
      retentionDays: 90,
      canRestore: true,
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}
