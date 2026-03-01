import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '../db/prisma';
import { verifySessionToken } from '../utils/security';

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role?: string;
}

/**
 * Get the current user from cookies
 */
export async function getRequestUser(request?: NextRequest): Promise<SessionUser | null> {
  try {
    // Get auth_token cookie
    let authToken: string | undefined;
    
    if (request) {
      authToken = request.cookies.get('auth_token')?.value;
    } else {
      const cookieStore = await cookies();
      authToken = cookieStore.get('auth_token')?.value;
    }
    
    if (!authToken) {
      return null;
    }

    // Try new secure token format first
    const sessionData = verifySessionToken(authToken);
    if (sessionData) {
      // Fetch user from database using secure token data
      const user = await prisma.user.findUnique({
        where: { id: sessionData.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });
      
      if (user) {
        return user;
      }
    }

    // Fallback: Try old token format (for backwards compatibility)
    const parts = authToken.split('_');
    if (parts.length >= 3) {
      const userId = parts[2];
      
      // Fetch user from database
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });
      
      if (user) {
        return user;
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting user session:', error);
    return null;
  }
}

/**
 * Require authentication - throws if user is not authenticated
 */
export async function requireAuth(request?: NextRequest): Promise<SessionUser> {
  const user = await getRequestUser(request);

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}

/**
 * Get current user (alias for backwards compatibility)
 */
export const getCurrentUser = getRequestUser;
