"use client";

import { motion } from 'framer-motion';
import { SubPageNav } from '@/components/SubPageNav';
import useSWR from 'swr';
import { Order } from '@/types';

const fetcher = (url: string) => fetch(url).then(res => res.json());

const Dashboard = () => {
    const { data, error } = useSWR('/api/orders', fetcher);

    const analytics = {
        totalTickets: 0,
        avgCompletionTime: '0m 0s',
        rushOrders: 0,
    };

    if (data && data.orders) {
        const orders: Order[] = data.orders;
        analytics.totalTickets = orders.length;
        analytics.rushOrders = orders.filter(order => order.isRush).length;

        const completedOrders = orders.filter(order => order.completedAt);
        if (completedOrders.length > 0) {
            const totalCompletionTime = completedOrders.reduce((sum, order) => {
                const createdAt = new Date(order.createdAt).getTime();
                const completedAt = new Date(order.completedAt!).getTime();
                return sum + (completedAt - createdAt);
            }, 0);
            const avgTimeMs = totalCompletionTime / completedOrders.length;
            const minutes = Math.floor(avgTimeMs / (1000 * 60));
            const seconds = Math.floor((avgTimeMs / 1000) % 60);
            analytics.avgCompletionTime = `${minutes}m ${seconds}s`;
        }
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <SubPageNav />
            <main className="p-8">
                <motion.h1 
                    initial={{ opacity: 0, y: -19 }}
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