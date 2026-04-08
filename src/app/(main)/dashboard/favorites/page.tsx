'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import type { Product } from '@/types';
import styles from './favorites.module.css';

interface FavoriteItem {
  id: string;
  external_id: string;
  source: string;
  title: string;
  price: number;
  currency: string;
  url: string;
  image_url: string | null;
  created_at: string;
}

export default function FavoritesPage() {
  const { user, logout, loading, accessToken } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!accessToken) {
        setLoadingFavorites(false);
        return;
      }
      
      try {
        const response = await fetch('/api/favorites', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('[Favorites] Response:', data);
          setFavorites(data.favorites || []);
        } else {
          console.error('[Favorites] Error response:', response.status, await response.text());
        }
      } catch (error) {
        console.error('Error fetching favorites:', error);
      } finally {
        setLoadingFavorites(false);
      }
    };

    fetchFavorites();
  }, [accessToken]);

  const handleRemove = async (id: string) => {
    if (!accessToken) return;
    
    try {
      const response = await fetch(`/api/favorites?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      if (response.ok) {
        setFavorites((prev) => prev.filter((f) => f.id !== id));
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const favoriteToProduct = (item: FavoriteItem): Product => ({
    id: item.external_id,
    source: item.source as Product['source'],
    title: item.title,
    price: item.price,
    currency: item.currency,
    url: item.url,
    imageUrl: item.image_url || '',
  });

  if (loading || loadingFavorites) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout user={user} onLogout={logout}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Favorites</h1>
          <p className={styles.subtitle}>Your saved products</p>
        </div>

        {favorites.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className={styles.emptyTitle}>No favorites yet</h3>
            <p className={styles.emptyText}>Save products while searching to see them here</p>
            <Link href="/search">
              <Button>Start Searching</Button>
            </Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {favorites.map((item) => (
              <Card
                key={item.id}
                product={favoriteToProduct(item)}
                onClick={() => window.open(item.url, '_blank')}
              >
                <div className={styles.cardActions}>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(item.url, '_blank');
                    }}
                  >
                    View
                  </Button>
                  <Button
                    variant="danger"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(item.id);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}