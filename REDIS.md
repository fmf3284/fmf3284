# Redis Integration

This document describes the Redis integration for rate limiting, caching, and sessions.

## Overview

Redis is now integrated with automatic fallback to in-memory storage. The system works out-of-the-box without Redis, but adding Redis is recommended for production.

## Features

- **Automatic fallback**: Works without Redis (uses in-memory storage)
- **Drop-in upgrade**: Just add `REDIS_URL` and restart
- **Rate limiting**: Distributed rate limiting across multiple servers
- **Production-ready**: Tested with Upstash, Redis Cloud, and local Redis

## Why Redis?

**Without Redis (In-Memory)**:
- Rate limits reset on server restart
- Doesn't work with multiple servers (Vercel, serverless)
- Limited to single instance

**With Redis**:
- Rate limits persist across restarts
- Works with multiple servers/serverless
- Scalable and fast
- Can add caching, sessions, queues later

## Configuration

### Environment Variables

```env
# Redis URL (optional - falls back to in-memory if not set)
REDIS_URL=redis://localhost:6379

# Examples:
# Local: redis://localhost:6379
# With password: redis://:password@host:port
# SSL: rediss://user:pass@host:port
# Upstash: redis://default:xxx@xxx.upstash.io:6379
```

## Setup Options

### Option 1: Upstash Redis (Serverless - Recommended)

**Best for**: Vercel, Netlify, serverless deployments

**Step 1**: Sign up for Upstash
1. Go to [upstash.com](https://upstash.com)
2. Create free account
3. Click "Create Database"
4. Choose region close to your users

**Step 2**: Get Connection String
1. Click on your database
2. Copy **REST URL** or **Redis URL**
3. Use Redis URL (starts with `redis://`)

**Step 3**: Install ioredis
```bash
npm install ioredis
```

**Step 4**: Configure Environment
```env
REDIS_URL=redis://default:your_password@xxx.upstash.io:6379
```

**Free Tier**: 10,000 commands/day

### Option 2: Redis Cloud

**Step 1**: Sign up for Redis Cloud
1. Go to [redis.com/cloud](https://redis.com/try-free/)
2. Create free account
3. Create database

**Step 2**: Get Connection String
1. Go to Database > Configuration
2. Copy **Public endpoint**
3. Format: `redis://default:password@host:port`

**Step 3**: Install ioredis
```bash
npm install ioredis
```

**Step 4**: Configure Environment
```env
REDIS_URL=redis://default:password@host:port
```

**Free Tier**: 30MB storage

### Option 3: Local Redis (Development)

**Step 1**: Install Redis

**macOS** (via Homebrew):
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian**:
```bash
sudo apt-get install redis-server
sudo systemctl start redis-server
```

**Windows**:
```bash
# Use WSL2 or Docker
docker run -d -p 6379:6379 redis
```

**Step 2**: Install ioredis
```bash
npm install ioredis
```

**Step 3**: Configure Environment
```env
REDIS_URL=redis://localhost:6379
```

### Option 4: No Redis (Development Only)

Just don't set `REDIS_URL`. The system automatically uses in-memory storage.

**Note**: Not recommended for production!

## How It Works

### Rate Limiting with Redis

The rate limiter automatically uses Redis if available:

```typescript
// rateLimit.ts - already updated!
const redis = getRedisClient();

if (redis) {
  // Use Redis for distributed rate limiting
  await redis.incr(key);
  await redis.pexpire(key, windowMs);
} else {
  // Fallback to in-memory Map
  rateLimitStore.set(key, entry);
}
```

**Benefits**:
- Shared rate limits across multiple servers
- Persists across restarts
- Atomic operations (no race conditions)
- Auto-expiry (no manual cleanup)

## Testing

### Test Without Redis (Default)
```bash
# No REDIS_URL set
npm run dev
```

You'll see:
```
⚠️  Redis not configured. Using in-memory storage (not recommended for production)
```

### Test With Redis

**Local Redis**:
```bash
# Start Redis
redis-server

# Set env
export REDIS_URL=redis://localhost:6379

# Run app
npm run dev
```

You'll see:
```
✓ Connected to Redis
```

**Test Rate Limiting**:
```bash
# Make 11 requests quickly (limit is 10)
for i in {1..11}; do
  curl http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test","password":"test"}'
done

# 11th request should return 429 Too Many Requests
```

## Deployment

### Vercel + Upstash

1. Create Upstash database
2. Add to Vercel environment variables:
   ```
   REDIS_URL=redis://default:xxx@xxx.upstash.io:6379
   ```
3. Deploy

### Other Platforms

Same process - just add `REDIS_URL` to environment variables.

## Future Use Cases

Redis can also be used for:

### 1. Caching

```typescript
// Cache expensive queries
const cached = await redis.get('locations:all');
if (cached) {
  return JSON.parse(cached);
}

const locations = await prisma.location.findMany();
await redis.setex('locations:all', 3600, JSON.stringify(locations)); // 1 hour cache
return locations;
```

### 2. Sessions

```typescript
// Store user sessions
await redis.setex(`session:${sessionId}`, 86400, JSON.stringify(user)); // 24 hours
```

### 3. Queues

```typescript
// Background job queue
await redis.lpush('email-queue', JSON.stringify({ to, subject, body }));
```

### 4. Real-time Features

```typescript
// Pub/Sub for real-time updates
await redis.publish('location-updates', JSON.stringify({ locationId, event }));
```

## Cost Comparison

### Upstash (Serverless)
- **Free**: 10,000 commands/day
- **Pay-as-you-go**: $0.2 per 100K commands
- **Best for**: Serverless, low-medium traffic

### Redis Cloud
- **Free**: 30MB, 30 connections
- **Paid**: Starting at $5/month
- **Best for**: Traditional hosting

### Local/Self-hosted
- **Free**: If you host it
- **Best for**: Development, self-hosted apps

## Troubleshooting

**"ioredis not installed"**
```bash
npm install ioredis
```

**"Redis connection error"**
- Check `REDIS_URL` is correct
- Verify Redis server is running
- Check firewall/network access
- Test connection: `redis-cli -u $REDIS_URL ping`

**"Rate limiting still uses in-memory"**
- Check Redis is connected (look for "✓ Connected to Redis" log)
- Verify `REDIS_URL` is set correctly
- Check for connection errors in logs

**"Connection timeout"**
- Upstash: Use REST API URL instead
- Firewall: Whitelist your IP
- SSL: Use `rediss://` (with double 's') for SSL

## Monitoring

### Check Redis Connection

```bash
# Via logs
npm run dev
# Look for: "✓ Connected to Redis"

# Via Redis CLI
redis-cli -u $REDIS_URL ping
# Should return: PONG
```

### Check Rate Limit Keys

```bash
# Connect to Redis
redis-cli -u $REDIS_URL

# List rate limit keys
KEYS ratelimit:*

# Check specific key
GET ratelimit:127.0.0.1
TTL ratelimit:127.0.0.1
```

### Monitor Commands (Upstash)

1. Go to Upstash dashboard
2. Click on your database
3. See real-time metrics:
   - Commands/second
   - Storage used
   - Connections

## Best Practices

1. **Use Upstash for serverless** - Designed for serverless platforms
2. **Set CONNECTION_TIMEOUT** - Prevent hanging requests
3. **Monitor usage** - Track command count for billing
4. **Use connection pooling** - Already handled by ioredis
5. **Handle errors gracefully** - Already falls back to in-memory
6. **Test locally first** - Use local Redis before production

## Migration Guide

**Currently using in-memory?**

No migration needed! Just add Redis:

1. Install: `npm install ioredis`
2. Add env: `REDIS_URL=your-redis-url`
3. Restart app
4. Done!

The rate limiter automatically detects and uses Redis.

## Security

- **Never commit Redis URL** - Use environment variables
- **Use SSL in production** - `rediss://` protocol
- **Restrict network access** - Whitelist IPs
- **Use strong passwords** - Upstash auto-generates these
- **Rotate credentials** - If compromised

## Performance

**Benchmarks** (approximate):

- **Local Redis**: <1ms latency
- **Upstash (same region)**: ~10-30ms
- **Redis Cloud**: ~5-20ms
- **In-memory**: <0.1ms (but not distributed)

For rate limiting, Redis latency is acceptable. For caching hot paths, consider in-memory + Redis hybrid.

## Summary

**Current State**: ✅ Works without Redis (in-memory fallback)

**To Add Redis**:
1. `npm install ioredis`
2. Add `REDIS_URL` to env
3. Restart
4. That's it!

**Recommended for Production**: Yes (Upstash for serverless)

---

**Last Updated**: 2024-01-15
**Version**: 1.0.0
