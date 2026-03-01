import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/server/services/payment.service';

/**
 * GET /api/payment/config
 * Get Stripe publishable key for frontend
 */
export async function GET(request: NextRequest) {
  try {
    const publishableKey = PaymentService.getPublishableKey();

    return NextResponse.json({
      success: true,
      data: {
        publishableKey,
      },
    });
  } catch (error: any) {
    console.error('Config error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get config',
      },
      { status: 500 }
    );
  }
}
