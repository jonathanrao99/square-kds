import { AnimatePresence } from 'framer-motion';
import { Order } from '@/types';
import { OrderCard } from './OrderCard';

interface OrderGridProps {
    orders: Order[];
    onDone: (orderId: string) => void;
    onReopen: (orderId: string) => void;
    onCardClick: (order: Order) => void;
    pendingCompletion: Map<string, NodeJS.Timeout>;
    completedTickets: Set<string>;
}

export const OrderGrid = ({ orders, onDone, onReopen, onCardClick, pendingCompletion, completedTickets }: OrderGridProps) => (
    <div className="flex flex-row items-start gap-4 overflow-x-auto overflow-y-hidden p-4 bg-black">
        <AnimatePresence>
            {orders.map((order, idx) => (
                <OrderCard
                    key={order.id && order.id !== '' ? order.id : `order-${idx}`}
                    order={order}
                    onDone={() => onDone(order.id)}
                    onReopen={() => onReopen(order.id)}
                    onCardClick={() => onCardClick(order)}
                    isPending={pendingCompletion.has(order.id)}
                    isCompleted={completedTickets.has(order.id)}
                />
            ))}
        </AnimatePresence>
    </div>
); 