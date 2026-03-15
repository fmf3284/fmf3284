import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { getRequestUser } from '@/server/auth/session';
import { EmailService } from '@/server/services/email.service';

/**
 * GET /api/admin/newsletter
 * List subscribers. When showAll=true, also includes registered users who never subscribed.
 */
export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 50;
    const search = searchParams.get('search') || '';
    const activeOnly = searchParams.get('active') !== 'false';

    const where: any = {};
    if (activeOnly) where.isActive = true;
    if (search) where.email = { contains: search, mode: 'insensitive' };

    const [subscribers, total, activeCount] = await Promise.all([
      prisma.newsletterSubscriber.findMany({
        where,
        orderBy: { subscribedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.newsletterSubscriber.count({ where }),
      prisma.newsletterSubscriber.count({ where: { isActive: true } }),
    ]);

    // When showing all, also pull registered users who never subscribed
    let nonSubscribers: any[] = [];
    if (!activeOnly) {
      const emailsInTable = await prisma.newsletterSubscriber.findMany({ select: { email: true } });
      const knownEmails = emailsInTable.map((s: { email: string }) => s.email);
      const searchWhere: any = {
        email: { notIn: knownEmails },
        status: { not: 'pending' },
        deletedAt: null,
      };
      if (search) searchWhere.email = { contains: search, mode: 'insensitive', notIn: knownEmails };

      const unregistered = await prisma.user.findMany({
        where: searchWhere,
        select: { id: true, email: true, name: true, createdAt: true },
        take: 100,
      });

      nonSubscribers = unregistered.map((u: { id: string; email: string; name: string | null; createdAt: Date }) => ({
        id: 'user-' + u.id,
        email: u.email,
        name: u.name,
        source: 'registered',
        isActive: false,
        subscribedAt: u.createdAt,
        unsubscribedAt: null,
        neverSubscribed: true,
      }));
    }

    const allResults = [...subscribers, ...nonSubscribers];
    const grandTotal = total + nonSubscribers.length;

    return NextResponse.json({
      subscribers: allResults,
      total: grandTotal,
      activeCount,
      page,
      totalPages: Math.ceil(Math.max(total, 1) / limit),
    });
  } catch (error) {
    console.error('Newsletter GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 });
  }
}

/**
 * POST /api/admin/newsletter
 * Send broadcast email to all active subscribers
 */
export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  try {
    const { subject, html, text, testEmail } = await request.json();

    if (!subject || (!html && !text)) {
      return NextResponse.json({ error: 'Subject and content are required' }, { status: 400 });
    }

    // Test mode — send only to one email
    if (testEmail) {
      await EmailService.sendEmail({ to: testEmail, subject: `[TEST] ${subject}`, html, text });
      return NextResponse.json({ success: true, message: `Test email sent to ${testEmail}` });
    }

    // Get all active subscribers
    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: { isActive: true },
      select: { email: true, name: true },
    });

    if (subscribers.length === 0) {
      return NextResponse.json({ error: 'No active subscribers found' }, { status: 400 });
    }

    // Send in batches of 10 to avoid rate limits
    const BATCH = 10;
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < subscribers.length; i += BATCH) {
      const batch = subscribers.slice(i, i + BATCH);
      await Promise.allSettled(
        batch.map(async (sub) => {
          try {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.findmyfitness.fit';
            const unsubLink = `${baseUrl}/unsubscribe?email=${encodeURIComponent(sub.email)}`;
            const personalizedHtml = (html || '') +
              `<div style="margin-top:24px;padding-top:16px;border-top:1px solid #333;text-align:center;">
                <p style="color:#606070;font-size:12px;margin:0;">
                  © ${new Date().getFullYear()} Find My Fitness ·
                  <a href="${unsubLink}" style="color:#8b5cf6;">Unsubscribe</a>
                </p>
              </div>`;
            await EmailService.sendEmail({ to: sub.email, subject, html: personalizedHtml, text });
            sent++;
          } catch {
            failed++;
          }
        })
      );
      // Small delay between batches
      if (i + BATCH < subscribers.length) await new Promise(r => setTimeout(r, 500));
    }

    // Log the broadcast
    try {
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'newsletter_broadcast',
          details: JSON.stringify({ subject, totalSubscribers: subscribers.length, sent, failed }),
          ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
          userAgent: '',
        },
      });
    } catch { /* non-blocking */ }

    return NextResponse.json({
      success: true,
      message: `Newsletter sent to ${sent} subscriber${sent !== 1 ? 's' : ''}${failed > 0 ? `. ${failed} failed.` : '.'}`,
      sent,
      failed,
    });
  } catch (error) {
    console.error('Newsletter broadcast error:', error);
    return NextResponse.json({ error: 'Failed to send newsletter' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/newsletter
 * Remove a subscriber (admin action)
 */
export async function DELETE(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  try {
    const { email } = await request.json();
    await prisma.newsletterSubscriber.updateMany({
      where: { email },
      data: { isActive: false, unsubscribedAt: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to remove subscriber' }, { status: 500 });
  }
}
