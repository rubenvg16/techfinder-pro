'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import type { Product } from '@/types';
import styles from './PriceComparison.module.css';

export interface PriceComparisonProps {
  product: Product;
  allPrices?: Product[];
}

export function PriceComparison({ product, allPrices = [] }: PriceComparisonProps) {
  const prices = allPrices.length > 0 ? allPrices : [product];
  
  const sortedPrices = [...prices].sort((a, b) => a.price - b.price);
  const bestPrice = sortedPrices[0];
  const highestPrice = sortedPrices[sortedPrices.length - 1];
  const savings = highestPrice.price - bestPrice.price;
  const savingsPercent = highestPrice.price > 0 ? (savings / highestPrice.price) * 100 : 0;

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'ebay': return 'eBay';
      case 'amazon': return 'Amazon';
      case 'google': return 'Google Shopping';
      default: return source;
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Price Comparison</h2>
      
      {sortedPrices.length === 0 ? (
        <div className={styles.empty}>No prices available</div>
      ) : (
        <>
          <div className={styles.priceList}>
            {sortedPrices.map((item) => {
              const isBest = item.id === bestPrice.id;
              return (
                <div key={item.id} className={`${styles.priceItem} ${isBest ? styles.best : ''}`}>
                  <div className={styles.sourceInfo}>
                    <span className={`${styles.sourceIcon} ${styles[item.source]}`}>
                      {item.source.slice(0, 2)}
                    </span>
                    <span className={styles.sourceName}>{getSourceLabel(item.source)}</span>
                  </div>
                  <div className={styles.priceValue}>
                    <span className={styles.priceAmount}>
                      {item.currency} {item.price.toFixed(2)}
                    </span>
                    {isBest && <span className={styles.bestBadge}>Best Price</span>}
                    <Link href={item.url} target="_blank" rel="noopener noreferrer" className={styles.viewButton}>
                      <Button size="small" variant="secondary">View</Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {sortedPrices.length > 1 && (
            <div className={styles.summary}>
              <div className={styles.summaryItem}>
                <div className={styles.summaryLabel}>Lowest</div>
                <div className={styles.summaryValue}>{bestPrice.currency} {bestPrice.price.toFixed(2)}</div>
              </div>
              <div className={styles.summaryItem}>
                <div className={styles.summaryLabel}>Highest</div>
                <div className={styles.summaryValue}>{highestPrice.currency} {highestPrice.price.toFixed(2)}</div>
              </div>
              <div className={styles.summaryItem}>
                <div className={styles.summaryLabel}>You Save</div>
                <div className={`${styles.summaryValue} ${styles.savings}`}>
                  {savingsPercent.toFixed(0)}% (${savings.toFixed(2)})
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}