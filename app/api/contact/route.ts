import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/server/services/email.service';
import { rateLimit, rateLimitPresets } from '@/server/middleware/rateLimit';

const contactRateLimiter = rateLimit(rateLimitPresets.auth);

export async function POST(request: NextRequest) {
  const rateLimitResponse = await contactRateLimiter(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const { full_name, email, phone, category, message } = body;

    if (!full_name || !email || !category || !message) {
      return NextResponse.json(
        { error: 'All required fields must be filled out.' },
        { status: 400 }
      );
    }

    const categoryLabels: Record<string, string> = {
      general: 'General Inquiry',
      partnership: 'Partnership',
      tech: 'Technical Support',
      feedback: 'Feedback',
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; padding: 20px; background: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h2 style="color: #7c3aed; margin-top: 0;">📬 New Contact Form Submission</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #555; width: 140px;"><strong>Name:</strong></td><td style="padding: 8px 0;">${full_name}</td></tr>
            <tr><td style="padding: 8px 0; color: #555;"><strong>Email:</strong></td><td style="padding: 8px 0;"><a href="mailto:${email}">${email}</a></td></tr>
            ${phone ? `<tr><td style="padding: 8px 0; color: #555;"><strong>Phone:</strong></td><td style="padding: 8px 0;">${phone}</td></tr>` : ''}
            <tr><td style="padding: 8px 0; color: #555;"><strong>Category:</strong></td><td style="padding: 8px 0;">${categoryLabels[category] || category}</td></tr>
          </table>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
          <h3 style="color: #333; margin-top: 0;">Message:</h3>
          <p style="color: #444; line-height: 1.6; background: #f9f9f9; padding: 15px; border-radius: 6px; border-left: 4px solid #7c3aed;">${message.replace(/\n/g, '<br>')}</p>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">Sent from the Find My Fitness contact form</p>
        </div>
      </body>
      </html>
    `;

    const result = await EmailService.sendEmail({
      to: process.env.EMAIL_FROM || 'support@findmyfitness.fit',
      subject: `[Contact] ${categoryLabels[category] || category}: ${full_name}`,
      html,
      text: `New contact from ${full_name} (${email})\nCategory: ${categoryLabels[category]}\nPhone: ${phone || 'N/A'}\n\nMessage:\n${message}`,
      replyTo: email,
    });

    if (!result.success) {
      console.error('Contact email failed:', result.error);
      return NextResponse.json(
        { error: 'Failed to send message. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent! We will get back to you within 24-48 hours.',
    });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
