import { NextResponse } from 'next/server';
import { SquareClient, SquareEnvironment } from 'square';
import { Client as LegacyClient } from 'square/legacy';
import { Order } from '@/types';

// Environment variable validation
if (!process.env.SQUARE_ACCESS_TOKEN) {
    throw new Error("SQUARE_ACCESS_TOKEN is not set in the environment variables.");
}

// Initialize the Square client (new SDK)
const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN!,
  environment: process.env.SANDBOX === 'true' ? SquareEnvironment.Sandbox : SquareEnvironment.Production,
});

// Initialize the legacy client for Orders API
const legacyClient = new LegacyClient({
  bearerAuthCredentials: {
    accessToken: process.env.SQUARE_ACCESS_TOKEN!,
  },
});
const ordersApi = legacyClient.ordersApi;

function getDateRange(range: string) {
  const now = new Date();
  let start: Date;
  if (range === 'day') {
    start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  } else if (range === 'week') {
    start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (range === 'month') {
    start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else {
    return undefined;
  }
  return { startAt: start.toISOString(), endAt: now.toISOString() };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get('status') || 'OPEN';
  const range = searchParams.get('range') || '';

  // Support multiple states (e.g., OPEN,PAID,COMPLETED)
  const states = statusParam.split(',').map(s => s.trim().toUpperCase());
  const dateRange = getDateRange(range);

  try {
    // Fetch all active location IDs using the new SDK
    const locationsResponse = await client.locations.list();
    const locationIds = (locationsResponse.locations ?? [])
      .filter(l => l.status === 'ACTIVE' && l.id)
      .map(l => l.id!);
    if (locationIds.length === 0) {
      return NextResponse.json({ orders: [] });
    }
    console.log('Using location IDs:', locationIds);

    let orders: Order[] = [];

    if (states.length === 1 && states[0] === 'OPEN') {
      // Fetch OPEN orders from all locations
      const openOrdersResponse = await ordersApi.searchOrders({
        locationIds,
        query: { filter: { stateFilter: { states: ['OPEN'] } } },
      });
      const safeOpenOrdersResponse = JSON.parse(
        JSON.stringify(openOrdersResponse, (_, value) =>
          typeof value === 'bigint' ? value.toString() : value
        )
      );
      console.log('Raw OPEN orders response:', JSON.stringify(safeOpenOrdersResponse, null, 2));
      const openOrders = safeOpenOrdersResponse.orders ?? [];

      // Fetch recently paid (COMPLETED in last 24h) orders from all locations
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const completedOrdersResponse = await ordersApi.searchOrders({
        locationIds,
        query: {
          filter: {
            stateFilter: { states: ['COMPLETED'] },
            dateTimeFilter: { closedAt: { startAt: yesterday.toISOString(), endAt: now.toISOString() } },
          },
        },
      });
      const safeCompletedOrdersResponse = JSON.parse(
        JSON.stringify(completedOrdersResponse, (_, value) =>
          typeof value === 'bigint' ? value.toString() : value
        )
      );
      console.log('Raw RECENT PAID orders response:', JSON.stringify(safeCompletedOrdersResponse, null, 2));
      const recentPaidOrders = safeCompletedOrdersResponse.orders ?? [];

      orders = [...openOrders, ...recentPaidOrders];
    } else if (states.length === 1 && states[0] === 'COMPLETED') {
      // Only show completed orders older than 24 hours from all locations
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const completedOrdersResponse = await ordersApi.searchOrders({
        locationIds,
        query: {
          filter: {
            stateFilter: { states: ['COMPLETED'] },
            dateTimeFilter: { closedAt: { endAt: yesterday.toISOString() } },
          },
        },
      });
      orders = JSON.parse(
        JSON.stringify(completedOrdersResponse, (_, value) =>
          typeof value === 'bigint' ? value.toString() : value
        )
      ).orders ?? [];
    } else {
      // Fallback: use the original filter logic for other cases, but all locations
      const filter: { stateFilter: { states: string[] }, dateTimeFilter?: { closedAt?: { startAt?: string, endAt?: string }, createdAt?: { startAt?: string, endAt?: string } } } = { stateFilter: { states } };
      if (dateRange) {
        if (states.includes('COMPLETED')) {
          filter.dateTimeFilter = { closedAt: dateRange };
        } else {
          filter.dateTimeFilter = { createdAt: dateRange };
        }
      }
      const ordersResponse = await ordersApi.searchOrders({
        locationIds,
        query: { filter },
      });
      orders = JSON.parse(
        JSON.stringify(ordersResponse, (_, value) =>
          typeof value === 'bigint' ? value.toString() : value
        )
      ).orders ?? [];
    }

    // Manually add isRush flag and sort
    (orders as Order[]).forEach((order: Order) => {
      order.isRush = order.ticketName?.toLowerCase().includes('rush');
    });
    (orders as Order[]).sort((a: Order, b: Order) => {
      if (a.isRush && !b.isRush) return -1;
      if (!a.isRush && b.isRush) return 1;
      return 0;
    });

    return NextResponse.json({ orders }, {
      headers: {
        'Cache-Control': 'no-store',
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
} 