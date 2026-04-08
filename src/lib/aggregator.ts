import { Product, SearchResponse } from '@/types';
import { SOURCE_IDS } from '@/constants/sources';
import { searchEbayProducts } from './api/ebay';
import { searchGoogleShoppingProducts } from './api/google-shopping';
import { searchFakeStoreProducts } from './api/fakestore';
import { searchDummyJSONProducts } from './api/dummyjson';
import { getCache, setCache, cacheKeys, TTL } from './cache';

const TIMEOUT_MS = 10_000;

interface AggregatorResult {
  products: Product[];
  sourcesFailed: string[];
  timeout: boolean;
}

export async function searchWithTimeout(
  query: string,
  signal?: AbortSignal
): Promise<SearchResponse> {
  const normalizedQuery = query.toLowerCase().trim();
  const cacheKey = cacheKeys.search(normalizedQuery);

  const cached = await getCache<SearchResponse>(cacheKey);
  if (cached) {
    return { ...cached, cached: true };
  }

  const result = await aggregateResults(query);

  const response: SearchResponse = {
    products: result.products,
    cached: false,
    timeout: result.timeout,
    sourcesFailed: result.sourcesFailed.length > 0 ? result.sourcesFailed : undefined,
  };

  await setCache(cacheKey, response, TTL.SEARCH);

  return response;
}

async function aggregateResults(query: string): Promise<AggregatorResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const [ebayResult, googleResult, fakestoreResult, dummyjsonResult] = await Promise.allSettled([
    searchEbayProducts(query),
    searchGoogleShoppingProducts(query),
    searchFakeStoreProducts(query),
    searchDummyJSONProducts(query),
  ]);

  clearTimeout(timeoutId);

  const products: Product[] = [];
  const sourcesFailed: string[] = [];

  // Handle eBay result
  if (ebayResult.status === 'rejected') {
    sourcesFailed.push(SOURCE_IDS.EBAY);
    console.error(`${SOURCE_IDS.EBAY} failed:`, ebayResult.reason);
  } else {
    products.push(...ebayResult.value);
  }

  // Handle Google Shopping result
  if (googleResult.status === 'rejected') {
    sourcesFailed.push(SOURCE_IDS.GOOGLE);
    console.error(`${SOURCE_IDS.GOOGLE} failed:`, googleResult.reason);
  } else {
    products.push(...googleResult.value);
  }

  // Handle FakeStoreAPI result
  if (fakestoreResult.status === 'rejected') {
    sourcesFailed.push(SOURCE_IDS.FAKESTORE);
    console.error(`${SOURCE_IDS.FAKESTORE} failed:`, fakestoreResult.reason);
  } else {
    products.push(...fakestoreResult.value);
  }

  // Handle DummyJSON result
  if (dummyjsonResult.status === 'rejected') {
    sourcesFailed.push(SOURCE_IDS.DUMMYJSON);
    console.error(`${SOURCE_IDS.DUMMYJSON} failed:`, dummyjsonResult.reason);
  } else {
    products.push(...dummyjsonResult.value);
  }

  const timeout = sourcesFailed.length > 0 && products.length === 0;

  return {
    products: deduplicateProducts(products),
    sourcesFailed,
    timeout,
  };
}

function deduplicateProducts(products: Product[]): Product[] {
  const seen = new Map<string, Product>();

  for (const product of products) {
    const key = `${product.source}:${product.title.toLowerCase()}:${product.price}`;
    const existing = seen.get(key);

    if (!existing || product.price < existing.price) {
      seen.set(key, product);
    }
  }

  return Array.from(seen.values());
}
