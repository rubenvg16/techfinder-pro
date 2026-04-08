import { Product } from '@/types';
import { SOURCE_IDS } from '@/constants/sources';

const GOOGLE_SHOPPING_ENDPOINT = 'https://google.serper.dev/shopping';

function getSerperApiKey(): string | null {
  const key = process.env.SERPER_API_KEY;
  if (!key) {
    console.warn('Serper API key not configured');
    return null;
  }
  return key;
}

interface SerperProduct {
  title: string;
  price: number | string;
  currency: string;
  link: string;
  image_url?: string;
  thumbnail?: string;
  source: string;
}

interface SerperResponse {
  shopping: SerperProduct[];
}

// Simple hash function for stable IDs
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).slice(0, 8);
}

// Default placeholder image
const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23333" width="200" height="200"/%3E%3Ctext fill="%23666" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';

function normalizeImageUrl(url: string | undefined): string {
  if (!url) return PLACEHOLDER_IMAGE;
  
  const trimmed = url.trim();
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }
  
  return trimmed;
}

function mapSerperProduct(item: SerperProduct, index: number): Product {
  // Parse price - can be string like "$99.99" or number
  let price = 0;
  if (typeof item.price === 'number') {
    price = item.price;
  } else if (typeof item.price === 'string') {
    // Remove currency symbols and parse
    const parsed = parseFloat(item.price.replace(/[^0-9.-]/g, ''));
    price = isNaN(parsed) ? 0 : parsed;
  }
  
  // Create stable ID using source + hash of URL + title (no timestamp for deduplication)
  const urlHash = item.link ? simpleHash(item.link) : simpleHash(item.title || '');
  const uniqueId = `${SOURCE_IDS.GOOGLE}-${urlHash}`;
  
  // Use image URL if available, otherwise placeholder
  const rawImageUrl = item.thumbnail || item.image_url;
  const imageUrl = normalizeImageUrl(rawImageUrl);
  
  return {
    id: uniqueId,
    title: item.title,
    price: price,
    currency: item.currency || 'USD',
    source: SOURCE_IDS.GOOGLE,
    url: item.link,
    imageUrl: imageUrl,
  };
}

export async function searchGoogleShoppingProducts(query: string): Promise<Product[]> {
  const SERPER_API_KEY = getSerperApiKey();
  if (!SERPER_API_KEY) {
    console.warn('Serper API key not configured, returning empty results');
    return [];
  }

  try {
    const response = await fetch(GOOGLE_SHOPPING_ENDPOINT, {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        num: 20,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Google Shopping API error: ${response.status}`);
    }

    const data: SerperResponse = await response.json();
    return (data.shopping || []).map((item, index) => mapSerperProduct(item, index));
  } catch (error) {
    console.error('Google Shopping search error:', error);
    return [];
  }
}
