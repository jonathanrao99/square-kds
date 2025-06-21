"use client";

import { motion } from 'framer-motion';
import { SubPageNav } from '@/components/SubPageNav';

const Dashboard = () => {
    // Note: The analytics logic is placeholder.
    // It should be replaced with actual data fetching and processing.
    const analytics = {
        totalTickets: 0,
        avgTime: '0m 0s',
        busiestHour: 'N/A',
        topItem: 'N/A',
    };

    return (
        <div className="min-h-screen bg-black text-white">
            <SubPageNav />
            <main className="p-8">
                <motion.h1 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl font-bold mb-8"
                >
                    Analytics Dashboard
                </motion.h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Average Completion Time */}
                    <div className="bg-gray-800 p-6 rounded-lg">
                        <h2 className="text-xl font-semibold mb-2">Avg. Completion Time</h2>
                        <p className="text-3xl font-bold">{analytics.avgTime}</p>
                        <p className="text-gray-400">Average time from open to completed.</p>
                    </div>

                    {/* Order Volume */}
                    <div className="bg-gray-800 p-6 rounded-lg">
                        <h2 className="text-xl font-semibold mb-2">Order Volume (24h)</h2>
                        <p className="text-3xl font-bold">{analytics.totalTickets}</p>
                        <p className="text-gray-400">Total orders in the last 24 hours.</p>
                    </div>

                    {/* Rush Orders */}
                    <div className="bg-gray-800 p-6 rounded-lg">
                        <h2 className="text-xl font-semibold mb-2">Rush Orders (24h)</h2>
                        <p className="text-3xl font-bold">0</p>
                        <p className="text-gray-400">Number of rush orders.</p>
                    </div>
                </div>

                {/* Order Trends Chart */}
                <div className="mt-12 bg-gray-800 p-6 rounded-lg">
                    <h2 className="text-2xl font-semibold mb-4">Order Trends</h2>
                    <div className="h-64 bg-gray-700 rounded-md flex items-center justify-center">
                        <p className="text-gray-400">Chart placeholder for visualizing order volume over time.</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard; 