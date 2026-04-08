'use client';

import React from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import styles from './history.module.css';

interface SearchHistoryItem {
  id: string;
  query: string;
  resultsCount: number;
  createdAt: string;
}

export default function HistoryPage() {
  const { user, logout, loading } = useAuth();

  const history: SearchHistoryItem[] = [];

  const handleDelete = (id: string) => {
    console.log('Delete search:', id);
  };

  const handleClearAll = () => {
    console.log('Clear all history');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout user={user} onLogout={logout}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Search History</h1>
          <p className={styles.subtitle}>Your recent searches</p>
        </div>

        {history.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className={styles.emptyTitle}>No search history</h3>
            <p className={styles.emptyText}>Your searches will appear here</p>
            <Link href="/search">
              <Button>Start Searching</Button>
            </Link>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <Button variant="ghost" size="small" onClick={handleClearAll}>
                Clear All
              </Button>
            </div>
            <div className={styles.list}>
              {history.map((item) => (
                <div key={item.id} className={styles.item}>
                  <div className={styles.itemContent}>
                    <div className={styles.itemIcon}>
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                      </svg>
                    </div>
                    <div className={styles.itemInfo}>
                      <Link href={`/search?q=${encodeURIComponent(item.query)}`} className={styles.itemQuery}>
                        {item.query}
                      </Link>
                      <div className={styles.itemMeta}>
                        {item.resultsCount} results • {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className={styles.itemActions}>
                    <Button variant="ghost" size="small" onClick={() => handleDelete(item.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}