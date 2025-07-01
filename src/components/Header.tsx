import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Filters } from '@/app/page';
import { Order } from '@/types';
import { FilterModal } from './FilterModal';

interface HeaderProps {
    tab: 'open' | 'completed';
    setTab: (tab: 'open' | 'completed') => void;
    onRefresh: () => void;
    isRefreshing: boolean;
    filters: Filters;
    setFilters: (filters: Filters) => void;
    allOrders: Order[];
    completedRange: 'day' | 'week' | 'month';
    setCompletedRange: (range: 'day' | 'week' | 'month') => void;
    showCompletedRange: boolean;
}

export const Header = ({ tab, setTab, onRefresh, isRefreshing, filters, setFilters, allOrders, completedRange, setCompletedRange, showCompletedRange }: HeaderProps) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    const dropdownVariants = {
        hidden: { opacity: 0, scale: 0.95, y: -10 },
        visible: { opacity: 1, scale: 1, y: 0 },
    };

    const hasActiveFilters = Object.values(filters).some(v => v !== undefined);

    return (
        <>
            <header className="flex items-center justify-between text-[#181818] bg-white border-b border-[#eee] py-4 px-2 sticky top-0 z-30 shadow-md">
                <div className="flex items-center space-x-4 min-w-0">
                    <div className="relative">
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-3xl" aria-label="Menu">☰</button>
                        <AnimatePresence>
                            {isMenuOpen && (
                                <motion.div
                                    initial="hidden"
                                    animate="visible"
                                    exit="hidden"
                                    variants={dropdownVariants}
                                    className="absolute top-12 left-0 bg-white rounded-lg shadow-2xl z-50 w-48 border border-[#eee]"
                                >
                                    <ul className="p-2">
                                        <li>
                                            <Link href="/dashboard" className="block px-4 py-2 text-[#181818] rounded-md hover:bg-orange-50">Analytics</Link>
                                        </li>
                                        <li>
                                            <Link href="/settings" className="block px-4 py-2 text-[#181818] rounded-md hover:bg-orange-50">Settings</Link>
                                        </li>
                                    </ul>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <button className="text-3xl" onClick={onRefresh} aria-label="Refresh Orders">
                        <motion.div animate={{ rotate: isRefreshing ? 360 : 0 }} transition={{ duration: 0.7 }}>⟳</motion.div>
                    </button>
                </div>
                <div className="flex-1 flex justify-center items-center min-w-0">
                    <h1 className="text-3xl font-bold tracking-wider truncate text-center">Desi Flavors Katy KDS</h1>
                </div>
                <div className="flex items-center space-x-2 min-w-0 justify-end">
                    <button 
                        onClick={() => setIsFilterModalOpen(true)}
                        className={`relative px-5 py-2 rounded-lg text-lg font-semibold transition-colors ${hasActiveFilters ? 'bg-orange-600 text-white' : 'bg-white hover:bg-orange-50 text-[#181818] border border-[#eee]'}`}
                    >
                        Filter
                        {hasActiveFilters && <span className="absolute -top-1 -right-1 block h-3 w-3 rounded-full bg-orange-400 border-2 border-white" />}
                    </button>
                    <button
                        className={`px-5 py-2 rounded-lg text-lg font-semibold transition-colors ${tab === 'open' ? 'bg-orange-600 text-white' : 'bg-white hover:bg-orange-50 text-[#181818] border border-[#eee]'}`}
                        onClick={() => setTab('open')}
                    >Open</button>
                    <button
                        className={`px-5 py-2 rounded-lg text-lg font-semibold transition-colors ${tab === 'completed' ? 'bg-orange-600 text-white' : 'bg-white hover:bg-orange-50 text-[#181818] border border-[#eee]'}`}
                        onClick={() => setTab('completed')}
                    >Completed</button>
                    {showCompletedRange && (
                        <div className="flex gap-1 ml-2">
                            <button onClick={() => setCompletedRange('day')} className={`px-3 py-1 rounded-md font-semibold text-sm ${completedRange === 'day' ? 'bg-orange-500 text-white' : 'bg-white text-orange-600 border border-[#eee]'}`}>Day</button>
                            <button onClick={() => setCompletedRange('week')} className={`px-3 py-1 rounded-md font-semibold text-sm ${completedRange === 'week' ? 'bg-orange-500 text-white' : 'bg-white text-orange-600 border border-[#eee]'}`}>Week</button>
                            <button onClick={() => setCompletedRange('month')} className={`px-3 py-1 rounded-md font-semibold text-sm ${completedRange === 'month' ? 'bg-orange-500 text-white' : 'bg-white text-orange-600 border border-[#eee]'}`}>Month</button>
                        </div>
                    )}
                </div>
            </header>
            <FilterModal 
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                filters={filters}
                setFilters={setFilters}
                allOrders={allOrders}
            />
        </>
    );
}; 