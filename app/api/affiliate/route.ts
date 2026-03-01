import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { EmailService } from '@/server/services/email.service';

/**
 * POST /api/affiliate
 * Submit affiliate application
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, businessName, website, socialMedia, audienceSize, message } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // Check if already applied
    const existing = await prisma.affiliateApplication.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json({ 
        error: 'You have already submitted an application. We will contact you soon!' 
      }, { status: 400 });
    }

    // Create application
    const application = await prisma.affiliateApplication.create({
      data: {
        name,
        email: email.toLowerCase(),
        phone,
        businessName,
        website,
        socialMedia,
        audienceSize,
        message,
      },
    });

    // Send notification email to admin
    try {
      await EmailService.send({
        to: 'support@findmyfitness.fit',
        subject: `🤝 New Affiliate Application: ${name}`,
        html: `
          <h2>New Affiliate Application</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
          <p><strong>Business:</strong> ${businessName || 'Not provided'}</p>
          <p><strong>Website:</strong> ${website || 'Not provided'}</p>
          <p><strong>Social Media:</strong> ${socialMedia || 'Not provided'}</p>
          <p><strong>Audience Size:</strong> ${audienceSize || 'Not provided'}</p>
          <p><strong>Message:</strong> ${message || 'None'}</p>
        `,
      });
    } catch (e) {
      console.error('Failed to send notification email:', e);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Application submitted successfully! We will review it and get back to you soon.',
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
  }
}
