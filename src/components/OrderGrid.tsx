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
    <div className="flex-1 flex gap-4 overflow-x-auto p-4 bg-white min-h-[300px] items-start">
        {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center w-full h-full text-center mt-16">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-orange-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0-1.104-.896-2-2-2s-2 .896-2 2 .896 2 2 2 2-.896 2-2zm0 0c0-1.104.896-2 2-2s2 .896 2 2-.896 2-2 2-2-.896-2-2zm-6 8h12M6 19v-2a4 4 0 018 0v2" /></svg>
                <div className="text-lg text-gray-400 font-semibold">No recent orders</div>
            </div>
        ) : (
            <AnimatePresence>
                {orders.map(order => (
                    <OrderCard
                        key={order.id}
                        order={order}
                        onDone={() => onDone(order.id)}
                        onReopen={() => onReopen(order.id)}
                        onCardClick={() => onCardClick(order)}
                        isPending={pendingCompletion.has(order.id)}
                        isCompleted={completedTickets.has(order.id)}
                    />
                ))}
            </AnimatePresence>
        )}
    </div>
); 