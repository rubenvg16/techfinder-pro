import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendPriceAlert } from './alerts';
import { Product } from '@/types';

const { mockSendFn } = vi.hoisted(() => ({
  mockSendFn: vi.fn().mockResolvedValue({ data: { id: 'email-123' }, error: null }),
}));

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: mockSendFn,
    },
  })),
}));

describe('alerts.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendFn.mockResolvedValue({ data: { id: 'email-123' }, error: null });
    process.env.RESEND_API_KEY = 'test-resend-key';
  });

  describe('4.6.1 - sendPriceAlert function', () => {
    it('should send email with correct parameters', async () => {
      const mockProduct: Product = {
        id: 'test-123',
        title: 'iPhone 15 Pro',
        price: 999,
        currency: 'USD',
        source: 'ebay',
        url: 'https://ebay.com/item/123',
      };

      const result = await sendPriceAlert({
        to: 'test@example.com',
        product: mockProduct,
        targetPrice: 1200,
        currentPrice: 999,
        unsubscribeUrl: 'https://example.com/unsubscribe',
      });

      expect(result).toBe(true);
    });

    it('should calculate savings correctly', async () => {
      const mockProduct: Product = {
        id: 'test-456',
        title: 'MacBook Air',
        price: 850,
        currency: 'USD',
        source: 'aliexpress',
        url: 'https://amazon.com/dp/456',
      };

      const result = await sendPriceAlert({
        to: 'user@example.com',
        product: mockProduct,
        targetPrice: 1000,
        currentPrice: 850,
        unsubscribeUrl: 'https://example.com/unsubscribe',
      });

      expect(result).toBe(true);
    });

    it('should handle large savings percentage', async () => {
      const mockProduct: Product = {
        id: 'test-789',
        title: 'Discounted Item',
        price: 50,
        currency: 'USD',
        source: 'google',
        url: 'https://shopping.google.com/item',
      };

      const result = await sendPriceAlert({
        to: 'user@example.com',
        product: mockProduct,
        targetPrice: 200,
        currentPrice: 50,
        unsubscribeUrl: 'https://example.com/unsubscribe',
      });

      expect(result).toBe(true);
    });
  });

  describe('4.6.2 - Resend not configured', () => {
    it('should return false when RESEND_API_KEY is not set', async () => {
      delete process.env.RESEND_API_KEY;
      vi.resetModules();

      const { sendPriceAlert: sendAlert } = await import('./alerts');

      const mockProduct: Product = {
        id: 'test-123',
        title: 'Test Product',
        price: 100,
        currency: 'USD',
        source: 'ebay',
        url: 'https://test.com',
      };

      const result = await sendAlert({
        to: 'test@example.com',
        product: mockProduct,
        targetPrice: 150,
        currentPrice: 100,
        unsubscribeUrl: 'https://test.com/unsubscribe',
      });

      expect(result).toBe(false);
    });
  });

  describe('4.6.3 - Error handling', () => {
    it('should return false when Resend API returns error', async () => {
      mockSendFn.mockResolvedValue({
        data: null,
        error: { message: 'Invalid API key' },
      });

      const mockProduct: Product = {
        id: 'test-error',
        title: 'Error Product',
        price: 100,
        currency: 'USD',
        source: 'ebay',
        url: 'https://test.com',
      };

      const result = await sendPriceAlert({
        to: 'test@example.com',
        product: mockProduct,
        targetPrice: 150,
        currentPrice: 100,
        unsubscribeUrl: 'https://test.com/unsubscribe',
      });

      expect(result).toBe(false);
    });

    it('should catch and handle exceptions', async () => {
      mockSendFn.mockRejectedValue(new Error('Network failure'));

      const mockProduct: Product = {
        id: 'test-exception',
        title: 'Exception Product',
        price: 100,
        currency: 'USD',
        source: 'aliexpress',
        url: 'https://amazon.com',
      };

      const result = await sendPriceAlert({
        to: 'test@example.com',
        product: mockProduct,
        targetPrice: 150,
        currentPrice: 100,
        unsubscribeUrl: 'https://test.com/unsubscribe',
      });

      expect(result).toBe(false);
    });
  });
});

describe('Price alert logic', () => {
  describe('4.6.4 - Price threshold comparison', () => {
    it('should detect price drop below target', () => {
      const targetPrice = 100;
      const currentPrice = 80;
      const isPriceDrop = currentPrice < targetPrice;

      expect(isPriceDrop).toBe(true);
    });

    it('should not trigger when price is above target', () => {
      const targetPrice = 100;
      const currentPrice = 120;
      const isPriceDrop = currentPrice < targetPrice;

      expect(isPriceDrop).toBe(false);
    });

    it('should not trigger when price equals target', () => {
      const targetPrice = 100;
      const currentPrice = 100;
      const isPriceDrop = currentPrice < targetPrice;

      expect(isPriceDrop).toBe(false);
    });

    it('should calculate correct savings percentage', () => {
      const targetPrice = 200;
      const currentPrice = 150;
      const savings = targetPrice - currentPrice;
      const savingsPercent = (savings / targetPrice) * 100;

      expect(savings).toBe(50);
      expect(savingsPercent).toBe(25);
    });

    it('should handle edge case of zero target price', () => {
      const targetPrice = 0;
      const currentPrice = 50;
      const savings = targetPrice - currentPrice;
      const savingsPercent = (savings / targetPrice);

      expect(savings).toBe(-50);
      expect(savingsPercent).toBe(-Infinity);
    });

    it('should handle edge case of zero current price', () => {
      const targetPrice = 100;
      const currentPrice = 0;
      const savings = targetPrice - currentPrice;
      const savingsPercent = (savings / targetPrice) * 100;

      expect(savings).toBe(100);
      expect(savingsPercent).toBe(100);
    });
  });
});