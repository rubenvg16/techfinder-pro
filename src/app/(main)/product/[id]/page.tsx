'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { PriceComparison } from '@/components/product/PriceComparison';
import { PriceHistoryChart } from '@/components/product/PriceHistory';
import { useAuth } from '@/hooks/useAuth';
import type { Product, PriceHistory } from '@/types';
import styles from './product.module.css';

export default function ProductPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const productId = params.id as string;
  const { user } = useAuth();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [allPrices, setAllPrices] = useState<Product[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) return;
      
      setLoading(true);
      setError(null);

      const dataParam = searchParams.get('data');
      if (dataParam) {
        try {
          const decoded = JSON.parse(decodeURIComponent(dataParam));
          setProduct(decoded);
          setAllPrices([]);
          setPriceHistory([]);
          setLoading(false);
          return;
        } catch (e) {
          console.error('Failed to parse product data from URL:', e);
        }
      }

      try {
        const url = user 
          ? `/api/products/${productId}?userId=${user.id}`
          : `/api/products/${productId}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Product not found');
        }

        const data = await response.json();
        setProduct(data.product);
        
        setAllPrices([]);
        setPriceHistory([]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId, user, searchParams]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          Loading product...
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className={styles.container}>
        <Link href="/search" className={styles.backLink}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to search
        </Link>
        <div className={styles.error}>{error || 'Product not found'}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link href="/search" className={styles.backLink}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to search
      </Link>

      <div className={styles.productHeader}>
        {product.imageUrl && (
          <img src={product.imageUrl} alt={product.title} className={styles.productImage} />
        )}
        
        <div className={styles.productInfo}>
          <h1 className={styles.productTitle}>{product.title}</h1>
          <div className={styles.currentPrice}>
            {product.currency} {product.price.toFixed(2)}
          </div>
          <span className={`${styles.productSource} ${styles[product.source]}`}>
            {product.source}
          </span>
          
          <div className={styles.actions}>
            <Button onClick={() => window.open(product.url, '_blank')}>
              View on {product.source}
            </Button>
            <Button variant="secondary">Set Price Alert</Button>
          </div>
        </div>
      </div>

      <div className={styles.sections}>
        <PriceComparison product={product} allPrices={allPrices} />
        <PriceHistoryChart history={priceHistory} />
      </div>
    </div>
  );
}