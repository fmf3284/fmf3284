import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/server/services/payment.service';
import { getRequestUser } from '@/server/auth/session';
import { rateLimit, rateLimitPresets } from '@/server/middleware/rateLimit';

const writeRateLimiter = rateLimit(rateLimitPresets.api);

/**
 * POST /api/payment/checkout
 * Create Stripe checkout session
 *
 * Body:
 * {
 *   mode: "payment" | "subscription",
 *   priceId: "price_xxx" (for subscriptions),
 *   amount: 1000 (in cents, for one-time payments),
 *   currency: "usd" (optional),
 *   successUrl: "/success",
 *   cancelUrl: "/cancel"
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
    const { mode, priceId, amount, currency, successUrl, cancelUrl } = body;

    if (!mode || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: mode, successUrl, cancelUrl' },
        { status: 400 }
      );
    }

    if (mode === 'subscription' && !priceId) {
      return NextResponse.json(
        { success: false, error: 'priceId required for subscription mode' },
        { status: 400 }
      );
    }

    if (mode === 'payment' && !amount) {
      return NextResponse.json(
        { success: false, error: 'amount required for payment mode' },
        { status: 400 }
      );
    }

    // Create checkout session
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const session = await PaymentService.createCheckoutSession({
      mode,
      priceId,
      amount,
      currency,
      successUrl: `${baseUrl}${successUrl}`,
      cancelUrl: `${baseUrl}${cancelUrl}`,
      metadata: {
        userId: user.id,
        userEmail: user.email,
      },
    });

    return NextResponse.json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create checkout session',
      },
      { status: 500 }
    );
  }
}
