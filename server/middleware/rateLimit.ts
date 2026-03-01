import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '../db/redis';

interface RateLimitConfig {
  windowMs: number;
  max: number;
}

// In-memory store for rate limiting (fallback when Redis not available)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting middleware
 * Limits requests per IP address
 * Uses Redis if available, falls back to in-memory storage
 */
export function rateLimit(config: RateLimitConfig) {
  const { windowMs, max } = config;

  return async function rateLimitMiddleware(request: NextRequest) {
    // Get client IP
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';

    const now = Date.now();
    const key = `ratelimit:${ip}`;
    const redis = getRedisClient();

    // Use Redis if available
    if (redis) {
      return rateLimitWithRedis(redis, key, windowMs, max, now);
    }

    // Fallback to in-memory storage
    return rateLimitInMemory(key, windowMs, max, now);
  };
}

/**
 * Rate limit using Redis
 */
async function rateLimitWithRedis(
  redis: any,
  key: string,
  windowMs: number,
  max: number,
  now: number
): Promise<NextResponse | null> {
  try {
    // Use Redis pipeline for atomic operations
    const pipeline = redis.pipeline();
    pipeline.incr(key);
    pipeline.ttl(key);
    const results = await pipeline.exec();

    const count = results[0][1]; // First command result
    const ttl = results[1][1]; // Second command result

    // Set expiry if this is a new key
    if (ttl === -1) {
      await redis.pexpire(key, windowMs);
    }

    // Check if rate limit exceeded
    if (count > max) {
      const resetTime = now + (ttl > 0 ? ttl * 1000 : windowMs);

      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please try again later.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((resetTime - now) / 1000).toString(),
            'X-RateLimit-Limit': max.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(resetTime).toISOString(),
          },
        }
      );
    }

    return null;
  } catch (error) {
    console.error('Redis rate limit error:', error);
    // Fallback to in-memory if Redis fails
    return rateLimitInMemory(key, windowMs, max, now);
  }
}

/**
 * Rate limit using in-memory storage (fallback)
 */
function rateLimitInMemory(
  key: string,
  windowMs: number,
  max: number,
  now: number
): NextResponse | null {
  // Get or create rate limit entry
  let entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // Create new entry or reset expired entry
    entry = {
      count: 0,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, entry);
  }

  // Increment request count
  entry.count++;

  // Check if rate limit exceeded
  if (entry.count > max) {
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests. Please try again later.',
      },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((entry.resetTime - now) / 1000).toString(),
          'X-RateLimit-Limit': max.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(entry.resetTime).toISOString(),
        },
      }
    );
  }

  // Clean up old entries periodically
  if (Math.random() < 0.01) { // 1% chance on each request
    const keysToDelete: string[] = [];
    rateLimitStore.forEach((value, key) => {
      if (now > value.resetTime + windowMs) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => rateLimitStore.delete(key));
  }

  // Return null to indicate request should proceed
  return null;
}

/**
 * Preset rate limit configurations
 */
export const rateLimitPresets = {
  // Strict rate limit for auth endpoints (10 requests per 15 minutes)
  auth: { windowMs: 15 * 60 * 1000, max: 10 },

  // Standard rate limit for API endpoints (100 requests per 15 minutes)
  api: { windowMs: 15 * 60 * 1000, max: 100 },

  // Generous rate limit for read-only endpoints (300 requests per 15 minutes)
  readOnly: { windowMs: 15 * 60 * 1000, max: 300 },
};
