'use client';

import React from 'react';
import styles from './StatsCards.module.css';

export interface StatsData {
  favoritesCount: number;
  alertsCount: number;
  recentSearchesCount: number;
  potentialSavings?: number;
}

export interface StatsCardsProps {
  stats: StatsData;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards: { key: string; label: string; value: string | number; icon: string; className: string }[] = [
    {
      key: 'favorites',
      label: 'Favorites',
      value: stats.favoritesCount,
      icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
      className: 'favorites',
    },
    {
      key: 'alerts',
      label: 'Active Alerts',
      value: stats.alertsCount,
      icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
      className: 'alerts',
    },
    {
      key: 'history',
      label: 'Recent Searches',
      value: stats.recentSearchesCount,
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      className: 'history',
    },
  ];

  if (stats.potentialSavings !== undefined) {
    cards.push({
      key: 'savings',
      label: 'Potential Savings',
      value: `$${stats.potentialSavings.toFixed(0)}`,
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      className: 'savings',
    });
  }

  return (
    <div className={styles.grid}>
      {cards.map((card) => (
        <div key={card.key} className={styles.card}>
          <div className={`${styles.iconWrapper} ${styles[card.className]}`}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
            </svg>
          </div>
          <div className={styles.content}>
            <div className={styles.label}>{card.label}</div>
            <div className={styles.value}>{card.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}