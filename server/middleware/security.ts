import { NextRequest, NextResponse } from 'next/server';

/**
 * CORS configuration
 */
export function corsHeaders(origin?: string) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001',
  ];

  // In production, add your domain
  if (process.env.NEXT_PUBLIC_APP_URL) {
    allowedOrigins.push(process.env.NEXT_PUBLIC_APP_URL);
  }

  const isAllowed = origin && allowedOrigins.includes(origin);

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

/**
 * Security headers (OWASP recommended)
 */
export function securityHeaders() {
  return {
    // Prevent clickjacking attacks
    'X-Frame-Options': 'DENY',

    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',

    // Enable XSS protection (legacy but still useful)
    'X-XSS-Protection': '1; mode=block',

    // Control referrer information
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Disable specific browser features
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self), payment=()',

    // Strict Transport Security (HTTPS only in production)
    ...(process.env.NODE_ENV === 'production' ? {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    } : {}),

    // Content Security Policy - Comprehensive protection
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://maps.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://maps.googleapis.com https://ipapi.co https://*.googleapis.com",
      "frame-src 'self' https://maps.google.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join('; '),

    // Prevent browser from caching sensitive data
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };
}

/**
 * Apply security and CORS headers to response
 */
export function applySecurityHeaders(
  response: NextResponse,
  request: NextRequest
): NextResponse {
  const origin = request.headers.get('origin');

  // Apply CORS headers
  const cors = corsHeaders(origin || undefined);
  Object.entries(cors).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Apply security headers
  const security = securityHeaders();
  Object.entries(security).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Handle OPTIONS preflight requests
 */
export function handlePreflight(request: NextRequest): NextResponse | null {
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    return applySecurityHeaders(response, request);
  }
  return null;
}

/**
 * Validate request origin for CSRF protection
 */
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  // For API routes, check origin or referer
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
    ];
    
    if (process.env.NEXT_PUBLIC_APP_URL) {
      allowedOrigins.push(process.env.NEXT_PUBLIC_APP_URL);
    }
    
    if (origin) {
      return allowedOrigins.includes(origin);
    }
    
    if (referer) {
      return allowedOrigins.some(allowed => referer.startsWith(allowed));
    }
    
    // No origin or referer - could be same-origin or direct API call
    return true;
  }
  
  return true;
}
