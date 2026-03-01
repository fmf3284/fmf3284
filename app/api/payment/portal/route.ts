import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/server/services/payment.service';
import { getRequestUser } from '@/server/auth/session';
import { rateLimit, rateLimitPresets } from '@/server/middleware/rateLimit';

const writeRateLimiter = rateLimit(rateLimitPresets.api);

/**
 * POST /api/payment/portal
 * Create Stripe customer portal session
 * (allows customers to manage their subscriptions, payment methods, etc.)
 *
 * Body:
 * {
 *   customerId: "cus_xxx",
 *   returnUrl: "/dashboard"
 * }
 */
export async function POST(request: NextRequest) {
  const rateLimitResponse = await writeRateLimiter(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { customerId, returnUrl } = body;

    if (!customerId || !returnUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: customerId, returnUrl' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const session = await PaymentService.createPortalSession(
      customerId,
      `${baseUrl}${returnUrl}`
    );

    return NextResponse.json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    console.error('Portal error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create portal session',
      },
      { status: 500 }
    );
  }
}
