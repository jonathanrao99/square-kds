import { motion } from 'framer-motion';
import { Order } from '@/types';
import { TimeAgo } from './TimeAgo';
import { useOrderItemStatus } from '@/hooks/useOrderItemStatus';

interface OrderCardProps {
  order: Order;
  onDone: () => void;
  onReopen: () => void;
  onCardClick: () => void;
  isPending: boolean;
  isCompleted: boolean;
}

export function OrderCard({ order, onDone, onReopen, onCardClick, isPending, isCompleted }: OrderCardProps) {
  const { itemStatus, toggleItemStatus } = useOrderItemStatus(order.lineItems, isCompleted);

  const getHeaderColor = () => {
    if (order.isPaid) return 'bg-green-600'; // Paid orders: green header
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
        className={`rounded-lg shadow-2xl bg-[var(--background-light)] text-[var(--text-primary)] border border-[var(--border-color)] w-[360px] shrink-0 flex flex-col max-h-screen ${order.isRush ? 'border-[var(--accent-orange)] border-2' : ''}`}
        onClick={isPending ? onReopen : onCardClick}
    >
        {/* Fixed Header */}
        <div className={`p-4 rounded-t-lg ${getHeaderColor()} flex justify-between items-center shrink-0`}>
            <h3 className="font-bold text-2xl">{displayName}</h3>
            <div className='flex flex-col items-end'>
              {order.isRush && <span className="text-xs font-bold bg-[var(--accent-orange)] text-white px-2 py-1 rounded-full mb-1 animate-pulse">RUSH</span>}
              <span className="text-sm font-medium"><TimeAgo date={order.createdAt} /></span>
            </div>
        </div>
        
        {/* Content Area */}
        <div className="p-4 flex flex-col flex-1 min-h-0">
            <ul className="space-y-3 overflow-y-auto">
                {order.lineItems.map(item => {
                    const itemCompleted = itemStatus[item.uid] === 'completed';
                    return (
                        <li 
                            key={item.uid} 
                            className={`flex items-center text-2xl cursor-pointer hover:bg-[var(--background-dark)] p-2 rounded transition-colors ${
                                itemCompleted ? 'line-through text-[var(--text-secondary)]' : ''
                            }`}
                            onClick={() => toggleItemStatus(item.uid)}
                        >
                            <span className="font-bold mr-3">{item.quantity} x</span>
                            <span>{item.name}</span>
                        </li>
                    );
                })}
            </ul>
            
            {/* Done Button */}
            <div className="mt-4 shrink-0">
                {isCompleted ? (
                    <div className="w-full bg-[var(--green-color)] text-white font-bold py-2 rounded-md text-center cursor-not-allowed">
                        Completed
                    </div>
                ) : (
                    <button
                        onClick={!isPending ? onDone : undefined}
                        className="text-[var(--accent-orange)] font-semibold text-center w-full hover:text-[var(--accent-orange-dark)] transition-colors disabled:opacity-50 disabled:cursor-wait"
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