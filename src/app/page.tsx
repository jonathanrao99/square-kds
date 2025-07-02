"use client";

import React, { useState, useRef, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';

import { Order } from '@/types';
import { Header } from '@/components/Header';
import { OrderGrid } from '@/components/OrderGrid';
import { Modal } from '@/components/Modal';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import ErrorBoundary from '@/components/ErrorBoundary';
import { AllDayView } from '@/components/AllDayView';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function Home() {
  const [tab, setTab] = useState<'open' | 'completed'>('open');
  const [isAllDayViewOpen, setIsAllDayViewOpen] = useState(true);
  
  const [refreshInterval, setRefreshInterval] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const savedRefreshInterval = localStorage.getItem('refreshInterval');
    if (savedRefreshInterval) {
      setRefreshInterval(parseInt(savedRefreshInterval));
    }
    const savedLocation = localStorage.getItem('selectedLocation');
    if (savedLocation) {
      setSelectedLocation(savedLocation);
    }
    const savedSoundEnabled = localStorage.getItem('soundEnabled');
    if (savedSoundEnabled !== null) {
      setSoundEnabled(JSON.parse(savedSoundEnabled));
    }
  }, []);

  const { data, error } = useSWR(
    `/api/orders?locationId=${selectedLocation}`,
    fetcher,
    { refreshInterval: refreshInterval === 0 ? 0 : refreshInterval * 1000 } // Convert seconds to milliseconds
  );
  
  const [completedTickets, setCompletedTickets] = useState<Set<string>>(new Set());
  const [pendingCompletion, setPendingCompletion] = useState<Map<string, NodeJS.Timeout>>(new Map());
  const [modal, setModal] = useState<{isOpen: boolean, content: React.ReactNode, onConfirm: () => void}>({isOpen: false, content: null, onConfirm: () => {}});
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  useEffect(() => {
    fetch('/api/socket');
    const socket = io({
        path: '/api/socket'
    });

    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('order.created', (order) => {
      console.log('New order received:', order);
      mutate('/api/orders');
    });

    socket.on('order.updated', (order) => {
        console.log('Order updated:', order);
        mutate('/api/orders');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    mutate('/api/orders').finally(() => setTimeout(() => setIsRefreshing(false), 700));
  };

  const openModal = (content: React.ReactNode, onConfirm: () => void) => {
    setModal({ isOpen: true, content, onConfirm });
  };
  const closeModal = () => {
    setModal(p => ({...p, isOpen: false}));
    setSelectedOrder(null);
  };

  const handleDoneClick = (orderId: string) => {
    openModal(<p>Mark ticket as done?</p>, async () => {
      closeModal();
      setPendingCompletion(prev => new Map(prev).set(orderId, setTimeout(() => {}, 15000))); // Set a dummy timeout for visual pending state

      try {
        const response = await fetch('/api/orders/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orderId }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Order completion successful:', result);
        
        // Clear the pending state and mark as completed locally
        setPendingCompletion(prev => {
            const newMap = new Map(prev);
            newMap.delete(orderId);
            return newMap;
        });
        setCompletedTickets(prev => new Set(prev).add(orderId));

        // Revalidate SWR cache to update the UI
        mutate('/api/orders');

      } catch (error) {
        console.error('Error completing order:', error);
        // Revert pending state if API call fails
        setPendingCompletion(prev => {
            const newMap = new Map(prev);
            newMap.delete(orderId);
            return newMap;
        });
        alert('Failed to complete order. Please try again.');
      }
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

  const handleCardClick = (order: Order) => {
    setSelectedOrder(order);
  };
  
  const allOrders: Order[] = data?.orders ?? [];
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

  // Open: all not completed and created within the last 2 hours
  const openOrders = allOrders.filter(o => !completedTickets.has(o.id) && new Date(o.createdAt) > twoHoursAgo);

  const completedOrders = allOrders.filter(o => completedTickets.has(o.id));
  const displayedOrders = tab === 'open' ? openOrders : completedOrders;

  const prevOrderCount = useRef<number>(openOrders.length);

  useEffect(() => {
    if (openOrders.length > prevOrderCount.current && soundEnabled) {
        // Play a simple beep sound
        const audio = new Audio('/sounds/beep.mp3'); // You'll need to add a beep.mp3 file to your public/sounds directory
        audio.play().catch(e => console.error("Error playing sound:", e));
    }
    prevOrderCount.current = openOrders.length;
  }, [openOrders.length, soundEnabled]);

  if (error) return <div className="min-h-screen bg-[var(--background-dark)] p-4 text-[var(--text-primary)] text-center">Failed to load orders. Please try again.</div>;

  return (
    <div className="h-screen bg-[var(--background-dark)] flex flex-col font-sans">
      <Header 
        tab={tab}
        setTab={setTab}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        navLinks={[
          { href: "/dashboard", label: "Analytics" },
          { href: "/settings", label: "Settings" },
        ]}
      />
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
                <ErrorBoundary>
                    <OrderGrid 
                        orders={displayedOrders}
                        onDone={handleDoneClick}
                        onReopen={handleReopenClick}
                        onCardClick={handleCardClick}
                        pendingCompletion={pendingCompletion}
                        completedTickets={completedTickets}
                    />
                </ErrorBoundary>
            )}
        </main>
      </div>

      <AnimatePresence>
          {modal.isOpen && <Modal onConfirm={modal.onConfirm} onCancel={closeModal}>{modal.content}</Modal>}
      </AnimatePresence>
    </div>
  );
}
