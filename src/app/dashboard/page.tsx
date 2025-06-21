"use client";

import { useState, useEffect, useMemo } from 'react';
import { Order } from '@/types';
import { motion } from 'framer-motion';
import { SubPageNav } from '@/components/SubPageNav';

interface MetricCardProps {
    title: string;
    value: string | number;
}

const MetricCard = ({ title, value }: MetricCardProps) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 p-6 rounded-lg shadow-lg text-center"
    >
        <h3 className="text-lg font-semibold text-gray-400 mb-2">{title}</h3>
        <p className="text-4xl font-bold text-white">{value}</p>
    </motion.div>
);

export default function Dashboard() {
    const [completedOrders, setCompletedOrders] = useState<Order[]>([]);

    useEffect(() => {
        const storedData = localStorage.getItem('sessionCompletedOrders');
        if (storedData) {
            setCompletedOrders(JSON.parse(storedData));
        }
    }, []);

    const analytics = useMemo(() => {
        if (completedOrders.length === 0) {
            return { totalTickets: 0, avgTime: 'N/A', busiestHour: 'N/A', topItem: 'N/A' };
        }

        // Avg Completion Time
        let totalCompletionTime = 0;
        completedOrders.forEach(order => {
            // @ts-ignore
            if (order.completedAt && order.createdAt) {
                 // @ts-ignore
                totalCompletionTime += (new Date(order.completedAt).getTime() - new Date(order.createdAt).getTime());
            }
        });
        const avgTimeMs = totalCompletionTime / completedOrders.length;
        const avgTime = `${Math.round(avgTimeMs / 1000 / 60)}m`;

        // Busiest Hour
        const hourCounts: { [hour: string]: number } = {};
        completedOrders.forEach(order => {
            const hour = new Date(order.createdAt).getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });
        const busiestHour = Object.entries(hourCounts).sort((a,b) => b[1] - a[1])[0][0];

        // Top Item
        const itemCounts = new Map<string, number>();
        completedOrders.forEach(order => {
            order.lineItems.forEach(item => {
                const name = item.name || 'Unknown Item';
                itemCounts.set(name, (itemCounts.get(name) || 0) + Number(item.quantity));
            });
        });
        const topItem = Array.from(itemCounts.entries()).sort((a,b) => b[1] - a[1])[0][0];

        return {
            totalTickets: completedOrders.length,
            avgTime,
            busiestHour: `${busiestHour}:00 - ${parseInt(busiestHour) + 1}:00`,
            topItem
        };
    }, [completedOrders]);

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
                        <p className="text-3xl font-bold">--:--</p>
                        <p className="text-gray-400">Placeholder for average time from open to completed.</p>
                    </div>

                    {/* Order Volume */}
                    <div className="bg-gray-800 p-6 rounded-lg">
                        <h2 className="text-xl font-semibold mb-2">Order Volume (24h)</h2>
                        <p className="text-3xl font-bold">0</p>
                        <p className="text-gray-400">Placeholder for total orders in the last 24 hours.</p>
                    </div>

                    {/* Rush Orders */}
                    <div className="bg-gray-800 p-6 rounded-lg">
                        <h2 className="text-xl font-semibold mb-2">Rush Orders (24h)</h2>
                        <p className="text-3xl font-bold">0</p>
                        <p className="text-gray-400">Placeholder for number of rush orders.</p>
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
} 