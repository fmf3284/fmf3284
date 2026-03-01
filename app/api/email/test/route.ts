import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/server/services/email.service';
import { requireAdmin } from '@/server/middleware/admin';
import { rateLimit, rateLimitPresets } from '@/server/middleware/rateLimit';

const writeRateLimiter = rateLimit(rateLimitPresets.api);

/**
 * POST /api/email/test
 * Send test email (admin only)
 *
 * Body:
 * {
 *   to: "test@example.com"
 * }
 */
export async function POST(request: NextRequest) {
  const rateLimitResponse = await writeRateLimiter(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Require admin access
  const adminCheck = await requireAdmin(request);
  if (adminCheck) {
    return adminCheck;
  }

  try {
    const body = await request.json();
    const { to } = body;

    if (!to) {
      return NextResponse.json(
        { success: false, error: 'Recipient email required' },
        { status: 400 }
      );
    }

    const result = await EmailService.testEmail(to);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully',
        data: result,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to send test email',
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Test email error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send test email',
      },
      { status: 500 }
    );
  }
}
