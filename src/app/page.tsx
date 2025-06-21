"use client";

import React, { useState, useRef, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';
import { Socket } from 'socket.io-client';
import TimeAgo from 'react-timeago';

import { Order, LineItem } from '@/types';
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
        (error as any).info = errorDetails;
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
  const [isAllDayViewOpen, setIsAllDayViewOpen] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiUrl, setApiUrl] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({});
  const [completedTimeFilter, setCompletedTimeFilter] = useState<'day' | 'week' | 'month'>('day');

  const [completedTickets, setCompletedTickets] = useState<Set<string>>(new Set());
  const [pendingCompletion, setPendingCompletion] = useState<Map<string, NodeJS.Timeout>>(new Map());
  const [modal, setModal] = useState<{isOpen: boolean, content: React.ReactNode, onConfirm: () => void}>({isOpen: false, content: null, onConfirm: () => {}});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  
  useEffect(() => {
    // This effect runs only on the client-side
    const openTime = localStorage.getItem('openTime') || '17:00';
    const closeTime = localStorage.getItem('closeTime') || '01:00';
    
    let url = `/api/orders?status=${tab}`;
    if (tab === 'open') {
      url += `&openTime=${encodeURIComponent(openTime)}&closeTime=${encodeURIComponent(closeTime)}`;
    } else {
      url += `&timeFilter=${completedTimeFilter}`;
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
  }, [tab, completedTimeFilter]);

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
  
  const { data, error, isLoading } = useSWR(apiUrl, fetcher, {
    refreshInterval: tab === 'open' ? 30000 : 0, // 30 seconds for open, no auto-refresh for completed
  });
  
  const allOrders: Order[] = data?.orders ?? [];
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const openOrders = allOrders
    .filter(o => !completedTickets.has(o.id) && new Date(o.createdAt) > oneHourAgo);

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

  if (error) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Failed to load orders. Please try again.</div>;

  return (
    <div className="h-screen bg-gray-900 flex flex-col font-sans text-white">
      <div className="p-3 border-b border-gray-700/50 shrink-0">
        <Header 
          tab={tab}
          setTab={setTab}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          filters={filters}
          setFilters={setFilters}
          allOrders={allOrders}
          completedTimeFilter={completedTimeFilter}
          setCompletedTimeFilter={setCompletedTimeFilter}
        />
      </div>
      
      <div className="flex-grow flex flex-row overflow-hidden">
        <AllDayView 
            orders={openOrders} 
            isOpen={isAllDayViewOpen} 
            onClose={() => setIsAllDayViewOpen(false)} 
        />
        <main className="flex-grow p-4 md:p-6 overflow-x-auto">
            {!isAllDayViewOpen && (
                 <button 
                    onClick={() => setIsAllDayViewOpen(true)}
                    className="fixed top-1/2 -translate-y-1/2 left-0 bg-gray-800 text-white p-2 rounded-r-lg z-20 hover:bg-gray-700 transition-colors"
                    aria-label="Open All Day View"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
                </button>
            )}
           
            {isLoading ? (
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
              <div className="p-4 bg-gray-800 rounded-lg text-white max-w-lg w-full">
                <h2 className="text-2xl font-bold mb-4 border-b border-gray-700 pb-2">Order Details</h2>
                <div className="space-y-2">
                    <p><strong>Ticket:</strong> {selectedOrder.ticketName || `#${selectedOrder.id.slice(-6)}`}</p>
                    <p><strong>Received:</strong> <TimeAgo date={selectedOrder.createdAt} /></p>
                    <p><strong>Source:</strong> {selectedOrder.source?.name || 'In-Store'}</p>
                    <p><strong>Rush Order:</strong> {selectedOrder.isRush ? 
                        <span className='text-purple-400 font-bold'>Yes</span> : 
                        'No'
                    }</p>
                </div>
                <h3 className="text-xl font-bold mt-6 mb-3 border-b border-gray-700 pb-2">Items</h3>
                <ul className="space-y-3 max-h-60 overflow-y-auto">
                  {selectedOrder.lineItems.map(item => (
                    <li key={item.uid} className="bg-gray-700/50 p-2 rounded-md">
                        <span className="font-bold">{item.quantity}x</span> {item.name}
                        {item.modifiers && item.modifiers.length > 0 && (
                            <ul className="pl-6 text-sm text-gray-400">
                                {item.modifiers.map(mod => <li key={mod.uid}>- {mod.name}</li>)}
                            </ul>
                        )}
                    </li>
                  ))}
                </ul>
              </div>
            </Modal>
          )}
      </AnimatePresence>
    </div>
  );
}
