import { Product } from '@/types';
import { SOURCE_IDS } from '@/constants/sources';

const EBAY_ENV = process.env.EBAY_ENVIRONMENT || 'production';
const EBAY_API_BASE = EBAY_ENV === 'sandbox' 
  ? 'https://api.sandbox.ebay.com/buy/browse/v1' 
  : 'https://api.ebay.com/buy/browse/v1';
const EBAY_TOKEN_URL = EBAY_ENV === 'sandbox'
  ? 'https://api.sandbox.ebay.com/identity/v1/oauth2/token'
  : 'https://api.ebay.com/identity/v1/oauth2/token';

const EBAY_CLIENT_ID = process.env.EBAY_CLIENT_ID;
const EBAY_CLIENT_SECRET = process.env.EBAY_CLIENT_SECRET;

interface EbayTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

// Export for testing - allows tests to reset cached token
export function resetEbayTokenCache() {
  cachedToken = null;
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  if (!EBAY_CLIENT_ID || !EBAY_CLIENT_SECRET) {
    throw new Error('Missing eBay API credentials');
  }

  const credentials = Buffer.from(`${EBAY_CLIENT_ID}:${EBAY_CLIENT_SECRET}`).toString('base64');

    const response = await fetch(EBAY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'https://api.ebay.com/oauth/api_scope',
    }),
  });

  if (!response.ok) {
    throw new Error(`eBay token error: ${response.status}`);
  }

  const data: EbayTokenResponse = await response.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return data.access_token;
}

interface EbayItem {
  itemId: string;
  title: string;
  price?: { value: string; currency: string };
  image?: { imageUrl: string };
  itemWebUrl: string;
}

interface EbaySearchResponse {
  total: number;
  itemSummaries: EbayItem[];
}

function mapEbayItem(item: EbayItem): Product {
  return {
    id: `${SOURCE_IDS.EBAY}-${item.itemId}`,
    title: item.title,
    price: parseFloat(item.price?.value || '0'),
    currency: item.price?.currency || 'USD',
    source: SOURCE_IDS.EBAY,
    url: item.itemWebUrl,
    imageUrl: item.image?.imageUrl,
  };
}

export async function searchEbayProducts(query: string): Promise<Product[]> {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const accessToken = await getAccessToken();

      const response = await fetch(
        `${EBAY_API_BASE}/item_summary/search?q=${encodeURIComponent(query)}&limit=20`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : 1000 * attempt;
        console.warn(`eBay rate limited, waiting ${waitTime}ms`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      if (!response.ok) {
        throw new Error(`eBay API error: ${response.status}`);
      }

      const data: EbaySearchResponse = await response.json();
      return data.itemSummaries.map(mapEbayItem);
    } catch (error) {
      lastError = error as Error;
      console.error(`eBay search attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  console.error('eBay search failed after all retries:', lastError);
  return [];
}
