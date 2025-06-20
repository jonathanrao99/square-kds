"use client";

import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { AnimatePresence } from 'framer-motion';

import { Order } from '@/types';
import { Header } from '@/components/Header';
import { OrderGrid } from '@/components/OrderGrid';
import { Modal } from '@/components/Modal';
import { SkeletonLoader } from '@/components/SkeletonLoader';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function Home() {
  const [tab, setTab] = useState<'open' | 'completed'>('open');
  const { data, error } = useSWR('/api/orders', fetcher, { 
      refreshInterval: tab === 'open' ? 5000 : 36000000
  });
  
  const [completedTickets, setCompletedTickets] = useState<Set<string>>(new Set());
  const [pendingCompletion, setPendingCompletion] = useState<Map<string, NodeJS.Timeout>>(new Map());
  const [modal, setModal] = useState<{isOpen: boolean, content: React.ReactNode, onConfirm: () => void}>({isOpen: false, content: null, onConfirm: () => {}});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    mutate('/api/orders').finally(() => setTimeout(() => setIsRefreshing(false), 700));
  };

  const openModal = (content: React.ReactNode, onConfirm: () => void) => {
    setModal({ isOpen: true, content, onConfirm });
  };
  const closeModal = () => setModal(p => ({...p, isOpen: false}));

  const handleDoneClick = (orderId: string) => {
    openModal(<p>Mark ticket as done?</p>, () => {
      closeModal();
      const timer = setTimeout(() => {
          setCompletedTickets(prev => new Set(prev).add(orderId));
          setPendingCompletion(prev => {
              const newMap = new Map(prev);
              newMap.delete(orderId);
              return newMap;
          });
      }, 15000);
      setPendingCompletion(prev => new Map(prev).set(orderId, timer));
    });
  };

  const handleReopenClick = (orderId: string) => {
    openModal(<p>Reopen this ticket?</p>, () => {
      const timer = pendingCompletion.get(orderId);
      if (timer) {
        clearTimeout(timer);
        setPendingCompletion(prev => {
            const newMap = new Map(prev);
            newMap.delete(orderId);
            return newMap;
        });
      }
      closeModal();
    });
  };
  
  if (error) return <div className="min-h-screen bg-black p-4 text-white text-center">Failed to load orders. Please try again.</div>;
  
  const allOrders: Order[] = data?.orders ?? [];
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const openOrders = allOrders.filter(o => !completedTickets.has(o.id) && new Date(o.createdAt) > oneHourAgo);
  const completedOrders = allOrders.filter(o => completedTickets.has(o.id));
  const displayedOrders = tab === 'open' ? openOrders : completedOrders;

  return (
    <div className="min-h-screen bg-black p-4 font-sans">
      <Header 
        tab={tab}
        setTab={setTab}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />
      
      {!data ? (
        <SkeletonLoader />
      ) : (
        <OrderGrid 
            orders={displayedOrders}
            onDone={handleDoneClick}
            onReopen={handleReopenClick}
            pendingCompletion={pendingCompletion}
            completedTickets={completedTickets}
        />
      )}

      <AnimatePresence>
          {modal.isOpen && <Modal onConfirm={modal.onConfirm} onCancel={closeModal}>{modal.content}</Modal>}
      </AnimatePresence>
    </div>
  );
}
