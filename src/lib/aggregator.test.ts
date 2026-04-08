import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { searchWithTimeout } from './aggregator';

vi.mock('./cache', async () => {
  const actual = await vi.importActual('./cache');
  return {
    ...(actual as any),
    getCache: vi.fn().mockResolvedValue(null),
    setCache: vi.fn().mockResolvedValue(true),
    cacheKeys: {
      search: vi.fn((query: string) => `search:${query}`),
    },
    TTL: { SEARCH: 600 },
  };
});

vi.mock('./api/ebay', () => ({
  searchEbayProducts: vi.fn(),
}));

vi.mock('./api/fakestore', () => ({
  searchFakeStoreProducts: vi.fn(),
}));

vi.mock('./api/dummyjson', () => ({
  searchDummyJSONProducts: vi.fn(),
}));

vi.mock('./api/google-shopping', () => ({
  searchGoogleShoppingProducts: vi.fn(),
}));

import { searchEbayProducts } from './api/ebay';
import { searchFakeStoreProducts } from './api/fakestore';
import { searchDummyJSONProducts } from './api/dummyjson';
import { searchGoogleShoppingProducts } from './api/google-shopping';
import { getCache, setCache } from './cache';

describe('aggregator.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('4.1.1 - Timeout handling', () => {
    it('should return timeout=true when all sources timeout', async () => {
      vi.mocked(searchEbayProducts).mockImplementation(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 500))
      );
      vi.mocked(searchFakeStoreProducts).mockImplementation(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 500))
      );
      vi.mocked(searchDummyJSONProducts).mockImplementation(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 500))
      );
      vi.mocked(searchGoogleShoppingProducts).mockImplementation(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 500))
      );

      const result = await searchWithTimeout('test query');

      expect(result.timeout).toBe(true);
      expect(result.sourcesFailed).toContain('ebay');
      expect(result.sourcesFailed).toContain('fakestore');
      expect(result.sourcesFailed).toContain('dummyjson');
      expect(result.sourcesFailed).toContain('google');
      expect(result.sourcesFailed).toBeDefined();
    });

    it('should return timeout=false when at least one source succeeds', async () => {
      vi.mocked(searchEbayProducts).mockResolvedValue([
        { id: 'ebay-1', title: 'Product 1', price: 100, currency: 'USD', source: 'ebay', url: 'http://test.com' },
      ]);
      vi.mocked(searchFakeStoreProducts).mockImplementation(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 500))
      );
      vi.mocked(searchDummyJSONProducts).mockImplementation(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 500))
      );
      vi.mocked(searchGoogleShoppingProducts).mockImplementation(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 500))
      );

      const result = await searchWithTimeout('test query');

      expect(result.timeout).toBe(false);
      expect(result.products.length).toBeGreaterThan(0);
      expect(result.sourcesFailed).toContain('fakestore');
      expect(result.sourcesFailed).toContain('dummyjson');
      expect(result.sourcesFailed).toContain('google');
      expect(result.sourcesFailed).toBeDefined();
    });
  });

  describe('4.1.2 - Partial results', () => {
    it('should return products from successful sources when some fail', async () => {
      vi.mocked(searchEbayProducts).mockResolvedValue([
        { id: 'ebay-1', title: 'eBay Product', price: 100, currency: 'USD', source: 'ebay', url: 'http://test.com' },
      ]);
      vi.mocked(searchFakeStoreProducts).mockRejectedValue(new Error('FakeStoreAPI error'));
      vi.mocked(searchDummyJSONProducts).mockResolvedValue([
        { id: 'dummyjson-1', title: 'DummyJSON Product', price: 50, currency: 'USD', source: 'dummyjson', url: 'http://test3.com' },
      ]);
      vi.mocked(searchGoogleShoppingProducts).mockResolvedValue([
        { id: 'google-1', title: 'Google Product', price: 150, currency: 'USD', source: 'google', url: 'http://test2.com' },
      ]);

      const result = await searchWithTimeout('test query');

      expect(result.products.length).toBe(3);
      expect(result.products.find(p => p.source === 'ebay')).toBeDefined();
      expect(result.products.find(p => p.source === 'google')).toBeDefined();
      expect(result.products.find(p => p.source === 'dummyjson')).toBeDefined();
      expect(result.sourcesFailed).toContain('fakestore');
      expect(result.sourcesFailed).toBeDefined();
    });

    it('should deduplicate products with same source and title and price', async () => {
      vi.mocked(searchEbayProducts).mockResolvedValue([
        { id: 'ebay-1', title: 'Same Product', price: 100, currency: 'USD', source: 'ebay', url: 'http://test.com' },
        { id: 'ebay-2', title: 'Same Product', price: 100, currency: 'USD', source: 'ebay', url: 'http://test2.com' },
      ]);
      vi.mocked(searchFakeStoreProducts).mockResolvedValue([]);
      vi.mocked(searchDummyJSONProducts).mockResolvedValue([]);
      vi.mocked(searchGoogleShoppingProducts).mockResolvedValue([]);

      const result = await searchWithTimeout('test query');

      const sameTitleProducts = result.products.filter(p => p.title === 'Same Product');
      expect(sameTitleProducts.length).toBe(1); // Only one should remain after dedup
    });
  });

  describe('4.1.3 - All sources fail', () => {
    it('should return empty products array when all sources fail', async () => {
      vi.mocked(searchEbayProducts).mockRejectedValue(new Error('eBay error'));
      vi.mocked(searchFakeStoreProducts).mockRejectedValue(new Error('FakeStoreAPI error'));
      vi.mocked(searchDummyJSONProducts).mockRejectedValue(new Error('DummyJSON error'));
      vi.mocked(searchGoogleShoppingProducts).mockRejectedValue(new Error('Google error'));

      const result = await searchWithTimeout('test query');

      expect(result.products).toEqual([]);
      expect(result.sourcesFailed).toContain('ebay');
      expect(result.sourcesFailed).toContain('fakestore');
      expect(result.sourcesFailed).toContain('dummyjson');
      expect(result.sourcesFailed).toContain('google');
      expect(result.sourcesFailed).toBeDefined();
      expect(result.timeout).toBe(true);
    });

    it('should cache the failed result', async () => {
      vi.mocked(searchEbayProducts).mockRejectedValue(new Error('eBay error'));
      vi.mocked(searchFakeStoreProducts).mockRejectedValue(new Error('FakeStoreAPI error'));
      vi.mocked(searchDummyJSONProducts).mockRejectedValue(new Error('DummyJSON error'));
      vi.mocked(searchGoogleShoppingProducts).mockRejectedValue(new Error('Google error'));

      await searchWithTimeout('test query');

      expect(setCache).toHaveBeenCalled();
    });
  });

  describe('Cache behavior', () => {
    it('should return cached results when available', async () => {
      const cachedResponse = {
        products: [{ id: 'cached-1', title: 'Cached Product', price: 50, currency: 'USD', source: 'ebay', url: 'http://test.com' }],
        cached: false,
        timeout: false,
      };
      vi.mocked(getCache).mockResolvedValue(cachedResponse);

      const result = await searchWithTimeout('test query');

      expect(result.cached).toBe(true);
      expect(result.products[0].title).toBe('Cached Product');
      expect(searchEbayProducts).not.toHaveBeenCalled();
    });

    it('should normalize query before caching', async () => {
      vi.mocked(searchEbayProducts).mockResolvedValue([]);
      vi.mocked(searchFakeStoreProducts).mockResolvedValue([]);
      vi.mocked(searchDummyJSONProducts).mockResolvedValue([]);
      vi.mocked(searchGoogleShoppingProducts).mockResolvedValue([]);

      await searchWithTimeout('  TEST QUERY  ');

      expect(getCache).toHaveBeenCalledWith('search:test query');
    });
  });
});