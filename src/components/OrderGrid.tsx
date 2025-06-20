import { motion, AnimatePresence } from 'framer-motion';
import { Order } from '@/types';
import { OrderCard } from './OrderCard';

interface OrderGridProps {
    orders: Order[];
    onDone: (orderId: string) => void;
    onReopen: (orderId: string) => void;
    pendingCompletion: Map<string, NodeJS.Timeout>;
    completedTickets: Set<string>;
}

export const OrderGrid = ({ orders, onDone, onReopen, pendingCompletion, completedTickets }: OrderGridProps) => (
    <AnimatePresence>
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-5 items-start"
        >
          {orders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onDone={() => onDone(order.id)}
              onReopen={() => onReopen(order.id)}
              isPending={pendingCompletion.has(order.id)}
              isCompleted={completedTickets.has(order.id)}
            />
          ))}
        </motion.div>
    </AnimatePresence>
); 