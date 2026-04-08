import { Product } from '@/types';
import { SOURCE_IDS } from '@/constants/sources';

const FAKESTORE_API_BASE = 'https://fakestoreapi.com';

interface FakeStoreProduct {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating: {
    rate: number;
    count: number;
  };
}

interface FakeStoreSearchResponse {
  results: number;
  products: FakeStoreProduct[];
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

function mapFakeStoreProduct(item: FakeStoreProduct): Product {
  // Create stable ID using source + hash of ID + title
  const uniqueId = `${SOURCE_IDS.FAKESTORE}-${item.id}-${simpleHash(item.title)}`;

  // Generate a product URL (FakeStoreAPI doesn't provide URLs, so we create a placeholder)
  const productUrl = `https://fakestoreapi.com/products/${item.id}`;

  return {
    id: uniqueId,
    title: item.title,
    price: item.price,
    currency: 'USD',
    source: SOURCE_IDS.FAKESTORE,
    url: productUrl,
    imageUrl: item.image,
  };
}

export async function searchFakeStoreProducts(query: string): Promise<Product[]> {
  try {
    const response = await fetch(`${FAKESTORE_API_BASE}/products`, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`FakeStoreAPI error: ${response.status}`);
    }

    const products: FakeStoreProduct[] = await response.json();
    
    // Filter by query (case-insensitive search in title)
    const normalizedQuery = query.toLowerCase().trim();
    const filtered = products.filter(product =>
      product.title.toLowerCase().includes(normalizedQuery) ||
      product.category.toLowerCase().includes(normalizedQuery)
    );

    // Limit to top 20 results
    return filtered.slice(0, 20).map(mapFakeStoreProduct);
  } catch (error) {
    console.error('FakeStoreAPI search error:', error);
    return [];
  }
}