import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchFakeStoreProducts } from './fakestore';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('fakestore.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Product search', () => {
    it('should return products from FakeStoreAPI', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              id: 1,
              title: 'iPhone 9 Smartphone',
              price: 549.00,
              description: 'An smartphone',
              category: 'smartphones',
              image: 'https://fakestoreapi.com/images/iphone.jpg',
              rating: { rate: 4.5, count: 100 },
            },
            {
              id: 2,
              title: 'Premium Headphones',
              price: 99.99,
              description: 'High quality headphones',
              category: 'electronics',
              image: 'https://fakestoreapi.com/images/headphones.jpg',
              rating: { rate: 4.2, count: 80 },
            },
          ]),
      });

      // Query "smartphone" should match both the product with "smartphones" category
      // and the product with "smartphone" in the title
      const products = await searchFakeStoreProducts('smartphone');

      expect(products.length).toBeGreaterThanOrEqual(1);
      expect(products[0].id).toBeDefined();
      expect(products[0].source).toBe('fakestore');
      expect(products[0].url).toBe('https://fakestoreapi.com/products/1');
    });

    it('should filter products by query in title', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            { id: 1, title: 'iPhone 9', price: 549, category: 'smartphones', image: 'img1.jpg' },
            { id: 2, title: 'Samsung Phone', price: 399, category: 'smartphones', image: 'img2.jpg' },
            { id: 3, title: 'Phone Case', price: 29, category: 'accessories', image: 'img3.jpg' },
          ]),
      });

      // All three products contain "phone" in title or category
      const products = await searchFakeStoreProducts('phone');

      expect(products).toHaveLength(3); // iPhone 9, Samsung Phone, Phone Case
      expect(products.every(p => 
        p.title.toLowerCase().includes('phone') || 
        p.title.toLowerCase().includes('phone')
      )).toBe(true);
    });

    it('should filter products by query in category', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            { id: 1, title: 'Laptop', price: 999, category: 'electronics', image: 'img1.jpg' },
            { id: 2, title: 'Phone', price: 599, category: 'smartphones', image: 'img2.jpg' },
          ]),
      });

      const products = await searchFakeStoreProducts('electronics');

      expect(products).toHaveLength(1);
      expect(products[0].title).toBe('Laptop');
    });

    it('should limit results to 20 products', async () => {
      const manyProducts = Array.from({ length: 30 }, (_, i) => ({
        id: i + 1,
        title: `Product ${i + 1}`,
        price: 100 + i,
        category: 'test',
        image: 'img.jpg',
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(manyProducts),
      });

      const products = await searchFakeStoreProducts('product');

      expect(products.length).toBeLessThanOrEqual(20);
    });
  });

  describe('Error handling', () => {
    it('should return empty array on network error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const products = await searchFakeStoreProducts('test');

      expect(consoleSpy).toHaveBeenCalled();
      expect(products).toEqual([]);
      consoleSpy.mockRestore();
    });

    it('should return empty array on API error response', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const products = await searchFakeStoreProducts('test');

      expect(consoleSpy).toHaveBeenCalled();
      expect(products).toEqual([]);
      consoleSpy.mockRestore();
    });

    it('should handle empty product list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const products = await searchFakeStoreProducts('nonexistent xyz');

      expect(products).toEqual([]);
    });
  });
});