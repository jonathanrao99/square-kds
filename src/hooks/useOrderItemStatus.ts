import { useState, useEffect } from 'react';
import { LineItem } from '@/types';

export const useOrderItemStatus = (lineItems: LineItem[], isCompletedOrder: boolean) => {
  const [itemStatus, setItemStatus] = useState<Record<string, 'pending' | 'completed'>>({});

  useEffect(() => {
    if (isCompletedOrder) {
      const allCompleted: Record<string, 'pending' | 'completed'> = {};
      lineItems.forEach(item => {
        if (item.uid) {
          allCompleted[item.uid] = 'completed';
        }
      });
      setItemStatus(allCompleted);
    } else {
      const allPending: Record<string, 'pending' | 'completed'> = {};
      lineItems.forEach(item => {
        if (item.uid) {
          allPending[item.uid] = 'pending';
        }
      });
      setItemStatus(allPending);
    }
  }, [lineItems, isCompletedOrder]);

  const toggleItemStatus = (itemId: string) => {
    setItemStatus(prev => ({
      ...prev,
      [itemId]: prev[itemId] === 'completed' ? 'pending' : 'completed'
    }));
  };

  return { itemStatus, toggleItemStatus };
};