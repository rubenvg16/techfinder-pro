'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import type { Product, ProductSource } from '@/types';
import styles from './ResultsTable.module.css';

export interface SortConfig {
  key: 'price' | 'source';
  direction: 'asc' | 'desc';
}

export interface ResultsTableProps {
  products: Product[];
  sort?: SortConfig;
  onSort?: (key: 'price' | 'source') => void;
  onAddFavorite?: (product: Product) => void;
  favorites?: string[];
}

export function ResultsTable({
  products,
  sort,
  onSort,
  onAddFavorite,
  favorites = [],
}: ResultsTableProps) {
  const bestPrice = useMemo(() => 
    products.length ? Math.min(...products.map((p) => p.price)) : null,
    [products]
  );

  if (products.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
          <h3 className={styles.emptyTitle}>No results found</h3>
          <p className={styles.emptyText}>Try adjusting your search or filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.resultsCount}>
          Showing <strong>{products.length}</strong> results
        </span>
      </div>
      <div className={styles.grid}>
        {products.map((product, index) => {
          const isBestPrice = product.price === bestPrice;
          const isFavorite = favorites.includes(product.id);

          return (
            <article 
              key={product.id} 
              className={styles.card}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className={styles.imageWrapper}>
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className={styles.productImage}
                  />
                ) : (
                  <div className={styles.productImage} style={{ background: 'linear-gradient(135deg, var(--color-bg-elevated) 0%, var(--color-bg-input) 100%)' }} />
                )}
              </div>
              
              <div className={styles.productInfo}>
                <Link href={`/product/${product.id}?data=${encodeURIComponent(JSON.stringify(product))}`} className={styles.productTitle}>
                  {product.title}
                </Link>
                <div className={styles.productMeta}>
                  <span className={`${styles.source} ${styles[product.source]}`}>
                    {product.source}
                  </span>
                </div>
              </div>

              <div className={styles.priceWrapper}>
                <span className={`${styles.price} ${isBestPrice ? styles.best : ''}`}>
                  {product.currency} {typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}
                </span>
                {isBestPrice && (
                  <span className={styles.bestBadge}>Best Price</span>
                )}
              </div>

              <div className={styles.actions}>
                <button
                  className={`${styles.actionButton} ${styles.saveButton} ${isFavorite ? styles.saved : ''}`}
                  onClick={() => onAddFavorite?.(product)}
                >
                  {isFavorite ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                      Saved
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                      Save
                    </>
                  )}
                </button>
                <a
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.actionButton} ${styles.visitButton}`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  Visit
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
