/**
 * Redis Connection (Optional)
 *
 * Uses in-memory storage if Redis is not configured.
 * This is fine for development and small deployments.
 */

// In-memory fallback store
const memoryStore = new Map<string, { value: string; expiry?: number }>();

/**
 * Get Redis client - returns null (use in-memory fallback)
 */
export function getRedisClient() {
  // Redis is optional - using in-memory storage
  return null;
}

/**
 * In-memory get
 */
export async function memGet(key: string): Promise<string | null> {
  const item = memoryStore.get(key);
  if (!item) return null;
  
  // Check expiry
  if (item.expiry && Date.now() > item.expiry) {
    memoryStore.delete(key);
    return null;
  }
  
  return item.value;
}

/**
 * In-memory set
 */
export async function memSet(key: string, value: string, ttlSeconds?: number): Promise<void> {
  memoryStore.set(key, {
    value,
    expiry: ttlSeconds ? Date.now() + (ttlSeconds * 1000) : undefined,
  });
}

/**
 * In-memory delete
 */
export async function memDel(key: string): Promise<void> {
  memoryStore.delete(key);
}

/**
 * In-memory increment
 */
export async function memIncr(key: string): Promise<number> {
  const item = memoryStore.get(key);
  const newValue = (parseInt(item?.value || '0') + 1).toString();
  memoryStore.set(key, { ...item, value: newValue });
  return parseInt(newValue);
}

/**
 * Close Redis connection (no-op for memory)
 */
export async function closeRedis() {
  // No-op for in-memory storage
}
