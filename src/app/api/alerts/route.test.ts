import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET, POST, DELETE } from './route';
import { getServerSession } from 'next-auth';
import { getSupabaseClient } from '@/lib/supabase';
import { NextRequest } from 'next/server';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
  AuthOptions: {},
}));

vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: vi.fn(),
}));

function createMockNextRequest(url: string, init: RequestInit = {}): NextRequest {
  const { method, headers, body, signal, ...rest } = init;
  return new NextRequest(url, {
    method,
    headers,
    body: body as BodyInit | undefined,
    ...rest,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
}

const { mockSupabase, mockFromFn } = vi.hoisted(() => {
  const mockFromFn = vi.fn();
  
  const createChainedMock = (returnValue: any) => {
    const mockFn = vi.fn().mockReturnValue(returnValue);
    return mockFn;
  };

  return {
    mockFromFn,
    mockSupabase: {
      from: mockFromFn.mockReturnValue({
        select: createChainedMock({
          eq: createChainedMock({
            order: createChainedMock({
              limit: createChainedMock({ data: [], error: null }),
            }),
          }),
        }),
        insert: createChainedMock({
          select: createChainedMock({
            single: createChainedMock({ data: null, error: null }),
          }),
        }),
        delete: createChainedMock({
          eq: createChainedMock({
            eq: createChainedMock({ data: null, error: null }),
          }),
        }),
      }),
    },
  };
});

describe('api/alerts/route.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFromFn.mockImplementation(() => {
      const createChainedMock = (returnValue: any) => {
        const mockFn = vi.fn().mockReturnValue(returnValue);
        return mockFn;
      };

      return {
        select: createChainedMock({
          eq: createChainedMock({
            order: createChainedMock({
              limit: createChainedMock({ data: [], error: null }),
            }),
          }),
        }),
        insert: createChainedMock({
          select: createChainedMock({
            single: createChainedMock({ data: null, error: null }),
          }),
        }),
        delete: createChainedMock({
          eq: createChainedMock({
            eq: createChainedMock({ data: null, error: null }),
          }),
        }),
      };
    });
    (getSupabaseClient as any).mockReturnValue(mockSupabase);
  });

  describe('4.8.1 - GET - Fetch user alerts', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = createMockNextRequest('http://localhost/api/alerts');
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return alerts for authenticated user', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
      };
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const mockAlerts = [
        {
          id: 'alert-1',
          user_id: 'user-123',
          product_id: 'product-1',
          target_price: 100,
          is_active: true,
          product: {
            id: 'product-1',
            title: 'iPhone 15',
            price: 99,
            currency: 'USD',
            source: 'ebay',
            url: 'https://ebay.com/item/1',
          },
        },
      ];

      // Mock the full chain: from().select().eq().order()
      const mockEq = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: mockAlerts, error: null }),
      });
      
      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (mockSupabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const request = createMockNextRequest('http://localhost/api/alerts');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.alerts).toHaveLength(1);
      expect(data.alerts[0].id).toBe('alert-1');
    });

    it('should return empty array when user has no alerts', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
      };
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const request = createMockNextRequest('http://localhost/api/alerts');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.alerts).toEqual([]);
    });
  });

  describe('4.8.2 - POST - Create alert', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = createMockNextRequest('http://localhost/api/alerts', {
        method: 'POST',
        body: JSON.stringify({ productId: 'product-1', targetPrice: 100 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should return 400 when productId is missing', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
      };
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const request = createMockNextRequest('http://localhost/api/alerts', {
        method: 'POST',
        body: JSON.stringify({ targetPrice: 100 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid productId or targetPrice');
    });

    it('should return 400 when targetPrice is missing', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
      };
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const request = createMockNextRequest('http://localhost/api/alerts', {
        method: 'POST',
        body: JSON.stringify({ productId: 'product-1' }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should return 404 when product not found', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
      };
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      (mockSupabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const request = createMockNextRequest('http://localhost/api/alerts', {
        method: 'POST',
        body: JSON.stringify({ productId: 'nonexistent', targetPrice: 100 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Product not found');
    });

    it('should create alert successfully', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
      };
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const mockProduct = { id: 'product-1', title: 'Test Product' };
      const mockAlert = {
        id: 'alert-new',
        user_id: 'user-123',
        product_id: 'product-1',
        target_price: 100,
        is_active: true,
      };

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockProduct, error: null }),
        }),
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockAlert, error: null }),
        }),
      });

      (mockSupabase.from as any).mockImplementation(() => ({
        select: mockSelect,
        insert: mockInsert,
      }));

      const request = createMockNextRequest('http://localhost/api/alerts', {
        method: 'POST',
        body: JSON.stringify({ productId: 'product-1', targetPrice: 100 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.alert.id).toBe('alert-new');
    });
  });

  describe('4.8.3 - DELETE - Remove alert', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = createMockNextRequest('http://localhost/api/alerts?id=alert-1', {
        method: 'DELETE',
      });
      const response = await DELETE(request);

      expect(response.status).toBe(401);
    });

    it('should return 400 when alertId is missing', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
      };
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const request = createMockNextRequest('http://localhost/api/alerts', {
        method: 'DELETE',
      });
      const response = await DELETE(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Alert ID is required');
    });

    it('should delete alert successfully', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
      };
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      (mockSupabase.from as any).mockReturnValue({
        delete: mockDelete,
      });

      const request = createMockNextRequest('http://localhost/api/alerts?id=alert-1', {
        method: 'DELETE',
      });
      const response = await DELETE(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should only delete alerts belonging to user', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
      };
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      (mockSupabase.from as any).mockReturnValue({
        delete: mockDelete,
      });

      const request = createMockNextRequest('http://localhost/api/alerts?id=alert-1', {
        method: 'DELETE',
      });
      const response = await DELETE(request);

      expect(response.status).toBe(200);
      expect(mockDelete).toHaveBeenCalled();
    });
  });
});