"use client";

import React, { useState, useRef, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';
import { Socket } from 'socket.io-client';

import { Order } from '@/types';
import { Header } from '@/components/Header';
import { OrderGrid } from '@/components/OrderGrid';
import { Modal } from '@/components/Modal';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { AllDayView } from '@/components/AllDayView';

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
        const errorDetails = await res.json();
        const error = new Error('An error occurred while fetching the data.');
        (error as Error & { info?: object }).info = errorDetails;
        throw error;
    }
    return res.json();
};

export interface Filters {
    isRush?: boolean;
    source?: string;
}

export default function Home() {
  const [tab, setTab] = useState<'open' | 'completed'>('open');
  const [completedRange, setCompletedRange] = useState<'day' | 'week' | 'month'>('day');
  const [isAllDayViewOpen, setIsAllDayViewOpen] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  const [apiUrl, setApiUrl] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({});

  const [completedTickets, setCompletedTickets] = useState<Set<string>>(new Set());
  const [pendingCompletion, setPendingCompletion] = useState<Map<string, NodeJS.Timeout>>(new Map());
  const [modal, setModal] = useState<{isOpen: boolean, content: React.ReactNode, onConfirm: () => void}>({isOpen: false, content: null, onConfirm: () => {}});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  
  useEffect(() => {
    // This effect runs only on the client-side
    const openTime = localStorage.getItem('openTime') || '17:00';
    const closeTime = localStorage.getItem('closeTime') || '01:00';
    let url = '';
    if (tab === 'open') {
      url = `/api/orders?status=OPEN&openTime=${encodeURIComponent(openTime)}&closeTime=${encodeURIComponent(closeTime)}`;
    } else {
      url = `/api/orders?status=COMPLETED&range=${completedRange}&openTime=${encodeURIComponent(openTime)}&closeTime=${encodeURIComponent(closeTime)}`;
    }
    setApiUrl(url);

    // Setup socket.io
    const socket = io({ path: '/api/socket' });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to socket server');
    });

    socket.on('order.created', (order: Order) => {
      console.log('New order received:', order);
      if(url && tab === 'open') mutate(url);
    });

    socket.on('order.updated', (updatedOrder: Order) => {
        console.log('Order updated received:', updatedOrder);
        if(url) {
            // Optimistically update the specific order
            mutate(url, (data: { orders: Order[] } | undefined) => {
                if (!data) return { orders: [] };
                const updatedOrders = data.orders.map(order =>
                    order.id === updatedOrder.id ? updatedOrder : order
                );
                return { orders: updatedOrders };
            }, false); // false means don't revalidate yet
        }
    });

    socket.on('order.completed', (orderId: string) => {
        console.log(`Socket broadcast received: order ${orderId} completed.`);
        setCompletedTickets(prev => new Set(prev).add(orderId));
        mutate(apiUrl);
    });

    socket.on('order.reopened', (orderId: string) => {
        console.log(`Socket broadcast received: order ${orderId} reopened.`);
        setCompletedTickets(prev => {
            const newSet = new Set(prev);
            newSet.delete(orderId);
            return newSet;
        });
        mutate(apiUrl);
    });

    return () => {
      socket.disconnect();
    };
  }, [tab, completedRange, apiUrl]);

  const handleRefresh = () => {
    if(apiUrl) {
        setIsRefreshing(true);
        mutate(apiUrl).finally(() => setTimeout(() => setIsRefreshing(false), 700));
    }
  };

  const openModal = (content: React.ReactNode, onConfirm: () => void) => {
    setModal({ isOpen: true, content, onConfirm });
  };
  const closeModal = () => {
    setModal(p => ({...p, isOpen: false}));
    setSelectedOrder(null);
  };

  const handleDoneClick = (orderId: string) => {
    openModal(<p>Mark ticket as done?</p>, () => {
      closeModal();
      const timeoutId = setTimeout(() => {
          const orderToComplete = allOrders.find(o => o.id === orderId);
          if (orderToComplete) {
            const completedOrder = { ...orderToComplete, completedAt: new Date().toISOString() };
            
            const storedData = localStorage.getItem('sessionCompletedOrders');
            const existingCompleted = storedData ? JSON.parse(storedData) : [];
            localStorage.setItem('sessionCompletedOrders', JSON.stringify([...existingCompleted, completedOrder]));

            setCompletedTickets(prev => new Set(prev).add(orderId));
            socketRef.current?.emit('order.complete', orderId);
          }
          
          setPendingCompletion(prev => {
              const newMap = new Map(prev);
              newMap.delete(orderId);
              return newMap;
          });
          mutate(apiUrl); // Revalidate data after completion
      }, 500);
      setPendingCompletion(prev => new Map(prev).set(orderId, timeoutId));
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
      setCompletedTickets(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        socketRef.current?.emit('order.reopen', orderId);
        return newSet;
      });
      closeModal();
    });
  };

  const handleCardClick = (order: Order) => {
    setSelectedOrder(order);
  };
  
  const { data, error } = useSWR(apiUrl, fetcher, {
    refreshInterval: tab === 'open' ? 30000 : 0, // 30 seconds for open, no auto-refresh for completed
  });
  
  const allOrders: Order[] = data?.orders ?? [];
  const openOrders = allOrders
    .filter(o => !completedTickets.has(o.id));

  const completedOrders = allOrders.filter(o => completedTickets.has(o.id));
  
  const displayedOrders = (tab === 'open' ? openOrders : completedOrders)
    .filter(order => {
        if (filters.isRush && !order.isRush) return false;
        if (filters.source && order.source?.name !== filters.source) return false;
        return true;
    });

  const prevOrderCount = useRef<number>(openOrders.length);

  useEffect(() => {
    if (openOrders.length > prevOrderCount.current) {
        // Sound notification logic will be re-implemented later
    }
    prevOrderCount.current = openOrders.length;
  }, [openOrders.length]);

  if (error) return <div className="min-h-screen bg-black p-4 text-white text-center">Failed to load orders. Please try again.</div>;

  return (
    <div className="min-h-screen bg-white text-[#181818] flex flex-col font-sans">
      <Header 
        tab={tab}
        setTab={setTab}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        filters={filters}
        setFilters={setFilters}
        allOrders={allOrders}
        completedRange={completedRange}
        setCompletedRange={setCompletedRange}
        showCompletedRange={tab === 'completed'}
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
                    className="fixed top-1/2 -translate-y-1/2 left-0 bg-[#fff] text-[#181818] p-3 rounded-r-lg z-20 hover:bg-orange-50 transition-colors border border-[#eee]"
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
                    onCardClick={handleCardClick}
                    pendingCompletion={pendingCompletion}
                    completedTickets={completedTickets}
                />
            )}
        </main>
      </div>
      <AnimatePresence>
          {modal.isOpen && <Modal onConfirm={modal.onConfirm} onCancel={closeModal}>{modal.content}</Modal>}
          {selectedOrder && (
            <Modal onCancel={closeModal} onConfirm={closeModal}>
              <div className="p-4 text-[#181818]">
                <h2 className="text-2xl font-bold mb-4">Order Details</h2>
                <p><strong>ID:</strong> {selectedOrder.id}</p>
                <p><strong>Ticket Name:</strong> {selectedOrder.ticketName}</p>
                <p><strong>Created At:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                <p><strong>Source:</strong> {selectedOrder.source?.name}</p>
                <p><strong>Rush Order:</strong> {selectedOrder.isRush ? 'Yes' : 'No'}</p>
                <h3 className="text-xl font-bold mt-4 mb-2">Items</h3>
                <ul>
                  {selectedOrder.lineItems.map(item => (
                    <li key={item.uid}>{item.quantity} x {item.name}</li>
                  ))}
                </ul>
              </div>
            </Modal>
          )}
      </AnimatePresence>
    </div>
  );
}
