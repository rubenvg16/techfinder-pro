import { Redis } from '@upstash/redis';

function getRedisConfig() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required');
  }
  return {
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  };
}

let redisInstance: Redis | null = null;

function getRedisClient(): Redis {
  if (!redisInstance) {
    const config = getRedisConfig();
    redisInstance = new Redis({
      url: config.url,
      token: config.token,
    });
  }
  return redisInstance;
}

export type CacheKey = `search:${string}` | `product:${string}:${string}` | `price:${string}`;

function normalizeCacheKey(key: string): string {
  return key.toLowerCase().trim();
}

function getSearchCacheKey(query: string): CacheKey {
  const normalized = normalizeCacheKey(query);
  return `search:${encodeURIComponent(normalized)}` as CacheKey;
}

function getProductCacheKey(source: string, externalId: string): CacheKey {
  return `product:${source}:${externalId}` as CacheKey;
}

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const value = await getRedisClient().get(key);
    return value as T | null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

export async function setCache<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
  try {
    const ttl = ttlSeconds || 600;
    await getRedisClient().set(key, value, { ex: ttl });
    return true;
  } catch (error) {
    console.error('Cache set error:', error);
    return false;
  }
}

export async function deleteCache(key: string): Promise<boolean> {
  try {
    await getRedisClient().del(key);
    return true;
  } catch (error) {
    console.error('Cache delete error:', error);
    return false;
  }
}

export const cacheKeys = {
  search: getSearchCacheKey,
  product: getProductCacheKey,
};

export const TTL = {
  SEARCH: 600,
  PRODUCT: 1800,
  PRICE: 3600,
};
