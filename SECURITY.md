# Security Implementation

This document describes the security measures implemented in the Find My Fitness application.

## ✅ Implemented Security Features

### 1. Password Hashing (bcrypt)

**Location**: [next/server/services/users.service.ts](next/server/services/users.service.ts)

- All passwords are hashed using bcrypt with 10 salt rounds before storage
- Passwords are NEVER stored in plaintext
- Includes `verifyPassword()` method for secure password comparison

**Usage**:
```typescript
// Creating a user
const user = await UsersService.createUser({
  email: 'user@example.com',
  name: 'John Doe',
  password: 'securePassword123' // Will be hashed automatically
});

// Verifying password during login
const isValid = await UsersService.verifyPassword(
  inputPassword,
  storedPasswordHash
);
```

### 2. Rate Limiting

**Location**: [next/server/middleware/rateLimit.ts](next/server/middleware/rateLimit.ts)

Prevents brute force attacks and API abuse by limiting requests per IP address.

**Presets**:
- **Auth endpoints** (login, register): 10 requests per 15 minutes
- **API endpoints** (write operations): 100 requests per 15 minutes
- **Read-only endpoints**: 300 requests per 15 minutes

**Features**:
- In-memory rate limiting (for production, upgrade to Redis)
- Returns 429 status code when limit exceeded
- Includes `Retry-After` header
- Automatic cleanup of expired entries

**Usage**:
```typescript
import { rateLimit, rateLimitPresets } from '@/server/middleware/rateLimit';

const limiter = rateLimit(rateLimitPresets.auth);

export async function POST(request: NextRequest) {
  const rateLimitResponse = await limiter(request);
  if (rateLimitResponse) {
    return rateLimitResponse; // 429 Too Many Requests
  }
  // Continue with normal processing
}
```

**Applied to**:
- ✅ `/api/auth/login` - Auth preset (10/15min)
- ✅ `/api/auth/register` - Auth preset (10/15min)
- ✅ `/api/reviews` GET - Read-only preset (300/15min)
- ✅ `/api/reviews` POST - API preset (100/15min)

### 3. CORS Configuration

**Location**: [next/server/middleware/security.ts](next/server/middleware/security.ts)

Controls which origins can access your API.

**Configuration**:
- Allows localhost (development)
- Allows production domain from `NEXT_PUBLIC_APP_URL` env variable
- Custom origins via `ALLOWED_ORIGINS` env variable (comma-separated)
- Credentials support enabled
- Preflight request handling (OPTIONS method)

**Headers Set**:
- `Access-Control-Allow-Origin`
- `Access-Control-Allow-Methods`
- `Access-Control-Allow-Headers`
- `Access-Control-Allow-Credentials`
- `Access-Control-Max-Age`

**Environment Variable**:
```env
# .env
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 4. Security Headers (OWASP Recommended)

**Location**: [next/server/middleware/security.ts](next/server/middleware/security.ts)

Implements OWASP recommended security headers to protect against common attacks.

**Headers**:
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-XSS-Protection: 1; mode=block` - XSS protection (legacy browsers)
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information
- `Permissions-Policy` - Restricts browser features (camera, microphone, etc.)
- `Content-Security-Policy` - Comprehensive CSP policy

**CSP Policy**:
```
default-src 'self'
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
img-src 'self' data: https: blob:
font-src 'self' https://fonts.gstatic.com
connect-src 'self' https://maps.googleapis.com
frame-src 'self'
```

**Applied Globally**: All API routes via [next/middleware.ts](next/middleware.ts)

### 5. Input Sanitization (XSS Prevention)

**Location**: [next/server/utils/sanitize.ts](next/server/utils/sanitize.ts)

Sanitizes all user input to prevent Cross-Site Scripting (XSS) attacks.

**Functions**:
- `sanitizeHtml()` - Removes all HTML tags and escapes special characters
- `sanitizeText()` - Sanitizes text while preserving quotes
- `sanitizeUrl()` - Blocks malicious URL schemes (javascript:, data:, etc.)
- `sanitizeObject()` - Recursively sanitizes all string fields in an object

**Applied to**:
- ✅ **Reviews**: Comments and user names ([reviews.service.ts:76-77](next/server/services/reviews.service.ts#L76-L77), [reviews.service.ts:143-145](next/server/services/reviews.service.ts#L143-L145))
- ✅ **Locations**: Name, description, address, city, phone, email, website ([locations.service.ts:239-246](next/server/services/locations.service.ts#L239-L246), [locations.service.ts:282-289](next/server/services/locations.service.ts#L282-L289))
- ✅ **Users**: Name and email ([users.service.ts:40-41](next/server/services/users.service.ts#L40-L41), [users.service.ts:96-100](next/server/services/users.service.ts#L96-L100))

**Example**:
```typescript
import { sanitizeText } from '@/server/utils/sanitize';

const userInput = '<script>alert("XSS")</script>Hello';
const safe = sanitizeText(userInput);
// Result: "Hello" (script tags removed)
```

## 🌐 Global Middleware

**Location**: [next/middleware.ts](next/middleware.ts)

Automatically applies security headers to all API routes.

**Features**:
- Handles CORS preflight (OPTIONS) requests
- Applies security headers to all responses
- Runs on all `/api/*` routes

## 📝 Implementation Checklist

- [x] Password hashing with bcrypt
- [x] Rate limiting middleware
- [x] CORS configuration
- [x] Security headers (OWASP)
- [x] Input sanitization
- [x] Global middleware for security headers
- [x] Rate limiting on auth endpoints
- [x] Rate limiting on API endpoints
- [x] Sanitization in all services

## ⚠️ Production Recommendations

### Upgrade Rate Limiting to Redis

The current rate limiting uses in-memory storage, which doesn't persist across server restarts and doesn't work with multiple server instances.

**For production, use Redis**:

1. Install Redis client:
```bash
npm install ioredis
```

2. Update rate limit storage in [rateLimit.ts](next/server/middleware/rateLimit.ts):
```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Replace Map with Redis
const entry = await redis.get(key);
await redis.setex(key, windowMs / 1000, JSON.stringify(entry));
```

3. Add Redis URL to environment:
```env
REDIS_URL=redis://localhost:6379
# Or use a managed Redis service like Upstash, Redis Cloud, etc.
```

### Environment Variables

Add these to your `.env` file:

```env
# Security
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Redis (recommended for production rate limiting)
REDIS_URL=your-redis-connection-string
```

### Additional Security Measures (Future)

Consider implementing these for enhanced security:

- [ ] **2FA (Two-Factor Authentication)** - Extra layer of account security
- [ ] **Email Verification** - Verify user email addresses
- [ ] **Password Reset Flow** - Secure password recovery
- [ ] **OAuth Providers** - Google, GitHub, etc.
- [ ] **Session Management** - Proper session invalidation
- [ ] **Audit Logging** - Track security-relevant events
- [ ] **HTTPS Enforcement** - Redirect HTTP to HTTPS
- [ ] **Rate Limiting per User** - In addition to IP-based limiting
- [ ] **Input Length Limits** - Prevent buffer overflow attacks
- [ ] **SQL Injection Protection** - Already handled by Prisma ORM

## 🔒 Security Best Practices

1. **Never commit secrets** - Use `.env` files and add them to `.gitignore`
2. **Rotate secrets regularly** - Change API keys, tokens periodically
3. **Use HTTPS in production** - Enabled by default on Vercel/Netlify
4. **Keep dependencies updated** - Run `npm audit` regularly
5. **Monitor for vulnerabilities** - Use tools like Snyk or GitHub Dependabot
6. **Implement proper logging** - Track failed login attempts, etc.
7. **Use security headers** - Already implemented ✅
8. **Validate all inputs** - Using Zod schemas ✅
9. **Hash passwords** - Using bcrypt ✅
10. **Rate limit APIs** - Implemented ✅

## 📊 Security Score

**Current Implementation**: 8/10

**Strengths**:
- ✅ Password hashing
- ✅ Rate limiting
- ✅ CORS configuration
- ✅ Security headers
- ✅ Input sanitization
- ✅ SQL injection protection (Prisma)
- ✅ Type safety (TypeScript)

**Areas for Improvement**:
- ⚠️ Redis-based rate limiting (for production scale)
- ⚠️ 2FA and email verification (for user accounts)
- ⚠️ OAuth providers (for social login)

## 🚀 Testing Security

### Test Rate Limiting

```bash
# Make 11 requests quickly to trigger rate limit
for i in {1..11}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test123"}'
done

# Expected: 11th request returns 429 Too Many Requests
```

### Test XSS Prevention

```bash
# Try to submit XSS payload
curl -X POST http://localhost:3000/api/reviews \
  -H "Content-Type: application/json" \
  -H "x-demo-user-id: user1" \
  -d '{
    "locationId": "loc1",
    "rating": 5,
    "comment": "<script>alert(\"XSS\")</script>Great place!"
  }'

# Expected: Script tags are stripped from the comment
```

### Test CORS

```bash
# Request from unauthorized origin should be blocked/limited
curl -X GET http://localhost:3000/api/locations \
  -H "Origin: https://evil.com"

# Expected: CORS headers present but origin not in allow list
```

---

**Last Updated**: 2024-01-15
**Security Implementation Version**: 1.0.0
