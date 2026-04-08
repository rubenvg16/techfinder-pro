import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchDummyJSONProducts } from './dummyjson';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('dummyjson.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Product search', () => {
    it('should return products from DummyJSON API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            products: [
              {
                id: 1,
                title: 'iPhone 15 Pro Max',
                description: 'Latest iPhone model',
                price: 1199.00,
                discountPercentage: 10,
                rating: 4.5,
                stock: 50,
                brand: 'Apple',
                category: 'smartphones',
                thumbnail: 'https://dummyjson.com/thumbnail/iphone.jpg',
                images: ['https://dummyjson.com/images/iphone1.jpg', 'https://dummyjson.com/images/iphone2.jpg'],
              },
              {
                id: 2,
                title: 'Samsung Galaxy S24',
                description: 'Latest Samsung phone',
                price: 899.00,
                discountPercentage: 5,
                rating: 4.2,
                stock: 30,
                brand: 'Samsung',
                category: 'smartphones',
                thumbnail: 'https://dummyjson.com/thumbnail/galaxy.jpg',
                images: ['https://dummyjson.com/images/galaxy1.jpg'],
              },
            ],
            total: 2,
            skip: 0,
            limit: 20,
          }),
      });

      const products = await searchDummyJSONProducts('iPhone');

      expect(products).toHaveLength(2);
      expect(products[0].id).toBeDefined();
      expect(products[0].title).toBe('iPhone 15 Pro Max');
      expect(products[0].price).toBe(1199);
      expect(products[0].currency).toBe('USD');
      expect(products[0].source).toBe('dummyjson');
      expect(products[0].url).toBe('https://dummyjson.com/products/1');
      expect(products[0].imageUrl).toBe('https://dummyjson.com/thumbnail/iphone.jpg');
    });

    it('should use first image if thumbnail is not available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            products: [
              {
                id: 1,
                title: 'Product',
                description: 'Description',
                price: 100,
                thumbnail: '',
                images: ['https://dummyjson.com/image1.jpg'],
              },
            ],
            total: 1,
            skip: 0,
            limit: 20,
          }),
      });

      const products = await searchDummyJSONProducts('product');

      expect(products[0].imageUrl).toBe('https://dummyjson.com/image1.jpg');
    });

    it('should encode query parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ products: [], total: 0, skip: 0, limit: 20 }),
      });

      await searchDummyJSONProducts('iPhone 15 Pro Max');

      expect(mockFetch.mock.calls[0][0]).toBe(
        'https://dummyjson.com/products/search?q=iPhone%2015%20Pro%20Max&limit=20'
      );
    });
  });

  describe('Error handling', () => {
    it('should return empty array on network error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const products = await searchDummyJSONProducts('test');

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

      const products = await searchDummyJSONProducts('test');

      expect(consoleSpy).toHaveBeenCalled();
      expect(products).toEqual([]);
      consoleSpy.mockRestore();
    });

    it('should handle empty product list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ products: [], total: 0, skip: 0, limit: 20 }),
      });

      const products = await searchDummyJSONProducts('nonexistent xyz');

      expect(products).toEqual([]);
    });
  });
});