import { type SourceId } from '@/constants/sources';
import type { Product } from '@/types';
import { generateId } from './idGenerator';

const MOCK_TITLES: Record<SourceId, string[]> = {
  ebay: ['eBay Best Seller', 'eBay Premium', 'eBay Deal', 'eBay Featured', 'eBay Trending'],
  google: ['Google Shopping Best Match', 'Google Shopping Deal', 'Google Shopping Popular', 'Google Shopping Featured'],
};

function getMockTitle(source: SourceId, index: number): string {
  const titles = MOCK_TITLES[source] || [`${source} Product`];
  return titles[index % titles.length];
}

function getMockUrl(source: SourceId, index: number): string {
  return `https://www.${source}.com/item/mock${index + 1}`;
}

function getMockImageUrl(source: SourceId, index: number): string {
  const text = source === 'google' ? `${source}+${index + 1}` : source;
  return `https://placehold.co/200x200?text=${text}`;
}

export function getMockProduct(source: SourceId): Product {
  const id = generateId(source);
  return {
    id,
    title: getMockTitle(source, 0),
    price: Math.floor(Math.random() * 200) + 10,
    currency: 'USD',
    source,
    url: getMockUrl(source, 0),
    imageUrl: getMockImageUrl(source, 0),
  };
}

export function getMockProducts(source: SourceId, count = 3): Product[] {
  return Array.from({ length: count }, (_, i) => {
    const id = generateId(source);
    return {
      id,
      title: getMockTitle(source, i),
      price: Math.floor(Math.random() * (source === 'google' ? 500 : 300)) + 10,
      currency: 'USD',
      source,
      url: getMockUrl(source, i),
      imageUrl: getMockImageUrl(source, i),
    };
  });
}
