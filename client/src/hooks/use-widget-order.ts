import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'wisecx-widget-order';

export type WidgetId = 'kpis' | 'charts' | 'funnel' | 'rankings' | 'products';

const DEFAULT_ORDER: WidgetId[] = ['kpis', 'charts', 'funnel', 'rankings', 'products'];

export function useWidgetOrder() {
  const [order, setOrder] = useState<WidgetId[]>(DEFAULT_ORDER);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length === DEFAULT_ORDER.length) {
          setOrder(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to load widget order from localStorage:', error);
    }
  }, []);

  const updateOrder = useCallback((newOrder: WidgetId[]) => {
    setOrder(newOrder);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrder));
    } catch (error) {
      console.error('Failed to save widget order to localStorage:', error);
    }
  }, []);

  const resetOrder = useCallback(() => {
    setOrder(DEFAULT_ORDER);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to reset widget order:', error);
    }
  }, []);

  return { order, updateOrder, resetOrder };
}
