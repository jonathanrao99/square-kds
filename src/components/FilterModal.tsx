import { motion, AnimatePresence } from 'framer-motion';
import { Filters } from '@/app/page';
import { Order } from '@/types';

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    filters: Filters;
    setFilters: (filters: Filters) => void;
    allOrders: Order[];
}

export const FilterModal = ({ isOpen, onClose, filters, setFilters, allOrders }: FilterModalProps) => {
    const availableSources = [...new Set(allOrders.map(o => o.source?.name).filter(Boolean))] as string[];

    const handleRushToggle = () => {
        setFilters({ ...filters, isRush: !filters.isRush });
    };

    const handleSourceSelect = (source: string) => {
        setFilters({ ...filters, source: filters.source === source ? undefined : source });
    };
    
    const clearFilters = () => {
        setFilters({});
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: -20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: -20 }}
                        className="bg-gray-800 rounded-lg shadow-2xl z-50 w-full max-w-md border border-gray-700 p-6"
                        onClick={e => e.stopPropagation()}
                    >
                        <h2 className="text-2xl font-bold text-white mb-6">Filter Orders</h2>
                        
                        <div className="space-y-4">
                            <label className="flex items-center justify-between cursor-pointer">
                                <span className="text-lg text-white">Rush Orders Only</span>
                                <input 
                                    type="checkbox" 
                                    checked={!!filters.isRush} 
                                    onChange={handleRushToggle}
                                    className="h-6 w-6 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
                                />
                            </label>

                            <div>
                                <h3 className="text-lg text-white mb-2">Source</h3>
                                <div className="flex flex-wrap gap-2">
                                    {availableSources.map(source => (
                                        <button
                                            key={source}
                                            onClick={() => handleSourceSelect(source)}
                                            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                                                filters.source === source 
                                                ? 'bg-blue-600 text-white' 
                                                : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                                            }`}
                                        >
                                            {source}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-4">
                            <button 
                                onClick={clearFilters}
                                className="px-4 py-2 rounded-md text-white bg-gray-600 hover:bg-gray-500 font-semibold"
                            >
                                Clear
                            </button>
                            <button 
                                onClick={onClose}
                                className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-500 font-semibold"
                            >
                                Done
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}; 