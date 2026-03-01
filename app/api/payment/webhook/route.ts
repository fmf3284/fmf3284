import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/server/services/payment.service';

/**
 * POST /api/payment/webhook
 * Handle Stripe webhook events
 *
 * IMPORTANT: This endpoint must be accessible without authentication
 * Stripe will send webhook events to this endpoint
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body and signature
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const event = PaymentService.verifyWebhook(body, signature);

    // Handle the event
    const result = await PaymentService.handleWebhookEvent(event);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 400 }
    );
  }
}
