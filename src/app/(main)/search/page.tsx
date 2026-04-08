'use client';

import React, { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SearchBar } from '@/components/search/SearchBar';
import { ResultsTable } from '@/components/search/ResultsTable';
import { FilterPanel, FilterState } from '@/components/search/FilterPanel';
import { useSearch } from '@/hooks/useSearch';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { useAuth } from '@/hooks/useAuth';
import type { Product, ProductSource } from '@/types';
import styles from './search.module.css';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const { results, loading, error, cached, timeout, search, query } = useSearch();
  const { user, accessToken } = useAuth();
  const { history, addToHistory, clearHistory } = useSearchHistory();
  
  const [filters, setFilters] = useState<FilterState>({
    sources: [],
    minPrice: undefined,
    maxPrice: undefined,
  });

  const [sort, setSort] = useState<{ key: 'price' | 'source'; direction: 'asc' | 'desc' } | undefined>();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [hasInitialSearch, setHasInitialSearch] = useState(false);

  const handleSearch = useCallback((searchQuery: string) => {
    addToHistory(searchQuery);
    search(searchQuery);
    setHasInitialSearch(true);
  }, [addToHistory, search]);

  useEffect(() => {
    if (initialQuery && !hasInitialSearch) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const productCounts = useMemo(() => {
    const counts: Record<ProductSource, number> = { ebay: 0, google: 0 };
    results.forEach((p) => {
      counts[p.source]++;
    });
    return counts;
  }, [results]);

  const filteredResults = useMemo(() => {
    let filtered = [...results];

    if (filters.sources.length > 0) {
      filtered = filtered.filter((p) => filters.sources.includes(p.source));
    }

    if (filters.minPrice !== undefined) {
      filtered = filtered.filter((p) => p.price >= filters.minPrice!);
    }

    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter((p) => p.price <= filters.maxPrice!);
    }

    if (sort) {
      filtered.sort((a, b) => {
        if (sort.key === 'price') {
          return sort.direction === 'asc' ? a.price - b.price : b.price - a.price;
        }
        return sort.direction === 'asc' 
          ? a.source.localeCompare(b.source) 
          : b.source.localeCompare(a.source);
      });
    }

    return filtered;
  }, [results, filters, sort]);

  const handleSort = (key: 'price' | 'source') => {
    setSort((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const handleAddFavorite = async (product: Product) => {
    if (favorites.includes(product.id)) {
      return;
    }

    if (!user) {
      alert('Please log in to save products');
      return;
    }

    try {
      const response = await fetch('/api/products/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          product,
          userId: user.id,
        }),
      });

      if (response.ok) {
        setFavorites((prev) => [...prev, product.id]);
      }
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Find the Best Prices</h1>
        <p className={styles.subtitle}>Compare prices across eBay, AliExpress, and Google Shopping</p>
      </div>

      <div className={styles.content}>
        <aside className={styles.filterSection}>
          <FilterPanel 
            filters={filters} 
            onChange={setFilters}
            productCounts={productCounts}
          />
        </aside>

        <section className={styles.resultsSection}>
          <SearchBar 
            onSearch={handleSearch} 
            loading={loading} 
            initialValue={query}
            history={history}
            onClearHistory={clearHistory}
          />
          {(cached || timeout) && (
            <div className={styles.cached}>
              {cached && 'From cache'}
              {timeout && ' (some sources timed out)'}
            </div>
          )}
          
          {loading && (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              Searching...
            </div>
          )}
          
          {error && (
            <div className={styles.error}>{error.message}</div>
          )}
          
          {!loading && !error && results.length > 0 && (
            <ResultsTable
              products={filteredResults}
              sort={sort}
              onSort={handleSort}
              onAddFavorite={handleAddFavorite}
              favorites={favorites}
            />
          )}
          
          {!loading && !error && results.length === 0 && (
            <div className={styles.loading}>
              Search for products to see results
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className={styles.container}>Loading...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
