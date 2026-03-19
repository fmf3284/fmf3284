import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { verifySessionToken, securityHeaders } from '@/server/utils/security';

export async function GET(request: NextRequest) {
  try {
    // Get auth token from cookies
    const authToken = request.cookies.get('auth_token')?.value;

    if (!authToken) {
      // Return 200 with authenticated: false (cleaner than 401 for session checks)
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200, headers: securityHeaders }
      );
    }

    // Verify the secure session token
    const sessionData = verifySessionToken(authToken);

    if (!sessionData) {
      // Token is invalid or expired - clear the cookie
      const response = NextResponse.json(
        { authenticated: false, user: null, reason: 'session_expired' },
        { status: 200, headers: securityHeaders }  // 200 is cleaner for session checks
      );
      
      // Clear the expired cookie
      response.cookies.set('auth_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0, // Expire immediately
        path: '/',
      });
      
      return response;
    }

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: sessionData.userId },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        role: true,
        status: true,
        mustChangePassword: true,
      },
    });

    if (!user) {
      const response = NextResponse.json(
        { authenticated: false, user: null, reason: 'user_not_found' },
        { status: 200, headers: securityHeaders }  // 200 is cleaner for session checks
      );
      
      response.cookies.set('auth_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      });
      
      return response;
    }

    // Check if user is suspended
    if (user.status === 'suspended') {
      const response = NextResponse.json(
        { authenticated: false, user: null, reason: 'account_suspended' },
        { status: 403, headers: securityHeaders }
      );
      
      response.cookies.set('auth_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      });
      
      return response;
    }

    // Update last active timestamp (don't wait for it)
    prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    }).catch(e => console.error('Failed to update lastActiveAt:', e));

    // Return session info
    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          mustChangePassword: user.mustChangePassword || false,
        },
        session: {
          expiresAt: new Date(sessionData.expiresAt).toISOString(),
          remainingMs: sessionData.expiresAt - Date.now(),
        },
      },
      { status: 200, headers: securityHeaders }
    );
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json(
      { error: 'Session validation failed' },
      { status: 500, headers: securityHeaders }
    );
  }
}
