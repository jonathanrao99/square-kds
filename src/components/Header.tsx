import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface HeaderProps {
    tab: 'open' | 'completed';
    setTab: (tab: 'open' | 'completed') => void;
    onRefresh: () => void;
    isRefreshing: boolean;
}

export const Header = ({ tab, setTab, onRefresh, isRefreshing }: HeaderProps) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const dropdownVariants = {
        hidden: { opacity: 0, scale: 0.95, y: -10 },
        visible: { opacity: 1, scale: 1, y: 0 },
    };

    return (
        <header className="flex items-center justify-between mb-6 text-white">
            <div className="flex items-center space-x-4">
                <div className="relative">
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-3xl" aria-label="Menu">☰</button>
                    <AnimatePresence>
                        {isMenuOpen && (
                            <motion.div
                                initial="hidden"
                                animate="visible"
                                exit="hidden"
                                variants={dropdownVariants}
                                className="absolute top-12 left-0 bg-gray-800 rounded-lg shadow-2xl z-50 w-48 border border-gray-700"
                            >
                                <ul className="p-2">
                                    <li>
                                        <Link href="/dashboard" className="block px-4 py-2 text-white rounded-md hover:bg-gray-700">Analytics</Link>
                                    </li>
                                    <li>
                                        <Link href="/settings" className="block px-4 py-2 text-white rounded-md hover:bg-gray-700">Settings</Link>
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
            <h1 className="text-3xl font-bold tracking-wider">Desi Flavors Katy KDS</h1>
            <div className="flex items-center space-x-4">
                <div className="flex space-x-2">
                    <button
                        className={`px-5 py-2 rounded-lg text-lg font-semibold transition-colors ${tab === 'open' ? 'bg-white text-black' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
                        onClick={() => setTab('open')}
                    >Open</button>
                    <button
                        className={`px-5 py-2 rounded-lg text-lg font-semibold transition-colors ${tab === 'completed' ? 'bg-white text-black' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
                        onClick={() => setTab('completed')}
                    >Completed</button>
                </div>
            </div>
        </header>
    );
}; 