"use client";

import { motion } from 'framer-motion';
import { SubPageNav } from '@/components/SubPageNav';
import useSWR from 'swr';

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
        const errorDetails = await res.json();
        const error = new Error('An error occurred while fetching the data.');
        (error as Error & { info?: object }).info = errorDetails;
        throw error;
    }
    return res.json();
};

const Dashboard = () => {
    const { data, error, isLoading } = useSWR('/api/analytics', fetcher, { refreshInterval: 60000 }); // Refresh every minute

    if (isLoading) return <div className="min-h-screen bg-black text-white p-8">Loading analytics...</div>;
    if (error) return <div className="min-h-screen bg-black text-white p-8">Failed to load analytics: {error.message}</div>;

    const analytics = data || {
        totalTickets: 0,
        avgCompletionTime: '0m 0s',
        busiestHour: 'N/A',
        topItem: 'N/A',
        rushOrders: 0,
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
                        <p className="text-3xl font-bold">{analytics.avgCompletionTime}</p>
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
                        <p className="text-3xl font-bold">{analytics.rushOrders}</p>
                        <p className="text-gray-400">Number of rush orders.</p>
                    </div>

                    {/* Busiest Hour */}
                    <div className="bg-gray-800 p-6 rounded-lg">
                        <h2 className="text-xl font-semibold mb-2">Busiest Hour (24h)</h2>
                        <p className="text-3xl font-bold">{analytics.busiestHour}</p>
                        <p className="text-gray-400">The hour with the most orders.</p>
                    </div>

                    {/* Top Selling Item */}
                    <div className="bg-gray-800 p-6 rounded-lg">
                        <h2 className="text-xl font-semibold mb-2">Top Selling Item (24h)</h2>
                        <p className="text-3xl font-bold">{analytics.topItem}</p>
                        <p className="text-gray-400">The item sold most frequently.</p>
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