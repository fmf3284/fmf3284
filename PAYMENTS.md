# Stripe Payment System

This document describes the Stripe payment integration for subscriptions and one-time payments.

## Features

- One-time payments
- Recurring subscriptions
- Customer portal (manage subscriptions/payment methods)
- Webhook handling for automated events
- Secure payment processing
- PCI compliant (Stripe handles card data)

## Configuration

### Environment Variables

```env
# Stripe Keys (get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx

# Webhook Secret (get after creating webhook endpoint)
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# Your app URL (for redirects)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Setup Instructions

### Step 1: Create Stripe Account

1. Go to [stripe.com](https://stripe.com)
2. Sign up for account (free)
3. Verify email and business info

### Step 2: Get API Keys

1. Go to [Dashboard > API Keys](https://dashboard.stripe.com/apikeys)
2. Copy **Publishable key** (starts with `pk_test_`)
3. Copy **Secret key** (starts with `sk_test_`)
4. Add to `.env` file

### Step 3: Install Stripe SDK

```bash
npm install stripe
```

### Step 4: Configure Environment

```env
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 5: Create Products and Prices

**Option A: Via Dashboard**

1. Go to [Dashboard > Products](https://dashboard.stripe.com/products)
2. Click "Add Product"
3. Set name, description, pricing
4. Copy the **Price ID** (starts with `price_`)

**Option B: Via API**

```typescript
// Create product
const product = await stripe.products.create({
  name: 'Premium Membership',
  description: 'Access to all features',
});

// Create price
const price = await stripe.prices.create({
  product: product.id,
  unit_amount: 999, // $9.99
  currency: 'usd',
  recurring: { interval: 'month' },
});

console.log('Price ID:', price.id); // price_xxxxx
```

### Step 6: Set Up Webhooks

1. Go to [Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Set URL: `https://yourdomain.com/api/payment/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy **Signing secret** and add to `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
   ```

## API Endpoints

### 1. Create Checkout Session

**POST** `/api/payment/checkout`

Create a Stripe checkout session for payment or subscription.

**Body (Subscription)**:
```json
{
  "mode": "subscription",
  "priceId": "price_xxxxx",
  "successUrl": "/success",
  "cancelUrl": "/cancel"
}
```

**Body (One-Time Payment)**:
```json
{
  "mode": "payment",
  "amount": 1000,
  "currency": "usd",
  "successUrl": "/success",
  "cancelUrl": "/cancel"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_xxxxx",
    "url": "https://checkout.stripe.com/c/pay/cs_test_xxxxx"
  }
}
```

### 2. Customer Portal

**POST** `/api/payment/portal`

Create customer portal session (manage subscriptions/payment methods).

**Body**:
```json
{
  "customerId": "cus_xxxxx",
  "returnUrl": "/dashboard"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "url": "https://billing.stripe.com/session/xxxxx"
  }
}
```

### 3. Get Config

**GET** `/api/payment/config`

Get Stripe publishable key for frontend.

**Response**:
```json
{
  "success": true,
  "data": {
    "publishableKey": "pk_test_xxxxx"
  }
}
```

### 4. Webhook Handler

**POST** `/api/payment/webhook`

Receives Stripe webhook events (called by Stripe, not your app).

## Frontend Integration

### Basic Checkout Flow

```typescript
import { apiClient } from '@/lib/api';

async function handleCheckout() {
  try {
    // Create checkout session
    const response = await apiClient.post('/payment/checkout', {
      mode: 'subscription',
      priceId: 'price_xxxxx', // Your Stripe price ID
      successUrl: '/success',
      cancelUrl: '/cancel',
    });

    // Redirect to Stripe checkout
    window.location.href = response.data.url;
  } catch (error) {
    console.error('Checkout error:', error);
    alert('Payment failed to initiate');
  }
}

// Usage in component
<button onClick={handleCheckout}>
  Subscribe Now
</button>
```

### Customer Portal (Manage Subscription)

```typescript
async function openCustomerPortal(customerId: string) {
  try {
    const response = await apiClient.post('/payment/portal', {
      customerId,
      returnUrl: '/dashboard',
    });

    // Redirect to Stripe customer portal
    window.location.href = response.data.url;
  } catch (error) {
    console.error('Portal error:', error);
  }
}

// Usage
<button onClick={() => openCustomerPortal(user.stripeCustomerId)}>
  Manage Subscription
</button>
```

### Advanced: Custom Payment Form

For custom payment UI (not using hosted checkout):

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

```typescript
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Load Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!stripe || !elements) return;

    // Create payment intent on server
    const { clientSecret } = await apiClient.post('/payment/intent', {
      amount: 1000, // $10.00
    });

    // Confirm payment
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement)!,
      },
    });

    if (result.error) {
      alert(result.error.message);
    } else {
      alert('Payment successful!');
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit">Pay $10</button>
    </form>
  );
}

// Wrap in Elements provider
function App() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}
```

## Service Methods

### PaymentService

```typescript
import { PaymentService } from '@/server/services/payment.service';

// Create checkout session
const session = await PaymentService.createCheckoutSession({
  mode: 'subscription',
  priceId: 'price_xxxxx',
  successUrl: 'https://yoursite.com/success',
  cancelUrl: 'https://yoursite.com/cancel',
  metadata: { userId: 'user123' },
});

// Create customer
const customer = await PaymentService.createCustomer({
  email: 'user@example.com',
  name: 'John Doe',
  metadata: { userId: 'user123' },
});

// Get subscription
const subscription = await PaymentService.getSubscription('sub_xxxxx');

// Cancel subscription
await PaymentService.cancelSubscription('sub_xxxxx', true); // Cancel at period end

// Create portal session
const portal = await PaymentService.createPortalSession(
  'cus_xxxxx',
  'https://yoursite.com/dashboard'
);
```

## Webhook Events

The webhook handler automatically processes these events:

- **checkout.session.completed** - Payment completed
- **customer.subscription.created** - New subscription
- **customer.subscription.updated** - Subscription changed
- **customer.subscription.deleted** - Subscription cancelled
- **invoice.paid** - Invoice paid successfully
- **invoice.payment_failed** - Payment failed
- **payment_intent.succeeded** - One-time payment succeeded
- **payment_intent.payment_failed** - Payment failed

### Webhook Handlers (Customize These)

Edit [payment.service.ts](next/server/services/payment.service.ts) to add your business logic:

```typescript
private static async handleCheckoutCompleted(session: any) {
  console.log('Checkout completed:', session.id);

  // TODO: Your code here
  // Example: Mark user as premium
  await prisma.user.update({
    where: { id: session.metadata.userId },
    data: {
      isPremium: true,
      stripeCustomerId: session.customer,
    },
  });

  // Send welcome email
  await EmailService.sendWelcomeEmail(session.customer_email, 'Premium Member');

  return { received: true };
}
```

## Testing

### Test in Test Mode

Stripe provides test mode for development:

**Test Cards**:
- **Success**: `4242 4242 4242 4242`
- **Declined**: `4000 0000 0000 0002`
- **Requires Auth**: `4000 0025 0000 3155`

Any future expiry date and any 3-digit CVC will work.

### Test Webhooks Locally

Use Stripe CLI to forward webhooks to localhost:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:3000/api/payment/webhook

# Get webhook secret (update .env)
# Will print: whsec_xxxxx

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.created
```

## Common Use Cases

### 1. Monthly Subscription

```typescript
// Create product + price in Stripe Dashboard
// Price ID: price_xxxxx

// Frontend: Checkout button
async function subscribe() {
  const response = await apiClient.post('/payment/checkout', {
    mode: 'subscription',
    priceId: 'price_xxxxx', // Monthly subscription
    successUrl: '/welcome',
    cancelUrl: '/pricing',
  });

  window.location.href = response.data.url;
}
```

### 2. One-Time Payment

```typescript
async function buyCredits() {
  const response = await apiClient.post('/payment/checkout', {
    mode: 'payment',
    amount: 999, // $9.99
    currency: 'usd',
    successUrl: '/success?credits=100',
    cancelUrl: '/buy-credits',
  });

  window.location.href = response.data.url;
}
```

### 3. User Upgrades to Premium

```typescript
// When checkout completes, webhook fires
private static async handleCheckoutCompleted(session: any) {
  const userId = session.metadata.userId;

  // Update user in database
  await prisma.user.update({
    where: { id: userId },
    data: {
      isPremium: true,
      stripeCustomerId: session.customer,
      subscriptionId: session.subscription,
    },
  });

  // Send confirmation email
  await EmailService.sendEmail({
    to: session.customer_email,
    subject: 'Welcome to Premium!',
    html: '<h1>You are now a premium member!</h1>',
  });
}
```

### 4. User Cancels Subscription

```typescript
// User clicks "Cancel Subscription"
async function cancelSubscription() {
  // Open customer portal
  const response = await apiClient.post('/payment/portal', {
    customerId: user.stripeCustomerId,
    returnUrl: '/dashboard',
  });

  window.location.href = response.data.url;
}

// Webhook handles the cancellation
private static async handleSubscriptionDeleted(subscription: any) {
  // Find user by stripe customer ID
  await prisma.user.update({
    where: { stripeCustomerId: subscription.customer },
    data: { isPremium: false },
  });
}
```

## Security

- Never expose secret key in frontend
- Always verify webhooks with signature
- Use HTTPS in production
- Store customer IDs in database
- Rate limit payment endpoints
- Validate amounts server-side

## Pricing Recommendations

### Fitness App Pricing Examples

**Basic (Free)**:
- View locations
- Basic search
- Limited bookmarks

**Premium ($9.99/month)**:
- Unlimited bookmarks
- Advanced search filters
- Check-in tracking
- Review photos
- No ads

**Business ($29/month)**:
- Business listing
- Respond to reviews
- Analytics dashboard
- Priority support

## Cost Breakdown

**Stripe Fees**:
- **US Cards**: 2.9% + $0.30 per transaction
- **International**: 3.9% + $0.30
- **Subscriptions**: Same as above per charge
- **No monthly fees**

**Example**:
- $9.99 subscription → You receive $9.40
- $99 one-time → You receive $96.21

## Production Checklist

- [ ] Install Stripe SDK: `npm install stripe`
- [ ] Add environment variables (secret key, publishable key)
- [ ] Create products and prices in Stripe Dashboard
- [ ] Set up webhook endpoint in Stripe Dashboard
- [ ] Add webhook secret to environment
- [ ] Test with test cards in test mode
- [ ] Customize webhook handlers in payment.service.ts
- [ ] Update database schema (add stripeCustomerId, subscriptionId to users)
- [ ] Test full flow: checkout → webhook → database update
- [ ] Switch to live keys for production
- [ ] Set up monitoring/alerts for failed payments

## Troubleshooting

**"Stripe SDK not installed"**
```bash
npm install stripe
```

**"Webhook signature verification failed"**
- Check `STRIPE_WEBHOOK_SECRET` is correct
- Use raw body (already handled in route)
- Test with Stripe CLI locally

**"No such price"**
- Verify price ID exists in Stripe Dashboard
- Check you're using correct mode (test vs live)

**"Customer not found"**
- Store Stripe customer ID in database after first payment
- Query database for customer ID before portal session

**Webhooks not firing**
- Check webhook endpoint URL is correct
- Verify endpoint is accessible (no auth required)
- Check Stripe Dashboard > Webhooks for delivery status

## Next Steps

1. Add `stripeCustomerId` and `subscriptionId` to User model
2. Customize webhook handlers with your business logic
3. Create pricing page with subscription options
4. Add "Manage Subscription" button in user dashboard
5. Test full flow end-to-end

---

**Last Updated**: 2024-01-15
**Version**: 1.0.0
