'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface NavLink {
    href: string;
    label: string;
}

interface HeaderProps {
    tab?: 'open' | 'completed';
    setTab?: (tab: 'open' | 'completed') => void;
    onRefresh?: () => void;
    isRefreshing?: boolean;
    navLinks?: NavLink[];
}

export const Header = ({ tab, setTab, onRefresh, isRefreshing, navLinks = [] }: HeaderProps) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const dropdownVariants = {
        hidden: { opacity: 0, scale: 0.95, y: -10 },
        visible: { opacity: 1, scale: 1, y: 0 },
    };

    return (
        <header className="flex items-center justify-between mb-2 px-3 py-3 text-orange min-h-20">
            <div className="flex items-center space-x-2">
                <div className="relative">
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-2xl px-2" aria-label="Menu">☰</button>
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
                                    {navLinks.map(link => (
                                        <li key={link.href}>
                                            <Link href={link.href} className="block px-4 py-2 text-white rounded-md hover:bg-gray-700 text-lg">{link.label}</Link>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                {onRefresh && (
                    <button className="text-2xl px-2" onClick={onRefresh} aria-label="Refresh Orders">
                        <motion.div animate={{ rotate: isRefreshing ? 360 : 0 }} transition={{ duration: 0.7 }}>⟳</motion.div>
                    </button>
                )}
            </div>
            <h1 className="text-3xl font-bold tracking-wider whitespace-nowrap">Desi Flavors Katy KDS</h1>
            {tab && setTab ? (
                <div className="flex items-center space-x-2">
                    <button
                        className={`px-6 py-3 rounded-lg text-xl font-semibold transition-colors ${tab === 'open' ? 'bg-white text-black' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
                        onClick={() => setTab('open')}
                    >Open</button>
                    <button
                        className={`px-6 py-3 rounded-lg text-xl font-semibold transition-colors ${tab === 'completed' ? 'bg-white text-black' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
                        onClick={() => setTab('completed')}
                    >Completed</button>
                </div>
            ) : <div className="w-24" />}
        </header>
    );
}; 