import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchGoogleShoppingProducts } from './google-shopping';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('google-shopping.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('4.5.1 - Product search with API key', () => {
    it('should return products when Serper API key is configured', async () => {
      vi.stubEnv('SERPER_API_KEY', 'test-serper-key');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            shopping: [
              {
                title: 'Apple MacBook Pro 14" M3',
                price: 1999,
                currency: 'USD',
                link: 'https://www.apple.com/shop/buy-mac/macbook-pro/14-inch',
                image_url: 'https://apple.com/macbook.jpg',
                source: 'Apple',
              },
              {
                title: 'MacBook Air M2',
                price: 1199,
                currency: 'USD',
                link: 'https://www.apple.com/shop/buy-mac/macbook-air-13-and-15',
                image_url: 'https://apple.com/air.jpg',
                source: 'Apple',
              },
            ],
          }),
      });

      const products = await searchGoogleShoppingProducts('MacBook Pro');

      expect(products).toHaveLength(2);
      expect(products[0].id).toBeDefined();
      expect(products[0].title).toBe('Apple MacBook Pro 14" M3');
      expect(products[0].price).toBe(1999);
      expect(products[0].currency).toBe('USD');
      expect(products[0].source).toBe('google');
      expect(products[0].url).toBe('https://www.apple.com/shop/buy-mac/macbook-pro/14-inch');
      expect(products[0].imageUrl).toBe('https://apple.com/macbook.jpg');
    });

    it('should include correct headers in request', async () => {
      vi.stubEnv('SERPER_API_KEY', 'my-serper-key');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ shopping: [] }),
      });

      await searchGoogleShoppingProducts('test');

      const call = mockFetch.mock.calls[0];
      expect(call[0]).toBe('https://google.serper.dev/shopping');
      expect(call[1].method).toBe('POST');
      expect(call[1].headers['X-API-KEY']).toBe('my-serper-key');
      expect(call[1].headers['Content-Type']).toBe('application/json');
    });
  });

  describe('4.5.2 - Fallback behavior without API key', () => {
    it('should return mock data when API key is not configured', async () => {
      vi.stubEnv('SERPER_API_KEY', '');

      const products = await searchGoogleShoppingProducts('iPhone 15');

      expect(products).toHaveLength(3);
      expect(products[0].source).toBe('google');
      expect(products[0].title).toContain('Google Shopping');
    });

    it('should include unique IDs in mock data', async () => {
      vi.stubEnv('SERPER_API_KEY', '');

      const products = await searchGoogleShoppingProducts('test');

      expect(products[0].id).toMatch(/^google-\d+-[a-z0-9]+$/);
      expect(products[1].id).toMatch(/^google-\d+-[a-z0-9]+$/);
      expect(products[0].id).not.toBe(products[1].id);
    });
  });

  describe('4.5.3 - Product mapping', () => {
    it('should generate unique IDs for each product', async () => {
      vi.stubEnv('SERPER_API_KEY', 'test-serper-key');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            shopping: [
              {
                title: 'Product 1',
                price: 100,
                currency: 'USD',
                link: 'https://example.com/product1',
              },
              {
                title: 'Product 2',
                price: 100,
                currency: 'USD',
                link: 'https://example.com/product2',
              },
            ],
          }),
      });

      const products = await searchGoogleShoppingProducts('product');

      expect(products[0].id).not.toBe(products[1].id);
      expect(products[0].id).toMatch(/^google-.+-\d+-.+$/);
      expect(products[1].id).toMatch(/^google-.+-\d+-.+$/);
    });

    it('should handle missing price', async () => {
      vi.stubEnv('SERPER_API_KEY', 'test-serper-key');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            shopping: [
              {
                title: 'Product without price',
                link: 'https://example.com/product',
              },
            ],
          }),
      });

      const products = await searchGoogleShoppingProducts('test');

      expect(products[0].price).toBe(0);
    });

    it('should handle empty shopping array', async () => {
      vi.stubEnv('SERPER_API_KEY', 'test-serper-key');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ shopping: [] }),
      });

      const products = await searchGoogleShoppingProducts('nonexistent xyz');

      expect(products).toEqual([]);
    });
  });

  describe('4.5.4 - Error handling', () => {
    it('should return mock data on network error', async () => {
      vi.stubEnv('SERPER_API_KEY', 'test-serper-key');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const products = await searchGoogleShoppingProducts('test');

      expect(consoleSpy).toHaveBeenCalled();
      expect(products).toHaveLength(3);
      consoleSpy.mockRestore();
    });

    it('should return mock data when response JSON is malformed', async () => {
      vi.stubEnv('SERPER_API_KEY', 'test-serper-key');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      const products = await searchGoogleShoppingProducts('test');

      expect(products).toHaveLength(3);
    });

    it('should handle missing shopping key in response', async () => {
      vi.stubEnv('SERPER_API_KEY', 'test-serper-key');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const products = await searchGoogleShoppingProducts('test');

      expect(products).toEqual([]);
    });
  });
});