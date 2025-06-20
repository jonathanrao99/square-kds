import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Order } from '@/types';
import { TimeAgo } from './TimeAgo';

interface OrderCardProps {
  order: Order;
  onDone: () => void;
  onReopen: () => void;
  isPending: boolean;
  isCompleted: boolean;
}

export function OrderCard({ order, onDone, onReopen, isPending, isCompleted }: OrderCardProps) {
  const [itemStatus, setItemStatus] = useState<Record<string, 'pending' | 'completed'>>({});

  useEffect(() => {
    if (isCompleted) {
      // Mark all items as completed when the order is completed
      const allCompleted: Record<string, 'pending' | 'completed'> = {};
      order.lineItems.forEach(item => {
        allCompleted[item.uid] = 'completed';
      });
      setItemStatus(allCompleted);
    } else {
      // Initialize all items as pending for open orders
      const allPending: Record<string, 'pending' | 'completed'> = {};
      order.lineItems.forEach(item => {
        allPending[item.uid] = 'pending';
      });
      setItemStatus(allPending);
    }
  }, [order.lineItems, isCompleted]);

  const toggleItemStatus = (itemId: string) => {
    if (isCompleted || isPending) return; // Don't allow changes if order is completed or pending
    
    setItemStatus(prev => ({
      ...prev,
      [itemId]: prev[itemId] === 'completed' ? 'pending' : 'completed'
    }));
  };

  const getHeaderColor = () => {
    if (order.isRush) return 'bg-purple-600';
    const sourceName = order.source?.name?.toLowerCase() || '';
    if (sourceName.includes('delivery') || sourceName.includes('online')) return 'bg-red-600';
    return 'bg-blue-600';
  }

  const cardVariants = {
    initial: { opacity: 0, y: 20, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
    pending: { opacity: 0.5, transition: { duration: 0.5 } }
  };

  const displayName = order.ticketName || `#${order.id.slice(-6)}`;

  return (
    <motion.div
        variants={cardVariants}
        initial="initial"
        animate={isPending ? "pending" : "animate"}
        exit="exit"
        layout
        className="flex flex-col rounded-lg shadow-2xl bg-gray-900 text-white border border-gray-700/50 w-[360px] max-h-full shrink-0"
        onClick={isPending ? onReopen : undefined}
    >
        <div className={`p-3 rounded-t-lg ${getHeaderColor()} flex justify-between items-center shrink-0`}>
            <h3 className="font-bold text-xl">{displayName}</h3>
            <span className="text-sm font-medium"><TimeAgo date={order.createdAt} /></span>
        </div>
        <div className="flex-grow overflow-y-auto">
            <ul className="p-4 space-y-3">
                {order.lineItems.map(item => {
                    const itemCompleted = itemStatus[item.uid] === 'completed';
                    return (
                        <li 
                            key={item.uid} 
                            className={`flex items-center text-lg cursor-pointer hover:bg-gray-800 p-2 rounded transition-colors ${
                                itemCompleted ? 'line-through text-gray-500' : ''
                            }`}
                            onClick={() => toggleItemStatus(item.uid)}
                        >
                            <span className="font-bold mr-3">{item.quantity} x</span>
                            <span>{item.name}</span>
                        </li>
                    );
                })}
            </ul>
            <div className="p-4 mt-auto">
                {isCompleted ? (
                    <div className="w-full bg-green-600 text-white font-bold py-2 rounded-md text-center cursor-not-allowed">
                        Completed
                    </div>
                ) : (
                    <button
                        onClick={!isPending ? onDone : undefined}
                        className="text-green-400 font-semibold text-center w-full hover:text-green-300 transition-colors disabled:opacity-50 disabled:cursor-wait"
                        disabled={isPending}
                    >
                        {isPending ? 'Completing...' : 'Done'}
                    </button>
                )}
            </div>
        </div>
    </motion.div>
  );
} 