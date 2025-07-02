import { NextResponse } from 'next/server';
import { SquareClient, SquareEnvironment } from 'square';
import { Client as LegacyClient, Order as SquareOrder, SearchOrdersRequest } from 'square/legacy';

// Safe stringify for BigInt serialization
const safeStringify = (obj: any, ...args: any[]) =>
    JSON.stringify(obj, (_, value) => typeof value === 'bigint' ? value.toString() : value, ...args);

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

async function fetchOrders(locationIds: string[], states: string[]): Promise<any[]> {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).getTime();
    const query: SearchOrdersRequest = {
        locationIds,
        query: {
            filter: {
                stateFilter: { states },
            },
            sort: {
                sortField: 'CREATED_AT',
                sortOrder: 'DESC',
            },
        },
    };

    console.log(`Searching for orders with states: ${states.join(', ')} and query:`, safeStringify(query, null, 2));
    const response = await legacyClient.ordersApi.searchOrders(query);
    console.log(`Raw response for states ${states.join(', ')}:`, safeStringify(response.result, null, 2));

    const safeOrders = JSON.parse(
        safeStringify(response.result)
    );

    let orders = safeOrders.orders ?? [];
    console.log(`Orders after JSON.parse for states ${states.join(', ')}:`, safeStringify(orders, null, 2));

    if (states.includes('OPEN')) {
        const initialOpenCount = orders.length;
        orders = orders.filter((order: any) => {
            if (!order.createdAt) return false;
            const createdAt = new Date(order.createdAt).getTime();
            return createdAt >= twoHoursAgo;
        });
        console.log(`OPEN orders after 2-hour filter (from ${initialOpenCount} to ${orders.length}):`, safeStringify(orders, null, 2));
    }

    if (states.includes('COMPLETED')) {
        orders.forEach((order: any) => {
          console.log(
            `Order ${order.id}: state=${order.state}, completedAt=${order.completedAt}, tenders=${JSON.stringify(order.tenders)}`
          );
        });
      }

    return orders;
}

export async function GET() {
  console.log("Fetching orders from Square API...");
  try {
    // Fetch locations to get location IDs for searching orders
    console.log("Fetching locations...");
    const locationsResponse = await client.locations.list();
    console.log("Locations response received.");
    const locations = locationsResponse.locations ?? [];
    const locationIds: string[] = locations
        .filter(location => location.status === 'ACTIVE' && location.id)
        .map(location => location.id!);

    console.log("Found ACTIVE Location IDs:", locationIds);
    if (locationIds.length === 0) {
        console.log("No location IDs found, returning empty orders array.");
        return NextResponse.json({ orders: [] });
    }

    // Fetch OPEN and COMPLETED orders
    const openOrders = await fetchOrders(locationIds, ['OPEN']);
    const completedOrders = await fetchOrders(locationIds, ['COMPLETED']);

    // Merge orders and remove potential duplicates
    const allOrdersMap = new Map();
    [...openOrders, ...completedOrders].forEach(order => {
        allOrdersMap.set(order.id, order);
    });
    const orders = Array.from(allOrdersMap.values());

    // Process all orders for additional properties
    orders.forEach((order: any) => {
        order.isRush = order.ticketName?.toLowerCase().includes('rush');
        console.log(`Processing order ${order.id}: State=${order.state}, Tenders=${JSON.stringify(order.tenders)}`);
        order.isPaid = order.tenders && order.tenders.length > 0;
    });

    // Sort: rush first, then by createdAt desc
    orders.sort((a: any, b: any) => {
      if (a.isRush && !b.isRush) return -1;
      if (!a.isRush && b.isRush) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    console.log("Final orders being sent to frontend:", safeStringify(orders, null, 2));
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