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
import { AllDayView } from '@/components/AllDayView';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function Home() {
  const [tab, setTab] = useState<'open' | 'completed'>('open');
  const [isAllDayViewOpen, setIsAllDayViewOpen] = useState(true);
  const { data, error } = useSWR('/api/orders', fetcher);
  
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

  const handleCardClick = (order: Order) => {
    setSelectedOrder(order);
  };
  
  const allOrders: Order[] = data?.orders ?? [];
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

  // Open: all not completed, plus paid orders in last 2 hours (if not completed)
  const openOrders = [
    ...allOrders.filter(o => !completedTickets.has(o.id)),
    ...allOrders.filter(o =>
      o.isPaid &&
      new Date(o.createdAt) > twoHoursAgo &&
      !completedTickets.has(o.id)
    )
  ].filter((order, idx, arr) => arr.findIndex(o => o.id === order.id) === idx); // remove duplicates

  const completedOrders = allOrders.filter(o => completedTickets.has(o.id));
  const displayedOrders = tab === 'open' ? openOrders : completedOrders;

  const prevOrderCount = useRef<number>(openOrders.length);

  useEffect(() => {
    if (openOrders.length > prevOrderCount.current) {
        // Sound notification logic will be re-implemented later
    }
    prevOrderCount.current = openOrders.length;
  }, [openOrders.length]);

  if (error) return <div className="min-h-screen bg-black p-4 text-white text-center">Failed to load orders. Please try again.</div>;

  return (
    <div className="h-screen bg-black flex flex-col font-sans">
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
              <div className="p-4 text-white">
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
