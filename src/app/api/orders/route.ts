import { NextResponse } from 'next/server';
import { SquareClient, SquareEnvironment } from 'square';
import { Client as LegacyClient } from 'square/legacy';

// Environment variable validation
if (!process.env.SQUARE_ACCESS_TOKEN) {
    throw new Error("SQUARE_ACCESS_TOKEN is not set in the environment variables.");
}

// Initialize the Square client (new) for locations
const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN!,
  environment: process.env.SANDBOX === 'true' ? SquareEnvironment.Sandbox : SquareEnvironment.Production,
});

// Initialize the legacy client for orders
const legacyClient = new LegacyClient({
  bearerAuthCredentials: {
    accessToken: process.env.SQUARE_ACCESS_TOKEN!,
  },
});

export async function GET() {
  console.log("Fetching orders from Square API...");
  try {
    // Fetch locations to get location IDs for searching orders
    console.log("Fetching locations...");
    const locationsResponse = await client.locations.list();
    console.log("Locations response received.");
    const locations = locationsResponse.locations ?? [];
    const locationIds: string[] = [];
    for (const location of locations) {
      if (location.status === 'ACTIVE' && location.id) {
        locationIds.push(location.id);
      }
    }
    console.log("Found ACTIVE Location IDs:", locationIds);
    if (locationIds.length === 0) {
        console.log("No location IDs found, returning empty orders array.");
        return NextResponse.json({ orders: [] });
    }

    // Fetch OPEN orders
    const openOrdersResponse = await legacyClient.ordersApi.searchOrders({
      locationIds,
      query: {
        filter: {
          stateFilter: { states: ['OPEN'] },
        },
        sort: {
          sortField: 'CREATED_AT',
          sortOrder: 'DESC',
        },
      },
    });
    const safeOpenOrders = JSON.parse(
      JSON.stringify(openOrdersResponse.result, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );
    let openOrders = safeOpenOrders.orders ?? [];
    openOrders.forEach((order: any) => {
      order.isRush = order.ticketName?.toLowerCase().includes('rush');
      order.isPaid = false;
    });

    // Fetch COMPLETED orders (recently paid)
    const completedOrdersResponse = await legacyClient.ordersApi.searchOrders({
      locationIds,
      query: {
        filter: {
          stateFilter: { states: ['COMPLETED'] },
        },
        sort: {
          sortField: 'CREATED_AT',
          sortOrder: 'DESC',
        },
      },
    });
    const safeCompletedOrders = JSON.parse(
      JSON.stringify(completedOrdersResponse.result, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );
    let completedOrders = (safeCompletedOrders.orders ?? []).filter((order: any) => {
      if (!order.completedAt) return false;
      const completedAt = new Date(order.completedAt).getTime();
      const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
      return completedAt >= twoHoursAgo;
    });
    completedOrders.forEach((order: any) => {
      order.isRush = order.ticketName?.toLowerCase().includes('rush');
      order.isPaid = true;
    });

    // Merge open and recently paid orders
    const orders = [...openOrders, ...completedOrders];
    // Sort: rush first, then by createdAt desc
    orders.sort((a: any, b: any) => {
      if (a.isRush && !b.isRush) return -1;
      if (!a.isRush && b.isRush) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    console.log("Final orders being sent to frontend:", JSON.stringify(orders, null, 2));
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