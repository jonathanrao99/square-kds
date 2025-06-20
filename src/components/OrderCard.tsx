import { motion } from 'framer-motion';
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
  const getHeaderColor = () => {
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

  return (
    <motion.div
        variants={cardVariants}
        initial="initial"
        animate={isPending ? "pending" : "animate"}
        exit="exit"
        layout
        className="flex flex-col rounded-lg shadow-2xl bg-gray-900 text-white border border-gray-700/50"
        onClick={isPending ? onReopen : undefined}
    >
        <div className={`p-3 rounded-t-lg ${getHeaderColor()} flex justify-between items-center`}>
            <h3 className="font-bold text-xl">#{order.id.slice(-6)}</h3>
            <span className="text-sm font-medium"><TimeAgo date={order.createdAt} /></span>
        </div>
        <ul className="p-4 space-y-3 flex-grow">
            {order.lineItems.map(item => (
                <li key={item.uid} className={`flex items-center text-lg ${isCompleted ? 'line-through text-gray-500' : ''}`}>
                    <span className="font-bold mr-3">{item.quantity} x</span>
                    <span>{item.name}</span>
                </li>
            ))}
        </ul>
        <div className="p-4 mt-auto">
            {isCompleted ? (
                <div className="w-full bg-green-600 text-white font-bold py-2 rounded-md text-center cursor-not-allowed">
                    Completed
                </div>
            ) : (
                <button
                    onClick={!isPending ? onDone : undefined}
                    className="text-green-400 font-semibold text-center w-full hover:underline disabled:opacity-50 disabled:cursor-wait"
                    disabled={isPending}
                >
                    {isPending ? 'Completing...' : 'Done'}
                </button>
            )}
        </div>
    </motion.div>
  );
} 