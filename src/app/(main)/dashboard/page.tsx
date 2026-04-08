'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { useAuth } from '@/hooks/useAuth';
import styles from './dashboard.module.css';

interface RecentSearch {
  id: string;
  query: string;
  resultsCount: number;
  createdAt: string;
}

interface FavoriteItem {
  id: string;
  external_id: string;
}

export default function DashboardPage() {
  const { user, logout, loading, accessToken } = useAuth();
  const [favoritesCount, setFavoritesCount] = useState(0);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!accessToken) return;
      
      try {
        const response = await fetch('/api/favorites', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setFavoritesCount(data.favorites?.length || 0);
        }
      } catch (error) {
        console.error('Error fetching favorites:', error);
      }
    };

    fetchFavorites();
  }, [accessToken]);

  const stats = {
    favoritesCount,
    alertsCount: 0,
    recentSearchesCount: 0,
    potentialSavings: undefined,
  };

  const recentSearches: RecentSearch[] = [];

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout user={user} onLogout={logout}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>Welcome back! Here&apos;s your overview.</p>
        </div>

        <StatsCards stats={stats} />

        {recentSearches.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Recent Searches</h2>
            <div className={styles.recentSearches}>
              {recentSearches.map((search) => (
                <Link 
                  key={search.id} 
                  href={`/search?q=${encodeURIComponent(search.query)}`}
                  className={styles.searchItem}
                >
                  <span className={styles.searchQuery}>{search.query}</span>
                  <span className={styles.searchMeta}>
                    {search.resultsCount} results • {new Date(search.createdAt).toLocaleDateString()}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {recentSearches.length === 0 && (
          <div className={styles.section}>
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </div>
              <p>No recent searches yet</p>
              <Link href="/search">
                Start searching to see your history here
              </Link>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}