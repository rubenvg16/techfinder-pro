'use client';

import React, { useState, useMemo } from 'react';
import type { PriceHistory } from '@/types';
import styles from './PriceHistory.module.css';

export interface PriceHistoryChartProps {
  history: PriceHistory[];
}

type Period = 30 | 90 | 365;

export function PriceHistoryChart({ history }: PriceHistoryChartProps) {
  const [period, setPeriod] = useState<Period>(30);

  const filteredHistory = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now.getTime() - period * 24 * 60 * 60 * 1000);
    return history.filter((h) => new Date(h.recordedAt) >= cutoff);
  }, [history, period]);

  const stats = useMemo(() => {
    if (filteredHistory.length === 0) return null;
    const prices = filteredHistory.map((h) => h.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: prices.reduce((a, b) => a + b, 0) / prices.length,
    };
  }, [filteredHistory]);

  const chartPath = useMemo(() => {
    if (filteredHistory.length < 2) return '';
    
    const prices = filteredHistory.map((h) => h.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice || 1;
    
    const width = 100;
    const height = 60;
    const padding = 5;
    
    const points = filteredHistory.map((_, i) => {
      const x = padding + (i / (filteredHistory.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((prices[i] - minPrice) / range) * (height - 2 * padding);
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  }, [filteredHistory]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (history.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Price History</h2>
        </div>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 3v18h18" />
              <path d="M18 9l-5 5-4-4-3 3" />
            </svg>
          </div>
          <p>No price history available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Price History</h2>
        <div className={styles.periodTabs}>
          {([30, 90, 365] as Period[]).map((p) => (
            <button
              key={p}
              className={`${styles.periodTab} ${period === p ? styles.active : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p}d
            </button>
          ))}
        </div>
      </div>

      <div className={styles.chart}>
        <svg viewBox="0 0 100 70" style={{ width: '100%', height: '100%' }}>
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-mint)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--color-mint)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {filteredHistory.length >= 2 && (
            <>
              <path
                d={chartPath}
                fill="none"
                stroke="var(--color-mint)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={`${chartPath} L 95,65 L 5,65 Z`}
                fill="url(#chartGradient)"
                opacity="0.5"
              />
            </>
          )}
        </svg>
      </div>

      {stats && (
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <div className={styles.statLabel}>Min</div>
            <div className={`${styles.statValue} ${styles.min}`}>${stats.min.toFixed(2)}</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statLabel}>Avg</div>
            <div className={`${styles.statValue} ${styles.avg}`}>${stats.avg.toFixed(2)}</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statLabel}>Max</div>
            <div className={`${styles.statValue} ${styles.max}`}>${stats.max.toFixed(2)}</div>
          </div>
        </div>
      )}
    </div>
  );
}