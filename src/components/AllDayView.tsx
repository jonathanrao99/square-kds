import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Order, LineItem } from '@/types';

interface AllDayViewProps {
    orders: Order[];
    isOpen: boolean;
    onClose: () => void;
}

interface AggregatedItem {
    name: string;
    quantity: number;
    modifiers?: { name: string; quantity: number }[];
}

const getItemIdentifier = (item: LineItem) => {
    const sortedModifiers = item.modifiers?.map(m => m.name).sort().join(', ') || '';
    return `${item.name}${sortedModifiers ? ` (${sortedModifiers})` : ''}`;
}

export const AllDayView = ({ orders, isOpen, onClose }: AllDayViewProps) => {
    const aggregatedItems = useMemo(() => {
        const itemMap = new Map<string, number>();
        orders.forEach(order => {
            order.lineItems.forEach(item => {
                const identifier = getItemIdentifier(item);
                const currentQuantity = itemMap.get(identifier) || 0;
                itemMap.set(identifier, currentQuantity + Number(item.quantity));
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
            className="h-full bg-gray-900 border-r border-gray-800 overflow-hidden shrink-0"
        >
            <div className="p-4 h-full w-[300px]">
                <div className="flex items-center mb-6">
                    <button onClick={onClose} className="text-2xl text-white p-2 hover:bg-gray-700 rounded-full mr-2">
                        &lt;
                    </button>
                    <h2 className="text-2xl font-bold text-white">All Day</h2>
                </div>
                <ul className="space-y-2 text-white overflow-y-auto h-[calc(100%-4rem)]">
                    {aggregatedItems.map(item => (
                        <motion.li 
                            key={item.name}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            layout
                            className="text-md bg-gray-800 p-3 rounded-md hover:bg-gray-700/50 transition-colors"
                        >
                            <div className="flex justify-between items-center">
                                <span className="font-semibold truncate pr-4">{item.name}</span>
                                <span className="font-bold text-lg bg-blue-600 w-10 h-10 flex items-center justify-center rounded-full flex-shrink-0">{item.quantity}</span>
                            </div>
                        </motion.li>
                    ))}
                    {aggregatedItems.length === 0 && (
                        <p className="text-gray-400 text-center mt-8">No open orders.</p>
                    )}
                </ul>
            </div>
        </motion.div>
    );
}; 