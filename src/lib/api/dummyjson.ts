import { Product } from '@/types';
import { SOURCE_IDS } from '@/constants/sources';

const DUMMYJSON_API_BASE = 'https://dummyjson.com';

interface DummyJSONProduct {
  id: number;
  title: string;
  description: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  brand: string;
  category: string;
  thumbnail: string;
  images: string[];
}

interface DummyJSONSearchResponse {
  products: DummyJSONProduct[];
  total: number;
  skip: number;
  limit: number;
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

function mapDummyJSONProduct(item: DummyJSONProduct): Product {
  // Create stable ID using source + hash of ID + title
  const uniqueId = `${SOURCE_IDS.DUMMYJSON}-${item.id}-${simpleHash(item.title)}`;

  // Generate a product URL
  const productUrl = `${DUMMYJSON_API_BASE}/products/${item.id}`;

  // Use thumbnail as primary image
  const imageUrl = item.thumbnail || (item.images && item.images[0]);

  return {
    id: uniqueId,
    title: item.title,
    price: item.price,
    currency: 'USD',
    source: SOURCE_IDS.DUMMYJSON,
    url: productUrl,
    imageUrl: imageUrl,
  };
}

export async function searchDummyJSONProducts(query: string): Promise<Product[]> {
  try {
    // Use the search endpoint for better results
    const response = await fetch(
      `${DUMMYJSON_API_BASE}/products/search?q=${encodeURIComponent(query)}&limit=20`,
      {
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      throw new Error(`DummyJSON API error: ${response.status}`);
    }

    const data: DummyJSONSearchResponse = await response.json();
    return data.products.map(mapDummyJSONProduct);
  } catch (error) {
    console.error('DummyJSON search error:', error);
    return [];
  }
}