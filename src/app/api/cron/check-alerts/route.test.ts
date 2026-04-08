import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';
import { getSupabaseClient } from '@/lib/supabase';
import { sendPriceAlert } from '@/lib/alerts';
import { searchWithTimeout } from '@/lib/aggregator';

vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: vi.fn(),
}));

vi.mock('@/lib/alerts', () => ({
  sendPriceAlert: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/aggregator', () => ({
  searchWithTimeout: vi.fn(),
}));

const { mockSupabase, mockFromFn } = vi.hoisted(() => {
  const mockFromFn = vi.fn();
  const mockSupabase = { from: mockFromFn };
  return { mockSupabase, mockFromFn };
});

describe('api/cron/check-alerts/route.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFromFn.mockReset();
    mockFromFn.mockImplementation((table: string) => {
      if (table === 'alerts') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        };
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { email: 'test@example.com' }, error: null }),
            }),
          }),
        };
      }
      return { select: vi.fn(), update: vi.fn() };
    });
    (getSupabaseClient as any).mockReturnValue(mockSupabase);
    process.env.CRON_SECRET = 'test-cron-secret';
  });

  const setupAlertsMock = (alerts: any[]) => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: alerts, error: null }),
        }),
      }),
    });
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
    mockFromFn.mockImplementation((table: string) => {
      if (table === 'alerts') {
        return { select: mockSelect, update: mockUpdate };
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { email: 'test@example.com' }, error: null }),
            }),
          }),
        };
      }
      return { select: vi.fn(), update: vi.fn() };
    });
    return { mockSelect, mockUpdate };
  };

  describe('4.9.1 - Authentication', () => {
    it('should return 401 when no auth header provided', async () => {
      const request = new NextRequest('http://localhost/api/cron/check-alerts');
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 when invalid cron secret', async () => {
      const request = new NextRequest('http://localhost/api/cron/check-alerts', {
        headers: { authorization: 'Bearer wrong-secret' },
      });
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should return 401 when malformed authorization header', async () => {
      const request = new NextRequest('http://localhost/api/cron/check-alerts', {
        headers: { authorization: 'InvalidFormat secret' },
      });
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should process request with valid cron secret', async () => {
      const request = new NextRequest('http://localhost/api/cron/check-alerts', {
        headers: { authorization: 'Bearer test-cron-secret' },
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe('4.9.2 - Price drop detection', () => {
    it('should trigger alert when price drops below target', async () => {
      vi.mocked(searchWithTimeout).mockResolvedValue({
        products: [
          {
            id: 'ebay-1',
            title: 'iPhone 15 Pro',
            price: 800,
            currency: 'USD',
            source: 'ebay',
            url: 'https://ebay.com/item/1',
          },
        ],
        cached: false,
        timeout: false,
      });

      const mockAlerts = [
        {
          id: 'alert-1',
          user_id: 'user-123',
          product_id: 'product-1',
          target_price: 1000,
          is_active: true,
          product: {
            id: 'product-1',
            title: 'iPhone 15 Pro',
            source: 'ebay',
          },
        },
      ];

      setupAlertsMock(mockAlerts);
      vi.mocked(sendPriceAlert).mockResolvedValue(true);

      const request = new NextRequest('http://localhost/api/cron/check-alerts', {
        headers: { authorization: 'Bearer test-cron-secret' },
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(sendPriceAlert).toHaveBeenCalled();
    });

    it('should NOT trigger alert when price is above target', async () => {
      vi.mocked(searchWithTimeout).mockResolvedValue({
        products: [
          {
            id: 'ebay-1',
            title: 'iPhone 15 Pro',
            price: 1200,
            currency: 'USD',
            source: 'ebay',
            url: 'https://ebay.com/item/1',
          },
        ],
        cached: false,
        timeout: false,
      });

      const mockAlerts = [
        {
          id: 'alert-1',
          user_id: 'user-123',
          product_id: 'product-1',
          target_price: 1000,
          is_active: true,
          product: {
            id: 'product-1',
            title: 'iPhone 15 Pro',
            source: 'ebay',
          },
        },
      ];

      setupAlertsMock(mockAlerts);

      const request = new NextRequest('http://localhost/api/cron/check-alerts', {
        headers: { authorization: 'Bearer test-cron-secret' },
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(sendPriceAlert).not.toHaveBeenCalled();
    });

    it('should NOT trigger alert when price equals target', async () => {
      vi.mocked(searchWithTimeout).mockResolvedValue({
        products: [
          {
            id: 'ebay-1',
            title: 'iPhone 15 Pro',
            price: 1000,
            currency: 'USD',
            source: 'ebay',
            url: 'https://ebay.com/item/1',
          },
        ],
        cached: false,
        timeout: false,
      });

      const mockAlerts = [
        {
          id: 'alert-1',
          user_id: 'user-123',
          product_id: 'product-1',
          target_price: 1000,
          is_active: true,
          product: {
            id: 'product-1',
            title: 'iPhone 15 Pro',
            source: 'ebay',
          },
        },
      ];

      setupAlertsMock(mockAlerts);

      const request = new NextRequest('http://localhost/api/cron/check-alerts', {
        headers: { authorization: 'Bearer test-cron-secret' },
      });
      const response = await GET(request);

      expect(sendPriceAlert).not.toHaveBeenCalled();
    });

    it('should match product by source when checking price', async () => {
      vi.mocked(searchWithTimeout).mockResolvedValue({
        products: [
          {
            id: 'amazon-1',
            title: 'iPhone 15 Pro',
            price: 800,
            currency: 'USD',
            source: 'aliexpress',
            url: 'https://amazon.com/dp/1',
          },
        ],
        cached: false,
        timeout: false,
      });

      const mockAlerts = [
        {
          id: 'alert-1',
          user_id: 'user-123',
          product_id: 'product-1',
          target_price: 1000,
          is_active: true,
          product: {
            id: 'product-1',
            title: 'iPhone 15 Pro',
            source: 'ebay',
          },
        },
      ];

      setupAlertsMock(mockAlerts);

      const request = new NextRequest('http://localhost/api/cron/check-alerts', {
        headers: { authorization: 'Bearer test-cron-secret' },
      });
      await GET(request);

      expect(sendPriceAlert).not.toHaveBeenCalled();
    });
  });

  describe('4.9.3 - Alert deactivation', () => {
    it('should deactivate alert after sending notification', async () => {
      vi.mocked(searchWithTimeout).mockResolvedValue({
        products: [
          {
            id: 'ebay-1',
            title: 'iPhone 15 Pro',
            price: 800,
            currency: 'USD',
            source: 'ebay',
            url: 'https://ebay.com/item/1',
          },
        ],
        cached: false,
        timeout: false,
      });

      const mockAlerts = [
        {
          id: 'alert-1',
          user_id: 'user-123',
          product_id: 'product-1',
          target_price: 1000,
          is_active: true,
          product: {
            id: 'product-1',
            title: 'iPhone 15 Pro',
            source: 'ebay',
          },
        },
      ];

      const { mockUpdate } = setupAlertsMock(mockAlerts);
      vi.mocked(sendPriceAlert).mockResolvedValue(true);

      const request = new NextRequest('http://localhost/api/cron/check-alerts', {
        headers: { authorization: 'Bearer test-cron-secret' },
      });
      await GET(request);

      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should not deactivate alert if email fails to send', async () => {
      vi.mocked(searchWithTimeout).mockResolvedValue({
        products: [
          {
            id: 'ebay-1',
            title: 'iPhone 15 Pro',
            price: 800,
            currency: 'USD',
            source: 'ebay',
            url: 'https://ebay.com/item/1',
          },
        ],
        cached: false,
        timeout: false,
      });

      const mockAlerts = [
        {
          id: 'alert-1',
          user_id: 'user-123',
          product_id: 'product-1',
          target_price: 1000,
          is_active: true,
          product: {
            id: 'product-1',
            title: 'iPhone 15 Pro',
            source: 'ebay',
          },
        },
      ];

      const { mockUpdate } = setupAlertsMock(mockAlerts);
      vi.mocked(sendPriceAlert).mockResolvedValue(false);

      const request = new NextRequest('http://localhost/api/cron/check-alerts', {
        headers: { authorization: 'Bearer test-cron-secret' },
      });
      await GET(request);

      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe('4.9.4 - Response metrics', () => {
    it('should return processed and triggered counts', async () => {
      setupAlertsMock([]);

      const request = new NextRequest('http://localhost/api/cron/check-alerts', {
        headers: { authorization: 'Bearer test-cron-secret' },
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.processed).toBe(0);
      expect(data.triggered).toBe(0);
    });

    it('should include errors in response when present', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: null, error: new Error('Database error') }),
          }),
        }),
      });
      mockFromFn.mockImplementation(() => ({
        select: mockSelect,
      }));

      const request = new NextRequest('http://localhost/api/cron/check-alerts', {
        headers: { authorization: 'Bearer test-cron-secret' },
      });
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });

  describe('4.9.5 - Edge cases', () => {
    it('should handle empty alerts list', async () => {
      setupAlertsMock([]);

      const request = new NextRequest('http://localhost/api/cron/check-alerts', {
        headers: { authorization: 'Bearer test-cron-secret' },
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.processed).toBe(0);
    });

    it('should skip alerts without matching products in search', async () => {
      vi.mocked(searchWithTimeout).mockResolvedValue({
        products: [],
        cached: false,
        timeout: false,
      });

      const mockAlerts = [
        {
          id: 'alert-1',
          user_id: 'user-123',
          product_id: 'product-1',
          target_price: 1000,
          is_active: true,
          product: {
            id: 'product-1',
            title: 'iPhone 15 Pro',
            source: 'ebay',
          },
        },
      ];

      setupAlertsMock(mockAlerts);

      const request = new NextRequest('http://localhost/api/cron/check-alerts', {
        headers: { authorization: 'Bearer test-cron-secret' },
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(sendPriceAlert).not.toHaveBeenCalled();
    });

    it('should limit alerts processed to 100', async () => {
      const { mockSelect } = setupAlertsMock([]);

      const request = new NextRequest('http://localhost/api/cron/check-alerts', {
        headers: { authorization: 'Bearer test-cron-secret' },
      });
      await GET(request);

      expect(mockSelect).toHaveBeenCalled();
    });
  });
});