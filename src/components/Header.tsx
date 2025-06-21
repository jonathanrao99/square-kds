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
    completedTimeFilter: 'day' | 'week' | 'month';
    setCompletedTimeFilter: (filter: 'day' | 'week' | 'month') => void;
}

const TimeFilterButton = ({ filter, current, setFilter }: { filter: 'day' | 'week' | 'month', current: string, setFilter: (f: any) => void}) => (
    <button
        onClick={() => setFilter(filter)}
        className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
            current === filter ? 'bg-white text-black' : 'bg-gray-700 hover:bg-gray-600 text-white'
        }`}
    >
        {filter.charAt(0).toUpperCase() + filter.slice(1)}
    </button>
);

export const Header = ({ tab, setTab, onRefresh, isRefreshing, filters, setFilters, allOrders, completedTimeFilter, setCompletedTimeFilter }: HeaderProps) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    const dropdownVariants = {
        hidden: { opacity: 0, scale: 0.95, y: -10 },
        visible: { opacity: 1, scale: 1, y: 0 },
    };

    const hasActiveFilters = Object.values(filters).some(v => v !== undefined);

    return (
        <>
            <header className="flex items-center justify-between text-white">
                {/* Left Section */}
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-2xl" aria-label="Menu">☰</button>
                        <AnimatePresence>
                            {isMenuOpen && (
                                <motion.div
                                    initial="hidden"
                                    animate="visible"
                                    exit="hidden"
                                    variants={dropdownVariants}
                                    className="absolute top-10 left-0 bg-gray-800 rounded-lg shadow-2xl z-50 w-48 border border-gray-700"
                                >
                                    <ul className="p-2">
                                        <li><Link href="/dashboard" className="block px-4 py-2 text-white rounded-md hover:bg-gray-700">Analytics</Link></li>
                                        <li><Link href="/settings" className="block px-4 py-2 text-white rounded-md hover:bg-gray-700">Settings</Link></li>
                                    </ul>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <button className="text-2xl" onClick={onRefresh} aria-label="Refresh Orders">
                        <motion.div animate={{ rotate: isRefreshing ? 360 : 0 }} transition={{ duration: 0.7 }}>⟳</motion.div>
                    </button>
                    <button 
                        onClick={() => setIsFilterModalOpen(true)}
                        className={`relative px-4 py-1.5 rounded-md text-sm font-semibold transition-colors flex items-center gap-2 ${hasActiveFilters ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M7 12h10m-7 8h4" /></svg>
                        Filter
                        {hasActiveFilters && <span className="absolute -top-1 -right-1 block h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-gray-800" />}
                    </button>
                </div>

                {/* Center Section */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tab}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-1/2 -translate-x-1/2"
                    >
                        {tab === 'open' ? (
                            <h1 className="text-2xl font-bold tracking-wider whitespace-nowrap">Open Orders</h1>
                        ) : (
                            <div className="flex items-center gap-2 bg-gray-800 p-1 rounded-lg">
                               <TimeFilterButton filter="day" current={completedTimeFilter} setFilter={setCompletedTimeFilter} />
                               <TimeFilterButton filter="week" current={completedTimeFilter} setFilter={setCompletedTimeFilter} />
                               <TimeFilterButton filter="month" current={completedTimeFilter} setFilter={setCompletedTimeFilter} />
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
                
                {/* Right Section */}
                <div className="flex items-center">
                    <div className="flex space-x-2 bg-gray-800 p-1 rounded-lg">
                        <button
                            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${tab === 'open' ? 'bg-white text-black' : 'text-white'}`}
                            onClick={() => setTab('open')}
                        >Open</button>
                        <button
                            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${tab === 'completed' ? 'bg-white text-black' : 'text-white'}`}
                            onClick={() => setTab('completed')}
                        >Completed</button>
                    </div>
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