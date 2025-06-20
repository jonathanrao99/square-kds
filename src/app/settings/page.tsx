"use client";

import { motion } from 'framer-motion';
import { SubPageNav } from '@/components/SubPageNav';

export default function Settings() {
    return (
        <div className="min-h-screen bg-black p-8 text-white">
            <SubPageNav />
            <motion.h1 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-bold mb-8"
            >
                Settings
            </motion.h1>
            <div className="bg-gray-800 p-6 rounded-lg">
                <p className="text-gray-400">Settings and configuration options will be available here in a future update.</p>
            </div>
        </div>
    );
} 