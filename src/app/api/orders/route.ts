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

// Helper to fetch all pages of orders
async function fetchAllOrders(params: Record<string, unknown>, ordersApi: { searchOrders: (args: Record<string, unknown>) => Promise<unknown> }): Promise<Order[]> {
  let allOrders: Order[] = [];
  let cursor: string | undefined = undefined;
  do {
    const response = await ordersApi.searchOrders({ ...params, cursor });
    const safeResponse = JSON.parse(
      JSON.stringify(response, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );
    const orders: Order[] = safeResponse.orders ?? [];
    allOrders = allOrders.concat(orders);
    cursor = safeResponse.cursor;
  } while (cursor);
  return allOrders;
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
      // Fetch all DRAFT orders from all locations (with pagination)
      const draftOrders = await fetchAllOrders({
        locationIds,
        query: { filter: { stateFilter: { states: ['DRAFT'] } } },
        limit: 200,
      }, ordersApi);
      draftOrders.forEach(order => {
        console.log(`[DRAFT] Order ID: ${order.id}, Ticket: ${order.ticketName}, State: ${order.state}`);
      });

      // Fetch all OPEN orders from all locations (with pagination)
      const openOrders = await fetchAllOrders({
        locationIds,
        query: { filter: { stateFilter: { states: ['OPEN'] } } },
        limit: 200,
      }, ordersApi);
      openOrders.forEach(order => {
        console.log(`[OPEN] Order ID: ${order.id}, Ticket: ${order.ticketName}, State: ${order.state}`);
      });

      // Fetch all recently paid (COMPLETED in last 24h) orders from all locations (with pagination)
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const recentPaidOrders = await fetchAllOrders({
        locationIds,
        query: {
          filter: {
            stateFilter: { states: ['COMPLETED'] },
            dateTimeFilter: { closedAt: { startAt: yesterday.toISOString(), endAt: now.toISOString() } },
          },
        },
        limit: 200,
      }, ordersApi);
      recentPaidOrders.forEach(order => {
        console.log(`[RECENT PAID] Order ID: ${order.id}, Ticket: ${order.ticketName}, State: ${order.state}`);
      });

      // For debugging: fetch all orders (no state filter)
      const allOrders = await fetchAllOrders({
        locationIds,
        limit: 200,
      }, ordersApi);
      allOrders.forEach(order => {
        console.log(`[ALL] Order ID: ${order.id}, Ticket: ${order.ticketName}, State: ${order.state}`);
      });

      // Debug: Search for specific order ID from webhook
      const webhookOrderId = 'hz79qON3ctXLm6YOVhmp0vdD7uDZY';
      const webhookOrder = allOrders.find(order => order.id === webhookOrderId);
      if (webhookOrder) {
        console.log(`[DEBUG] Found webhook order:`, JSON.stringify(webhookOrder, null, 2));
      } else {
        console.log(`[DEBUG] Webhook order ${webhookOrderId} NOT FOUND in API response`);
      }

      orders = [...draftOrders, ...openOrders, ...recentPaidOrders];
    } else if (states.length === 1 && states[0] === 'COMPLETED') {
      // Only show completed orders older than 24 hours from all locations (with pagination)
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      orders = await fetchAllOrders({
        locationIds,
        query: {
          filter: {
            stateFilter: { states: ['COMPLETED'] },
            dateTimeFilter: { closedAt: { endAt: yesterday.toISOString() } },
          },
        },
        limit: 200,
      }, ordersApi);
      orders.forEach(order => {
        console.log(`[COMPLETED] Order ID: ${order.id}, Ticket: ${order.ticketName}, State: ${order.state}`);
      });
    } else {
      // Fallback: use the original filter logic for other cases, but all locations (with pagination)
      const filter: { stateFilter: { states: string[] }, dateTimeFilter?: { closedAt?: { startAt?: string, endAt?: string }, createdAt?: { startAt?: string, endAt?: string } } } = { stateFilter: { states } };
      if (dateRange) {
        if (states.includes('COMPLETED')) {
          filter.dateTimeFilter = { closedAt: dateRange };
        } else {
          filter.dateTimeFilter = { createdAt: dateRange };
        }
      }
      orders = await fetchAllOrders({
        locationIds,
        query: { filter },
        limit: 200,
      }, ordersApi);
      orders.forEach(order => {
        console.log(`[GENERIC] Order ID: ${order.id}, Ticket: ${order.ticketName}, State: ${order.state}`);
      });
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