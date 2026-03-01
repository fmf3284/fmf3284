import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '../auth/session';

/**
 * Admin middleware - ensures user has admin role
 */
export async function requireAdmin(request: NextRequest) {
  const user = await getRequestUser(request);

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  if (user.role !== 'admin') {
    return NextResponse.json(
      { success: false, error: 'Forbidden. Admin access required.' },
      { status: 403 }
    );
  }

  return null; // Continue to route handler
}

/**
 * Check if user is admin (without throwing error)
 */
export async function isAdmin(request: NextRequest): Promise<boolean> {
  const user = await getRequestUser(request);
  return user?.role === 'admin';
}