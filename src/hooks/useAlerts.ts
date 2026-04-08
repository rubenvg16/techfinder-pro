'use client';

import { useState, useCallback } from 'react';
import type { Alert, AlertWithProduct } from '@/types';

interface UseAlertsOptions {
  userId: string;
}

interface UseAlertsReturn {
  alerts: AlertWithProduct[];
  loading: boolean;
  error: Error | null;
  createAlert: (productId: string, targetPrice: number) => Promise<Alert | null>;
  deleteAlert: (alertId: string) => Promise<boolean>;
  refreshAlerts: () => Promise<void>;
}

export function useAlerts({ userId }: UseAlertsOptions): UseAlertsReturn {
  const [alerts, setAlerts] = useState<AlertWithProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAlerts = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/alerts?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch alerts: ${response.statusText}`);
      }

      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const createAlert = useCallback(async (productId: string, targetPrice: number) => {
    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, productId, targetPrice }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create alert: ${response.statusText}`);
      }

      const data = await response.json();
      await fetchAlerts();
      return data.alert;
    } catch (err) {
      setError(err as Error);
      return null;
    }
  }, [userId, fetchAlerts]);

  const deleteAlert = useCallback(async (alertId: string) => {
    try {
      const response = await fetch(`/api/alerts?id=${alertId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete alert: ${response.statusText}`);
      }

      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      return true;
    } catch (err) {
      setError(err as Error);
      return false;
    }
  }, []);

  return {
    alerts,
    loading,
    error,
    createAlert,
    deleteAlert,
    refreshAlerts: fetchAlerts,
  };
}