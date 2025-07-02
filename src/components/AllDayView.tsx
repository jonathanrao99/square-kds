import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Order } from '@/types';

interface AllDayViewProps {
    orders: Order[];
    isOpen: boolean;
    onClose: () => void;
}

interface AggregatedItem {
    name: string;
    quantity: number;
}

export const AllDayView = ({ orders, isOpen, onClose }: AllDayViewProps) => {
    const aggregatedItems = useMemo<AggregatedItem[]>(() => {
        const itemMap = new Map<string, number>();
        orders.forEach(order => {
            (order.lineItems || []).forEach(item => {
                const name = item.name || 'Unknown Item';
                const currentQuantity = itemMap.get(name) || 0;
                itemMap.set(name, currentQuantity + Number(item.quantity));
            });
        });

        return Array.from(itemMap.entries())
            .map(([name, quantity]) => ({ name, quantity }))
            .sort((a, b) => b.quantity - a.quantity);

    }, [orders]);
    
    return (
        <motion.div
            initial={false}
            animate={{ width: isOpen ? 300 : 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className="h-full bg-[var(--background-light)] border-r border-[var(--border-color)] overflow-hidden shrink-0"
        >
            <div className="p-4 h-full w-[300px]">
                <div className="flex items-center mb-6">
                    <button onClick={onClose} className="text-2xl text-[var(--text-primary)] p-2 hover:bg-[var(--background-dark)] rounded-full mr-2">
                        &lt;
                    </button>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">All Day</h2>
                </div>
                <ul className="space-y-2 text-[var(--text-primary)] overflow-y-auto h-[calc(100%-4rem)]">
                    {aggregatedItems.map(item => (
                        <motion.li 
                            key={item.name}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex justify-between items-center text-md bg-[var(--background-dark)] p-3 rounded-md hover:bg-[var(--background-dark)]/50 transition-colors"
                        >
                            <span className="font-semibold truncate pr-4">{item.name}</span>
                            <span className="font-bold text-lg bg-[var(--accent-orange)] w-8 h-8 flex items-center justify-center rounded-full">{item.quantity}</span>
                        </motion.li>
                    ))}
                </ul>
            </div>
        </motion.div>
    );
}; 