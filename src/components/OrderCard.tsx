import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Order } from '@/types';

interface OrderCardProps {
  order: Order;
  onDone: () => void;
  onReopen: () => void;
  onCardClick: () => void;
  isPending: boolean;
  isCompleted: boolean;
}

export function OrderCard({ order, onDone, onReopen, onCardClick, isPending, isCompleted }: OrderCardProps) {
  const [itemStatus, setItemStatus] = useState<Record<string, 'pending' | 'completed'>>({});
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerSettings, setTimerSettings] = useState({ warningTime: 300, dangerTime: 600 });

  useEffect(() => {
    // This effect runs only on the client-side
    const warning = localStorage.getItem('timerWarningTime');
    const danger = localStorage.getItem('timerDangerTime');
    setTimerSettings({
      warningTime: warning ? parseInt(warning, 10) * 60 : 300,
      dangerTime: danger ? parseInt(danger, 10) * 60 : 600,
    });

    const calculateElapsedTime = () => {
      const now = new Date().getTime();
      const createdAt = new Date(order.createdAt).getTime();
      return Math.floor((now - createdAt) / 1000);
    };

    if (!isCompleted) {
      setElapsedTime(calculateElapsedTime()); // Set initial time

      const interval = setInterval(() => {
        setElapsedTime(calculateElapsedTime());
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setElapsedTime(0);
    }
  }, [order.createdAt, isCompleted]);

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

  const getTimerStyle = () => {
    if (isCompleted || isPending) {
        return {
            borderColor: 'border-gray-700/50',
            textColor: 'text-gray-400',
            cardBg: ''
        };
    }
    // These thresholds can be moved to settings later
    if (elapsedTime > timerSettings.dangerTime) { // Over danger time
      return {
        borderColor: 'border-red-500',
        textColor: 'text-red-400',
        cardBg: 'bg-red-900/20'
      };
    }
    if (elapsedTime > timerSettings.warningTime) { // Over warning time
      return {
        borderColor: 'border-yellow-500',
        textColor: 'text-yellow-400',
        cardBg: 'bg-yellow-900/20'
      };
    }
    return {
        borderColor: order.isRush ? 'border-purple-500' : 'border-gray-700/50',
        textColor: 'text-white',
        cardBg: ''
    };
  };

  const formatTime = (seconds: number) => {
    if (seconds < 0) seconds = 0;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const cardVariants = {
    initial: { opacity: 0, y: 20, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
    pending: { opacity: 0.5, transition: { duration: 0.5 } }
  };

  const displayName = order.ticketName || `#${order.id.slice(-6)}`;
  const timerStyle = getTimerStyle();

  return (
    <motion.div
        variants={cardVariants}
        initial="initial"
        animate={isPending ? "pending" : "animate"}
        exit="exit"
        layout
        className={`flex flex-col rounded-lg shadow-2xl bg-gray-900 text-white border-2 ${timerStyle.borderColor} ${timerStyle.cardBg} w-full max-w-sm shrink-0 transition-colors duration-500`}
        onClick={isPending ? onReopen : onCardClick}
    >
        <div className={`p-3 rounded-t-lg ${getHeaderColor()} flex justify-between items-center shrink-0`}>
            <h3 className="font-bold text-2xl">{displayName}</h3>
            <div className='flex flex-col items-end'>
              {order.isRush && <span className="text-xs font-bold bg-white text-purple-600 px-2 py-1 rounded-full mb-1 animate-pulse">RUSH</span>}
              <span className={`text-xl font-mono font-bold ${timerStyle.textColor} transition-colors duration-500`}>
                {isCompleted ? 'Done' : formatTime(elapsedTime)}
              </span>
            </div>
        </div>
        <div className="flex-shrink-0 overflow-y-auto">
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