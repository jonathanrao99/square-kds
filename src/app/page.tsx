"use client";

import useSWR, { useSWRConfig } from 'swr';
import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface Money {
  amount: string;
  currency: string;
}
interface LineItem {
  uid: string;
  quantity: string;
  name?: string;
  note?: string;
  basePriceMoney: Money;
  variationTotalPriceMoney: Money;
}
interface Order {
  id: string;
  createdAt: string;
  state: string;
  lineItems: LineItem[];
  totalMoney: Money;
  note?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
  const { data, error } = useSWR('/api/orders', fetcher);
  const { mutate } = useSWRConfig();

  useEffect(() => {
    const socket: Socket = io({
      path: '/api/socket',
    });

    socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
    });

    socket.on('order.created', (newOrder) => {
      console.log('New order received:', newOrder);
      mutate('/api/orders');
    });

    socket.on('order.updated', (updatedOrder) => {
      console.log('Order updated:', updatedOrder);
      mutate('/api/orders');
    });

    return () => {
      socket.disconnect();
    };
  }, [mutate]);

  if (error) return <div className="p-8 text-red-600">Failed to load orders</div>;
  if (!data) return <div className="p-8">Loading orders...</div>;

  const orders: Order[] = data.orders;
  const openOrders = orders.filter((o) => o.state === 'OPEN');
  const completedOrders = orders.filter((o) => o.state !== 'OPEN');

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Desi Flavors Katy KDS</h1>
      {/* Open tickets section */}
      <h2 className="text-2xl font-semibold mb-4">Open Tickets</h2>
      {openOrders.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
          {openOrders.map((order) => (
            <div key={order.id} className="bg-gray-800 border border-gray-700 shadow-lg rounded p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-100">Order #{order.id.slice(-6)}</span>
                <span className="text-sm text-gray-400">{new Date(order.createdAt).toLocaleTimeString()}</span>
              </div>
              <div className="mb-2">
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-600 text-white">
                  {order.state}
                </span>
                {order.note && (
                  <div className="text-sm text-gray-400 italic mb-2">
                    {order.note}
                  </div>
                )}
              </div>
              <ul className="mb-4 space-y-2">
                {order.lineItems.map((item) => (
                  <li key={item.uid} className="mb-2">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-100">{item.name ?? 'Item'}</span>
                      <span className="text-gray-400">
                        {item.quantity} x {(Number(item.variationTotalPriceMoney.amount) / 100).toFixed(2)} {item.variationTotalPriceMoney.currency}
                      </span>
                    </div>
                    {item.note && (
                      <div className="text-xs text-gray-500 italic">
                        {item.note}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              <div className="border-t border-gray-700 pt-2 text-right font-semibold text-gray-100">
                Total: {(Number(order.totalMoney.amount) / 100).toFixed(2)} {order.totalMoney.currency}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-400 mb-8">No open tickets.</div>
      )}

      {/* Completed orders section */}
      <h2 className="text-2xl font-semibold mb-4">Completed Orders</h2>
      {completedOrders.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {completedOrders.map((order) => (
            <div key={order.id} className="bg-gray-800 border border-gray-700 shadow-lg rounded p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-100">Order #{order.id.slice(-6)}</span>
                <span className="text-sm text-gray-400">{new Date(order.createdAt).toLocaleTimeString()}</span>
              </div>
              <div className="mb-2">
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-600 text-white">
                  {order.state}
                </span>
                {order.note && (
                  <div className="text-sm text-gray-400 italic mb-2">
                    {order.note}
                  </div>
                )}
              </div>
              <ul className="mb-4 space-y-2">
                {order.lineItems.map((item) => (
                  <li key={item.uid} className="mb-2">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-100">{item.name ?? 'Item'}</span>
                      <span className="text-gray-400">
                        {item.quantity} x {(Number(item.variationTotalPriceMoney.amount) / 100).toFixed(2)} {item.variationTotalPriceMoney.currency}
                      </span>
                    </div>
                    {item.note && (
                      <div className="text-xs text-gray-500 italic">
                        {item.note}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              <div className="border-t border-gray-700 pt-2 text-right font-semibold text-gray-100">
                Total: {(Number(order.totalMoney.amount) / 100).toFixed(2)} {order.totalMoney.currency}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-400">No completed orders.</div>
      )}
    </div>
  );
}
