'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import type { AlertWithProduct } from '@/types';
import styles from './alerts.module.css';

export default function AlertsPage() {
  const { user, logout, loading: authLoading } = useAuth();
  
  const [alerts, setAlerts] = useState<AlertWithProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [newProductId, setNewProductId] = useState('');
  const [newTargetPrice, setNewTargetPrice] = useState('');

  useEffect(() => {
    if (user) {
      fetchAlerts();
    }
  }, [user]);

  const fetchAlerts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/alerts?userId=${user.id}`);
      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newProductId || !newTargetPrice) return;

    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          productId: newProductId,
          targetPrice: parseFloat(newTargetPrice),
        }),
      });

      if (response.ok) {
        setNewProductId('');
        setNewTargetPrice('');
        fetchAlerts();
      }
    } catch (error) {
      console.error('Failed to create alert:', error);
    }
  };

  const handleDelete = async (alertId: string) => {
    try {
      await fetch(`/api/alerts?id=${alertId}`, { method: 'DELETE' });
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } catch (error) {
      console.error('Failed to delete alert:', error);
    }
  };

  if (authLoading) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout user={user} onLogout={logout}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Price Alerts</h1>
          <p className={styles.subtitle}>Get notified when prices drop</p>
        </div>

        <div className={styles.createForm}>
          <h3 className={styles.formTitle}>Create New Alert</h3>
          <form className={styles.form} onSubmit={handleCreate}>
            <div className={styles.formGroup}>
              <Input
                label="Product ID"
                placeholder="Enter product ID"
                value={newProductId}
                onChange={(e) => setNewProductId(e.target.value)}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <Input
                label="Target Price"
                type="number"
                placeholder="0.00"
                value={newTargetPrice}
                onChange={(e) => setNewTargetPrice(e.target.value)}
                required
              />
            </div>
            <div className={styles.formActions}>
              <Button type="submit">Create Alert</Button>
            </div>
          </form>
        </div>

        {loading ? (
          <div>Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className={styles.emptyTitle}>No alerts yet</h3>
            <p className={styles.emptyText}>Create an alert to get notified when prices drop</p>
          </div>
        ) : (
          <div className={styles.list}>
            {alerts.map((alert) => (
              <div key={alert.id} className={styles.item}>
                <div className={styles.itemContent}>
                  <span className={styles.itemProduct}>
                    Product: {alert.productId}
                  </span>
                  <div className={styles.itemDetails}>
                    <span>Target: ${alert.targetPrice.toFixed(2)}</span>
                    <span className={`${styles.itemStatus} ${alert.isActive ? styles.active : styles.inactive}`}>
                      {alert.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className={styles.itemActions}>
                  <Button variant="danger" size="small" onClick={() => handleDelete(alert.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}