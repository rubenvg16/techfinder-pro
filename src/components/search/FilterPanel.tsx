'use client';

import React, { useState } from 'react';
import type { ProductSource } from '@/types';
import styles from './FilterPanel.module.css';

export interface FilterState {
  sources: ProductSource[];
  minPrice: number | undefined;
  maxPrice: number | undefined;
}

export interface FilterPanelProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  productCounts?: Partial<Record<ProductSource, number>>;
}

export function FilterPanel({ filters, onChange, productCounts = {} }: FilterPanelProps) {
  const sources: ProductSource[] = ['ebay', 'google'];
  const [priceRange, setPriceRange] = useState({ min: filters.minPrice ?? 0, max: filters.maxPrice ?? 1000 });

  const handleSourceChange = (source: ProductSource, checked: boolean) => {
    const newSources = checked
      ? [...filters.sources, source]
      : filters.sources.filter((s) => s !== source);
    onChange({ ...filters, sources: newSources });
  };

  const handlePriceChange = (field: 'minPrice' | 'maxPrice', value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    onChange({ ...filters, [field]: numValue });
  };

  const handleClear = () => {
    onChange({ sources: [], minPrice: undefined, maxPrice: undefined });
    setPriceRange({ min: 0, max: 1000 });
  };

  const hasActiveFilters = filters.sources.length > 0 || filters.minPrice !== undefined || filters.maxPrice !== undefined;

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>Filters</h3>
      
      {hasActiveFilters && (
        <div className={styles.activeFilters}>
          {filters.sources.map((source) => (
            <span key={source} className={styles.filterTag}>
              {source}
              <button onClick={() => handleSourceChange(source, false)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
          {(filters.minPrice !== undefined || filters.maxPrice !== undefined) && (
            <span className={styles.filterTag}>
              ${filters.minPrice ?? 0} - ${filters.maxPrice ?? '∞'}
              <button onClick={() => onChange({ ...filters, minPrice: undefined, maxPrice: undefined })}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Source</div>
        <div className={styles.checkboxGroup}>
          {sources.map((source) => (
            <label key={source} className={styles.checkbox}>
              <input
                type="checkbox"
                checked={filters.sources.includes(source)}
                onChange={(e) => handleSourceChange(source, e.target.checked)}
              />
              <span className={styles.checkmark}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span className={`${styles.sourceLabel} ${styles[source]}`}>{source}</span>
              {productCounts[source] !== undefined && productCounts[source]! > 0 && (
                <span className={styles.countBadge}>{productCounts[source]}</span>
              )}
            </label>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Price Range</div>
        <div className={styles.rangeContainer}>
          <div className={styles.rangeInputs}>
            <input
              type="number"
              className={styles.rangeInput}
              placeholder="Min"
              min="0"
              value={filters.minPrice ?? ''}
              onChange={(e) => handlePriceChange('minPrice', e.target.value)}
            />
            <span className={styles.rangeSeparator}>—</span>
            <input
              type="number"
              className={styles.rangeInput}
              placeholder="Max"
              min="0"
              value={filters.maxPrice ?? ''}
              onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
            />
          </div>
        </div>
      </div>

      {hasActiveFilters && (
        <button className={styles.clearButton} onClick={handleClear}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          Clear all filters
        </button>
      )}
    </div>
  );
}
