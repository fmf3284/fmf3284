import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { getRequestUser } from '@/server/auth/session';

export const dynamic = 'force-dynamic';

// Parse device/browser/OS from user agent
function parseUserAgent(ua: string) {
  const device = /mobile/i.test(ua) ? 'mobile' : /tablet|ipad/i.test(ua) ? 'tablet' : 'desktop';
  const browser =
    /edg/i.test(ua) ? 'Edge' :
    /chrome/i.test(ua) ? 'Chrome' :
    /firefox/i.test(ua) ? 'Firefox' :
    /safari/i.test(ua) ? 'Safari' :
    /opera/i.test(ua) ? 'Opera' : 'Other';
  const os =
    /windows/i.test(ua) ? 'Windows' :
    /mac os x/i.test(ua) ? 'macOS' :
    /android/i.test(ua) ? 'Android' :
    /iphone|ipad|ipod/i.test(ua) ? 'iOS' :
    /linux/i.test(ua) ? 'Linux' : 'Other';
  return { device, browser, os };
}

// Get real IP from headers (works behind proxies/Railway)
function getIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    '0.0.0.0'
  );
}

// Fetch geo location from IP using free ipapi.co
async function getGeoLocation(ip: string) {
  if (!ip || ip === '0.0.0.0' || ip.startsWith('127.') || ip.startsWith('::1')) {
    return { country: 'Local', countryCode: 'LO', region: null, city: 'Localhost' };
  }
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { 'User-Agent': 'FindMyFitness/1.0' },
      signal: AbortSignal.timeout(2000), // 2 second timeout
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

/**
 * POST /api/track
 * Track a page visit — works for both logged-in and anonymous users
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { page, referrer, sessionId } = body;

    if (!page || !sessionId) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    // Skip admin pages and API routes
    if (page.startsWith('/admin') || page.startsWith('/api')) {
      return NextResponse.json({ ok: true });
    }

    const ip = getIP(request);
    const ua = request.headers.get('user-agent') || '';
    const { device, browser, os } = parseUserAgent(ua);

    // Get logged-in user if any
    const user = await getRequestUser(request).catch(() => null);

    // Get geo location (non-blocking — if it fails, still save the log)
    const geo = await getGeoLocation(ip);

    await prisma.visitorLog.create({
      data: {
        sessionId,
        userId: user?.id || null,
        page,
        referrer: referrer || null,
        userAgent: ua.substring(0, 500),
        device,
        browser,
        os,
        ipAddress: ip,
        country: geo?.country || null,
        countryCode: geo?.countryCode || null,
        region: geo?.region || null,
        city: geo?.city || null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    // Never throw — tracking should never break the site
    return NextResponse.json({ ok: false });
  }
}
