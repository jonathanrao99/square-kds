"use client";

import React, { useState, useRef, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { AnimatePresence } from 'framer-motion';

import { Order } from '@/types';
import { Header } from '@/components/Header';
import { OrderGrid } from '@/components/OrderGrid';
import { Modal } from '@/components/Modal';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { AllDayView } from '@/components/AllDayView';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function Home() {
  const [tab, setTab] = useState<'open' | 'completed'>('open');
  const [isAllDayViewOpen, setIsAllDayViewOpen] = useState(true);
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
          const orderToComplete = allOrders.find(o => o.id === orderId);
          if (orderToComplete) {
            const completedOrder = { ...orderToComplete, completedAt: new Date().toISOString() };
            
            const storedData = localStorage.getItem('sessionCompletedOrders');
            const existingCompleted = storedData ? JSON.parse(storedData) : [];
            localStorage.setItem('sessionCompletedOrders', JSON.stringify([...existingCompleted, completedOrder]));

            setCompletedTickets(prev => new Set(prev).add(orderId));
          }
          
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
  
  const openOrders = allOrders
    .filter(o => !completedTickets.has(o.id) && new Date(o.createdAt) > oneHourAgo)
    .sort((a, b) => {
        if (a.isRush && !b.isRush) return -1;
        if (!a.isRush && b.isRush) return 1;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

  const completedOrders = allOrders.filter(o => completedTickets.has(o.id));
  const displayedOrders = tab === 'open' ? openOrders : completedOrders;

  const prevOrderCount = useRef<number>(openOrders.length);

  useEffect(() => {
    if (openOrders.length > prevOrderCount.current) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A6 note
        oscillator.start();
        setTimeout(() => oscillator.stop(), 150);
    }
    prevOrderCount.current = openOrders.length;
  }, [openOrders.length]);

  return (
    <div className="h-screen bg-black flex flex-col font-sans">
      <div className="p-4 border-b border-gray-800">
        <Header 
          tab={tab}
          setTab={setTab}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
      </div>
      
      <div className="flex-grow flex flex-row overflow-hidden">
        <AllDayView 
            orders={openOrders} 
            isOpen={isAllDayViewOpen} 
            onClose={() => setIsAllDayViewOpen(false)} 
        />
        <main className="flex-grow p-6 overflow-x-auto">
            {!isAllDayViewOpen && (
                 <button 
                    onClick={() => setIsAllDayViewOpen(true)}
                    className="fixed top-1/2 -translate-y-1/2 left-0 bg-gray-800 text-white p-3 rounded-r-lg z-20 hover:bg-gray-700 transition-colors"
                    aria-label="Open All Day View"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
                </button>
            )}
           
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
        </main>
      </div>

      <AnimatePresence>
          {modal.isOpen && <Modal onConfirm={modal.onConfirm} onCancel={closeModal}>{modal.content}</Modal>}
      </AnimatePresence>
    </div>
  );
}
