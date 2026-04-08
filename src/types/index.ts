import { SOURCE_IDS, type SourceId } from '@/constants/sources';

export type ProductSource = typeof SOURCE_IDS[keyof typeof SOURCE_IDS];
export type { SourceId };

export interface Product {
  id: string;
  title: string;
  price: number;
  currency: string;
  source: ProductSource;
  url: string;
  imageUrl?: string;
  isDemo?: boolean;
}

export interface SearchResponse {
  products: Product[];
  cached: boolean;
  timeout: boolean;
  sourcesFailed?: string[];
}

export interface Alert {
  id: string;
  userId: string;
  productId: string;
  targetPrice: number;
  isActive: boolean;
  lastNotifiedAt?: string;
  createdAt: string;
}

export interface AlertWithProduct extends Alert {
  product: Product;
}

export interface CacheOptions {
  ttl?: number;
}

export interface PriceHistory {
  id: string;
  productId: string;
  price: number;
  currency: string;
  recordedAt: string;
}
