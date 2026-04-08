import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCache, setCache, deleteCache, cacheKeys, TTL } from './cache';

const { mockRedis } = vi.hoisted(() => ({
  mockRedis: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
}));

vi.mock('@upstash/redis', () => ({
  Redis: vi.fn().mockImplementation(() => mockRedis),
}));

describe('cache.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('4.2.1 - get functionality', () => {
    it('should return null when key does not exist', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await getCache('nonexistent-key');

      expect(result).toBeNull();
      expect(mockRedis.get).toHaveBeenCalledWith('nonexistent-key');
    });

    it('should return cached value when key exists', async () => {
      const cachedData = { products: [], cached: true };
      mockRedis.get.mockResolvedValue(cachedData);

      const result = await getCache('search:test');

      expect(result).toEqual(cachedData);
    });

    it('should return null on cache error', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis error'));

      const result = await getCache('search:test');

      expect(result).toBeNull();
    });
  });

  describe('4.2.2 - set functionality', () => {
    it('should return true on successful set', async () => {
      mockRedis.set.mockResolvedValue('OK');

      const result = await setCache('search:test', { products: [] }, 600);

      expect(result).toBe(true);
      expect(mockRedis.set).toHaveBeenCalledWith('search:test', { products: [] }, { ex: 600 });
    });

    it('should use default TTL when not provided', async () => {
      mockRedis.set.mockResolvedValue('OK');

      await setCache('search:test', { products: [] });

      expect(mockRedis.set).toHaveBeenCalledWith('search:test', { products: [] }, { ex: 600 });
    });

    it('should return false on set error', async () => {
      mockRedis.set.mockRejectedValue(new Error('Redis error'));

      const result = await setCache('search:test', { products: [] });

      expect(result).toBe(false);
    });
  });

  describe('4.2.3 - TTL expiration', () => {
    it('should set correct TTL for search cache', async () => {
      mockRedis.set.mockResolvedValue('OK');

      await setCache('search:test', { products: [] }, TTL.SEARCH);

      expect(mockRedis.set).toHaveBeenCalledWith(
        'search:test',
        { products: [] },
        { ex: TTL.SEARCH }
      );
    });

    it('should set correct TTL for product cache', async () => {
      mockRedis.set.mockResolvedValue('OK');

      await setCache('product:ebay:123', { id: '123' }, TTL.PRODUCT);

      expect(mockRedis.set).toHaveBeenCalledWith(
        'product:ebay:123',
        { id: '123' },
        { ex: TTL.PRODUCT }
      );
    });

    it('should allow custom TTL override', async () => {
      mockRedis.set.mockResolvedValue('OK');

      await setCache('custom:key', { data: 'test' }, 300);

      expect(mockRedis.set).toHaveBeenCalledWith('custom:key', { data: 'test' }, { ex: 300 });
    });
  });

  describe('4.2.4 - Cache key normalization', () => {
    it('should normalize search query to lowercase', () => {
      const key = cacheKeys.search('TEST Query');
      expect(key).toBe('search:test%20query');
    });

    it('should trim whitespace from search query', () => {
      const key = cacheKeys.search('  test  ');
      expect(key).toBe('search:test');
    });

    it('should encode search query for special characters', () => {
      const key = cacheKeys.search('test & more');
      expect(key).toContain('test%20%26%20more');
    });

    it('should create product cache key with source and externalId', () => {
      const key = cacheKeys.product('ebay', 'item-123');
      expect(key).toBe('product:ebay:item-123');
    });
  });

  describe('delete functionality', () => {
    it('should return true on successful delete', async () => {
      mockRedis.del.mockResolvedValue(1);

      const result = await deleteCache('search:test');

      expect(result).toBe(true);
      expect(mockRedis.del).toHaveBeenCalledWith('search:test');
    });

    it('should return false on delete error', async () => {
      mockRedis.del.mockRejectedValue(new Error('Redis error'));

      const result = await deleteCache('search:test');

      expect(result).toBe(false);
    });
  });

  describe('TTL export', () => {
    it('should export correct SEARCH TTL', () => {
      expect(TTL.SEARCH).toBe(600);
    });

    it('should export correct PRODUCT TTL', () => {
      expect(TTL.PRODUCT).toBe(1800);
    });

    it('should export correct PRICE TTL', () => {
      expect(TTL.PRICE).toBe(3600);
    });
  });
});