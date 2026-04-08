'use client';

import React from 'react';
import styles from './Card.module.css';
import type { Product } from '@/types';

export interface CardProps {
  product: Product;
  onClick?: () => void;
  showBadge?: boolean;
  children?: React.ReactNode;
}

export function Card({ product, onClick, showBadge = true, children }: CardProps) {
  return (
    <div
      className={`${styles.card} ${onClick ? styles.clickable : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {product.imageUrl && (
        <div className={styles.imageWrapper}>
          <img src={product.imageUrl} alt={product.title} className={styles.image} loading="lazy" />
          {showBadge && <span className={`${styles.badge} ${styles[product.source]}`}>{product.source}</span>}
        </div>
      )}
      <div className={styles.body}>
        <h3 className={styles.title}>{product.title}</h3>
        <div className={styles.price}>
          {product.currency} {product.price.toFixed(2)}
        </div>
      </div>
      {children && <div className={styles.footer}>{children}</div>}
    </div>
  );
}