export const SOURCE_IDS = {
  EBAY: 'ebay',
  GOOGLE: 'google',
  FAKESTORE: 'fakestore',
  DUMMYJSON: 'dummyjson',
} as const;

export type SourceId = typeof SOURCE_IDS[keyof typeof SOURCE_IDS];

export const SOURCES = [
  { id: SOURCE_IDS.EBAY, name: 'eBay' },
  { id: SOURCE_IDS.GOOGLE, name: 'Google Shopping' },
  { id: SOURCE_IDS.FAKESTORE, name: 'FakeStoreAPI' },
  { id: SOURCE_IDS.DUMMYJSON, name: 'DummyJSON' },
] as const;
