/**
 * Email Service
 *
 * Uses Resend for sending emails.
 * Configure via environment variables:
 * - RESEND_API_KEY
 * - EMAIL_FROM: sender email address
 * - EMAIL_FROM_NAME: sender name
 */

import { Resend } from 'resend';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Initialize Resend client
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export class EmailService {
  private static fromEmail = process.env.EMAIL_FROM || 'noreply@example.com';
  private static fromName = process.env.EMAIL_FROM_NAME || 'Find My Fitness';

  /**
   * Send email using Resend
   */
  static async sendEmail(options: EmailOptions): Promise<EmailResult> {
    // Validate email
    if (!options.to) {
      return { success: false, error: 'Recipient email is required' };
    }

    // If no Resend API key, log to console (dev mode)
    if (!resend) {
      console.log('📧 Email (console mode - no RESEND_API_KEY):');
      console.log(`   To: ${options.to}`);
      console.log(`   Subject: ${options.subject}`);
      console.log(`   Body: ${options.text || '(HTML content)'}`);
      return { success: true, messageId: 'console-' + Date.now() };
    }

    try {
      const { data, error } = await resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        text: options.text,
        html: options.html,
        replyTo: options.replyTo,
      });

      if (error) {
        console.error('Resend error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, messageId: data?.id };
    } catch (error: any) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send verification email
   */
  static async sendVerificationEmail(
    email: string,
    userName: string,
    verificationUrl: string
  ): Promise<EmailResult> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f0f1a; margin: 0; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(139, 92, 246, 0.3);">
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">🏋️ Find My Fitness</h1>
          </div>
          <div style="padding: 40px 30px;">
            <h2 style="color: #ffffff; margin: 0 0 20px; font-size: 24px;">Welcome, ${userName}! 👋</h2>
            <p style="color: #a0a0b0; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
              Thanks for joining Find My Fitness! Please verify your email address to activate your account and start discovering fitness locations near you.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                ✓ Verify My Email
              </a>
            </div>
            <p style="color: #606070; font-size: 14px; margin: 30px 0 0;">
              This link expires in 15 minutes. If you didn't create an account, you can safely ignore this email.
            </p>
          </div>
          <div style="background-color: rgba(139, 92, 246, 0.1); padding: 20px 30px; text-align: center; border-top: 1px solid rgba(139, 92, 246, 0.2);">
            <p style="color: #606070; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} Find My Fitness. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: '✓ Verify your Find My Fitness account',
      html,
      text: `Welcome to Find My Fitness, ${userName}! Please verify your email by visiting: ${verificationUrl}`,
    });
  }

  /**
   * Send welcome email after verification
   */
  static async sendWelcomeEmail(email: string, userName: string): Promise<EmailResult> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f0f1a; margin: 0; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(139, 92, 246, 0.3);">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">🎉 You're All Set!</h1>
          </div>
          <div style="padding: 40px 30px;">
            <h2 style="color: #ffffff; margin: 0 0 20px; font-size: 24px;">Welcome to the community, ${userName}!</h2>
            <p style="color: #a0a0b0; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
              Your email has been verified and your account is now active. You're ready to discover amazing fitness locations!
            </p>
            <div style="background-color: rgba(16, 185, 129, 0.1); border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #10b981; margin: 0 0 15px; font-size: 16px;">What you can do now:</h3>
              <ul style="color: #a0a0b0; margin: 0; padding-left: 20px; line-height: 1.8;">
                <li>🔍 Search for gyms, yoga studios, and trainers</li>
                <li>⭐ Save your favorite locations</li>
                <li>📝 Write reviews and help the community</li>
                <li>🎯 Track your fitness journey</li>
              </ul>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://findmyfitness.fit'}/locations" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Start Exploring →
              </a>
            </div>
          </div>
          <div style="background-color: rgba(139, 92, 246, 0.1); padding: 20px 30px; text-align: center; border-top: 1px solid rgba(139, 92, 246, 0.2);">
            <p style="color: #606070; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} Find My Fitness. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: '🎉 Welcome to Find My Fitness!',
      html,
      text: `Welcome to Find My Fitness, ${userName}! Your account is now active. Start exploring at ${process.env.NEXT_PUBLIC_APP_URL || 'https://findmyfitness.fit'}/locations`,
    });
  }

  /**
   * Send affiliate application notification
   */
  static async sendAffiliateNotification(applicationData: {
    name: string;
    email: string;
    phone?: string;
    businessName?: string;
    website?: string;
    socialMedia?: string;
    audienceSize?: string;
    message?: string;
  }): Promise<EmailResult> {
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>New Affiliate Application</h2>
        <p><strong>Name:</strong> ${applicationData.name}</p>
        <p><strong>Email:</strong> ${applicationData.email}</p>
        ${applicationData.phone ? `<p><strong>Phone:</strong> ${applicationData.phone}</p>` : ''}
        ${applicationData.businessName ? `<p><strong>Business:</strong> ${applicationData.businessName}</p>` : ''}
        ${applicationData.website ? `<p><strong>Website:</strong> ${applicationData.website}</p>` : ''}
        ${applicationData.socialMedia ? `<p><strong>Social Media:</strong> ${applicationData.socialMedia}</p>` : ''}
        ${applicationData.audienceSize ? `<p><strong>Audience Size:</strong> ${applicationData.audienceSize}</p>` : ''}
        ${applicationData.message ? `<p><strong>Message:</strong> ${applicationData.message}</p>` : ''}
      </body>
      </html>
    `;

    return this.sendEmail({
      to: process.env.EMAIL_FROM || 'support@findmyfitness.fit',
      subject: `New Affiliate Application: ${applicationData.name}`,
      html,
      text: `New affiliate application from ${applicationData.name} (${applicationData.email})`,
    });
  }
}
