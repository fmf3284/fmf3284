import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { applySecurityHeaders, handlePreflight } from './server/middleware/security';

/**
 * Next.js Middleware - runs on every request
 * Applies security headers globally
 */
export function middleware(request: NextRequest) {
  // Handle CORS preflight requests
  const preflightResponse = handlePreflight(request);
  if (preflightResponse) {
    return preflightResponse;
  }

  // Continue to the route handler
  const response = NextResponse.next();

  // Apply security and CORS headers to all responses
  return applySecurityHeaders(response, request);
}

/**
 * Configure which routes this middleware runs on
 * Currently applies to all API routes
 */
export const config = {
  matcher: '/api/:path*',
};
