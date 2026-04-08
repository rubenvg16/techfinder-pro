import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from './route';
import { searchWithTimeout } from '@/lib/aggregator';
import { NextRequest } from 'next/server';

vi.mock('@/lib/aggregator', () => ({
  searchWithTimeout: vi.fn(),
}));

function createNextRequest(url: string): NextRequest {
  return new NextRequest(url);
}

describe('api/search/route.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('4.7.1 - Valid queries', () => {
    it('should return products for valid search query', async () => {
      vi.mocked(searchWithTimeout).mockResolvedValue({
        products: [
          {
            id: 'ebay-1',
            title: 'Test Product',
            price: 100,
            currency: 'USD',
            source: 'ebay' as const,
            url: 'https://ebay.com/item/1',
          },
        ],
        cached: false,
        timeout: false,
      });

      const request = createNextRequest('http://localhost/api/search?q=laptop');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.products).toHaveLength(1);
      expect(data.products[0].title).toBe('Test Product');
    });

    it('should return cached results when available', async () => {
      vi.mocked(searchWithTimeout).mockResolvedValue({
        products: [],
        cached: true,
        timeout: false,
      });

      const request = createNextRequest('http://localhost/api/search?q=test');
      const response = await GET(request);

      const data = await response.json();
      expect(data.cached).toBe(true);
    });
  });

  describe('4.7.2 - Invalid queries', () => {
    it('should return 400 when query is missing', async () => {
      const request = createNextRequest('http://localhost/api/search');
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Query parameter "q" is required');
    });

    it('should return 400 when query is empty', async () => {
      const request = createNextRequest('http://localhost/api/search?q=');
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Query parameter "q" is required');
    });

    it('should return 400 when query is only whitespace', async () => {
      const request = createNextRequest('http://localhost/api/search?q=%20%20%20');
      const response = await GET(request);

      expect(response.status).toBe(400);
    });

    it('should return 400 when query exceeds 200 characters', async () => {
      const longQuery = 'a'.repeat(201);
      const request = createNextRequest(`http://localhost/api/search?q=${longQuery}`);
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Query too long (max 200 characters)');
    });

    it('should accept query at exactly 200 characters', async () => {
      const exactQuery = 'a'.repeat(200);
      vi.mocked(searchWithTimeout).mockResolvedValue({
        products: [],
        cached: false,
        timeout: false,
      });

      const request = createNextRequest(`http://localhost/api/search?q=${exactQuery}`);
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe('4.7.3 - Error handling', () => {
    it('should return 500 when search throws error', async () => {
      vi.mocked(searchWithTimeout).mockRejectedValue(new Error('Search failed'));

      const request = createNextRequest('http://localhost/api/search?q=test');
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Search failed');
    });

    it('should return empty products array on error', async () => {
      vi.mocked(searchWithTimeout).mockRejectedValue(new Error('API error'));

      const request = createNextRequest('http://localhost/api/search?q=test');
      const response = await GET(request);

      const data = await response.json();
      expect(data.products).toEqual([]);
    });
  });

  describe('4.7.4 - Caching behavior', () => {
    it('should call searchWithTimeout with normalized query', async () => {
      vi.mocked(searchWithTimeout).mockResolvedValue({
        products: [],
        cached: false,
        timeout: false,
      });

      const request = createNextRequest('http://localhost/api/search?q=Test%20Query');
      await GET(request);

      expect(searchWithTimeout).toHaveBeenCalledWith('Test Query');
    });

    it('should handle special characters in query', async () => {
      vi.mocked(searchWithTimeout).mockResolvedValue({
        products: [],
        cached: false,
        timeout: false,
      });

      const request = createNextRequest('http://localhost/api/search?q=iPhone%2015%20Pro');
      await GET(request);

      expect(searchWithTimeout).toHaveBeenCalledWith('iPhone 15 Pro');
    });
  });
});