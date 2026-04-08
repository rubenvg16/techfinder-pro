'use client';

import { useState, useCallback } from 'react';
import type { Product, SearchResponse } from '@/types';

interface UseSearchOptions {
  onSuccess?: (data: SearchResponse) => void;
  onError?: (error: Error) => void;
}

export function useSearch(options?: UseSearchOptions) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [cached, setCached] = useState(false);
  const [timeout, setTimeout] = useState(false);

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setQuery(searchQuery);
    setLoading(true);
    setError(null);
    setCached(false);
    setTimeout(false);

    try {
      const params = new URLSearchParams({ q: searchQuery });
      const response = await fetch(`/api/search?${params}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data: SearchResponse = await response.json();
      
      setResults(data.products);
      setCached(data.cached);
      setTimeout(data.timeout);
      options?.onSuccess?.(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options?.onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [options]);

  const clear = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
    setCached(false);
    setTimeout(false);
  }, []);

  return {
    query,
    results,
    loading,
    error,
    cached,
    timeout,
    search,
    clear,
  };
}