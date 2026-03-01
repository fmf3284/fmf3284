# Email Service

This document describes the email service that supports multiple email providers.

## Supported Providers

The system supports four email providers:

1. **SendGrid** - Production recommended (generous free tier)
2. **Resend** - Modern, developer-friendly
3. **SMTP (Nodemailer)** - Use any SMTP server (Gmail, Outlook, etc.)
4. **Console** - Development only (logs to console)

## Configuration

### Environment Variables

```env
# Choose provider: "sendgrid" | "resend" | "smtp" | "console"
EMAIL_PROVIDER=console

# Sender Information
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Find My Fitness

# SendGrid Configuration
SENDGRID_API_KEY=your-sendgrid-api-key

# Resend Configuration
RESEND_API_KEY=your-resend-api-key

# SMTP Configuration (Gmail, Outlook, custom server)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Setup Instructions

### Option 1: SendGrid (Recommended for Production)

**Step 1**: Sign up for SendGrid
1. Go to [sendgrid.com](https://sendgrid.com)
2. Create free account (100 emails/day forever free)
3. Verify sender email or domain

**Step 2**: Create API Key
1. Go to Settings > API Keys
2. Create API Key with "Full Access"
3. Copy the API key (only shown once)

**Step 3**: Install SDK
```bash
npm install @sendgrid/mail
```

**Step 4**: Configure Environment
```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Find My Fitness
```

**Free Tier**: 100 emails/day forever

### Option 2: Resend (Modern Alternative)

**Step 1**: Sign up for Resend
1. Go to [resend.com](https://resend.com)
2. Create free account
3. Verify domain

**Step 2**: Create API Key
1. Go to API Keys
2. Create new API key
3. Copy the key

**Step 3**: Install SDK
```bash
npm install resend
```

**Step 4**: Configure Environment
```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Find My Fitness
```

**Free Tier**: 3,000 emails/month

### Option 3: SMTP (Gmail, Outlook, etc.)

**Gmail Setup**:

**Step 1**: Enable 2-Factor Authentication
1. Go to Google Account settings
2. Enable 2-Step Verification

**Step 2**: Create App Password
1. Go to Security > App passwords
2. Create new app password for "Mail"
3. Copy the 16-character password

**Step 3**: Install Nodemailer
```bash
npm install nodemailer
```

**Step 4**: Configure Environment
```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=youremail@gmail.com
SMTP_PASS=your-16-char-app-password
EMAIL_FROM=youremail@gmail.com
EMAIL_FROM_NAME=Find My Fitness
```

**Gmail Limits**: 500 emails/day

**Other SMTP Providers**:
- **Outlook**: `smtp.office365.com:587`
- **Yahoo**: `smtp.mail.yahoo.com:587`
- **Custom server**: Use your own SMTP details

### Option 4: Console (Development Only)

**Step 1**: Configure Environment
```env
EMAIL_PROVIDER=console
EMAIL_FROM=dev@localhost
EMAIL_FROM_NAME=Find My Fitness Dev
```

**Note**: Emails are logged to console, not actually sent. Use for development only.

## Pre-built Email Templates

The service includes ready-to-use templates:

### 1. Welcome Email
```typescript
await EmailService.sendWelcomeEmail(
  'user@example.com',
  'John Doe'
);
```

### 2. Email Verification
```typescript
await EmailService.sendVerificationEmail(
  'user@example.com',
  'John Doe',
  'https://yoursite.com/verify?token=abc123'
);
```

### 3. Password Reset
```typescript
await EmailService.sendPasswordResetEmail(
  'user@example.com',
  'John Doe',
  'https://yoursite.com/reset?token=abc123'
);
```

### 4. Review Notification
```typescript
await EmailService.sendReviewNotification(
  'owner@business.com',
  'Gold\'s Gym',
  'Jane Smith',
  5,
  'Great place! Love the equipment.',
  'https://yoursite.com/reviews/123'
);
```

### 5. Booking Confirmation
```typescript
await EmailService.sendBookingConfirmation(
  'user@example.com',
  'John Doe',
  'CrossFit Box',
  'Jan 20, 2024 at 6:00 PM',
  'Personal Training Session\n1 hour\n$50'
);
```

### 6. Test Email
```typescript
await EmailService.testEmail('test@example.com');
```

## Custom Emails

Send custom emails with full control:

```typescript
import { EmailService } from '@/server/services/email.service';

await EmailService.sendEmail({
  to: 'user@example.com',
  subject: 'Custom Email',
  text: 'Plain text version',
  html: '<h1>HTML version</h1>',
  replyTo: 'support@example.com',
  cc: 'manager@example.com',
  bcc: 'archive@example.com',
  attachments: [
    {
      filename: 'invoice.pdf',
      content: pdfBuffer,
      contentType: 'application/pdf',
    },
  ],
});
```

## API Endpoints

### Test Email (Admin Only)

**POST** `/api/email/test`

**Headers**:
- Authentication required
- Admin role required

**Body**:
```json
{
  "to": "test@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Test email sent successfully",
  "data": {
    "success": true,
    "messageId": "abc123"
  }
}
```

## Usage in Your Code

### User Registration
```typescript
// In your register endpoint
const user = await UsersService.createUser(data);

// Send welcome email
await EmailService.sendWelcomeEmail(user.email, user.name);
```

### Email Verification Flow
```typescript
// Generate verification token
const token = generateToken(user.id);
const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify?token=${token}`;

// Send verification email
await EmailService.sendVerificationEmail(
  user.email,
  user.name,
  verifyUrl
);
```

### Password Reset Flow
```typescript
// Generate reset token
const token = generateToken(user.id);
const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

// Send reset email
await EmailService.sendPasswordResetEmail(
  user.email,
  user.name,
  resetUrl
);
```

### Review Notifications
```typescript
// When review is created
const review = await ReviewsService.createReview(userId, data);

// Notify business owner
const location = await LocationsService.getLocationById(review.locationId);
if (location.email) {
  await EmailService.sendReviewNotification(
    location.email,
    location.name,
    review.userName,
    review.rating,
    review.comment,
    `${process.env.NEXT_PUBLIC_APP_URL}/locations/${location.id}#reviews`
  );
}
```

## Email Templates Customization

All templates support HTML and plain text. Customize in [email.service.ts](next/server/services/email.service.ts):

```typescript
static async sendWelcomeEmail(to: string, name: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .button { background: #84cc16; color: white; padding: 12px 24px; }
        </style>
      </head>
      <body>
        <h1>Welcome ${name}!</h1>
        <p>Your custom content here...</p>
      </body>
    </html>
  `;

  return this.sendEmail({ to, subject: 'Welcome!', html });
}
```

## Error Handling

All email methods return `EmailResult`:

```typescript
interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
```

Example usage with error handling:

```typescript
const result = await EmailService.sendWelcomeEmail(email, name);

if (result.success) {
  console.log('Email sent:', result.messageId);
} else {
  console.error('Email failed:', result.error);
  // Handle error (log, retry, notify admin, etc.)
}
```

**Note**: Email failures should NOT break your app. Always handle gracefully:

```typescript
try {
  await EmailService.sendWelcomeEmail(user.email, user.name);
} catch (error) {
  // Log error but don't throw
  console.error('Failed to send welcome email:', error);
}
```

## Testing

### Test in Console Mode
```env
EMAIL_PROVIDER=console
```
All emails will be logged to console instead of sent.

### Test with Real Email
```bash
# As admin, call test endpoint
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -H "x-demo-user-id: admin-user-id" \
  -d '{"to": "your-email@example.com"}'
```

### Test from Admin Dashboard
Add a test button in your admin dashboard:
```typescript
async function testEmail() {
  const result = await apiClient.post('/email/test', {
    to: 'your-email@example.com',
  });
  alert(result.message);
}
```

## Common Issues

**"Module not found"**
```bash
# Install the required SDK
npm install @sendgrid/mail   # For SendGrid
npm install resend            # For Resend
npm install nodemailer        # For SMTP
```

**"Invalid API key"**
- Verify API key is correct
- Check for extra spaces/quotes
- Regenerate API key if needed

**"Sender email not verified" (SendGrid/Resend)**
- Verify your sender email in provider dashboard
- Or add and verify custom domain

**"Gmail blocked sign-in"**
- Enable 2FA
- Create App Password (not regular password)
- Use App Password in SMTP_PASS

**"Email not received"**
- Check spam folder
- Verify recipient email is correct
- Check provider dashboard for delivery status
- Test with console provider first

## Security Best Practices

1. **Never commit API keys** - Use environment variables
2. **Validate email addresses** - Prevent spam/abuse
3. **Rate limit email sends** - Prevent abuse
4. **Use verified domains** - Better deliverability
5. **Handle PII carefully** - Don't log sensitive data
6. **Implement unsubscribe** - Required for marketing emails
7. **Test in dev mode** - Use console provider

## Cost Comparison

### SendGrid
- **Free**: 100 emails/day forever
- **Essentials**: $19.95/mo (50,000 emails/mo)
- **Pro**: $89.95/mo (1.5M emails/mo)

### Resend
- **Free**: 3,000 emails/mo, 100/day
- **Pro**: $20/mo (50,000 emails/mo)

### SMTP (Gmail)
- **Free**: 500 emails/day
- **Workspace**: $6/user/mo (2,000 emails/day)

### Recommendation
- **MVP/Small apps**: SendGrid free tier (100/day)
- **Growing apps**: Resend ($20/mo for 50k)
- **Enterprise**: SendGrid Pro or custom SMTP

## Production Checklist

- [ ] Choose email provider (SendGrid recommended)
- [ ] Sign up and get API key
- [ ] Install SDK: `npm install @sendgrid/mail`
- [ ] Add environment variables
- [ ] Verify sender email/domain
- [ ] Test with `/api/email/test`
- [ ] Customize email templates
- [ ] Set up error logging
- [ ] Monitor email delivery rates
- [ ] Add unsubscribe links (if marketing emails)

## Integration Examples

### User Registration with Email
```typescript
// app/api/auth/register/route.ts
export async function POST(request: NextRequest) {
  const data = await request.json();

  // Create user
  const user = await UsersService.createUser(data);

  // Send welcome email (don't await - non-blocking)
  EmailService.sendWelcomeEmail(user.email, user.name).catch(console.error);

  return NextResponse.json({ success: true, user });
}
```

### Email Verification
```typescript
// Generate token
const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
  expiresIn: '24h',
});

const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify?token=${token}`;

await EmailService.sendVerificationEmail(user.email, user.name, verifyUrl);
```

### Password Reset
```typescript
// In forgot-password endpoint
const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
  expiresIn: '1h',
});

const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

await EmailService.sendPasswordResetEmail(user.email, user.name, resetUrl);
```

---

**Last Updated**: 2024-01-15
**Version**: 1.0.0
