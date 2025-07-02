import { NextResponse } from 'next/server';
import { SearchOrdersRequest } from 'square/legacy';
import { squareClient, legacySquareClient } from '@/lib/square';
import { SquareOrder, SquareLocation } from '@/types';

// Safe stringify for BigInt serialization
const safeStringify = (obj: any, ...args: any[]) =>
    JSON.stringify(obj, (_, value) => typeof value === 'bigint' ? value.toString() : value, ...args);

async function fetchOrders(locationIds: string[], states: string[]): Promise<SquareOrder[]> {
    const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString();
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
    const response = await legacySquareClient.ordersApi.searchOrders(query);
    console.log(`Raw response for states ${states.join(', ')}:`, safeStringify(response.result, null, 2));

    const safeOrders = JSON.parse(
        safeStringify(response.result)
    );

    let orders: SquareOrder[] = safeOrders.orders ?? [];
    console.log(`Orders after JSON.parse for states ${states.join(', ')}:`, safeStringify(orders, null, 2));

    if (states.includes('OPEN')) {
        const initialOpenCount = orders.length;
        orders = orders.filter((order: SquareOrder) => {
            if (!order.createdAt) return false;
            const createdAt = new Date(order.createdAt).getTime();
            return createdAt >= new Date(eightHoursAgo).getTime();
        });
        console.log(`OPEN orders after 8-hour filter (from ${initialOpenCount} to ${orders.length}):`, safeStringify(orders, null, 2));
    }

    if (states.includes('COMPLETED')) {
        orders.forEach((order: SquareOrder) => {
          console.log(
            `Order ${order.id}: state=${order.state}, closedAt=${order.closedAt}, tenders=${JSON.stringify(order.tenders)}`
          );
        });
      }

    return orders;
}

export async function GET(request: Request) {
  console.log("Fetching orders from Square API...");
  try {
    const { searchParams } = new URL(request.url);
    const locationIdFilter = searchParams.get('locationId');

    console.log("Fetching locations...");
    const locationsResponse = await squareClient.locations.list();
    console.log("Locations response received.");
    const locations: SquareLocation[] = locationsResponse.locations ?? [];
    let locationIds: string[] = locations
        .filter(location => location.status === 'ACTIVE' && location.id)
        .map(location => location.id!);

    if (locationIdFilter && locationIdFilter !== 'all') {
        locationIds = locationIds.filter(id => id === locationIdFilter);
    }

    console.log("Found ACTIVE Location IDs (after filter):", locationIds);
    if (locationIds.length === 0) {
        console.log("No location IDs found, returning empty orders array.");
        return NextResponse.json({ orders: [] });
    }

    // Fetch OPEN and COMPLETED orders
    const openOrders = await fetchOrders(locationIds, ['OPEN']);
    const completedOrders = await fetchOrders(locationIds, ['COMPLETED']);

    // Merge orders and remove potential duplicates
    const allOrdersMap = new Map<string, SquareOrder>();
    [...openOrders, ...completedOrders].forEach(order => {
        allOrdersMap.set(order.id!, order);
    });
    const orders: SquareOrder[] = Array.from(allOrdersMap.values());

    // Process all orders for additional properties
    orders.forEach((order: SquareOrder) => {
        (order as any).isRush = order.ticketName?.toLowerCase().includes('rush');
        console.log(`Processing order ${order.id}: State=${order.state}, Tenders=${JSON.stringify(order.tenders)}`);
        (order as any).isPaid = order.tenders && order.tenders.length > 0;
    });

    // Sort: rush first, then by createdAt desc
    orders.sort((a: any, b: any) => {
      if ((a as any).isRush && !(b as any).isRush) return -1;
      if (!(a as any).isRush && (b as any).isRush) return 1;
      return new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
    });

    console.log("Final orders being sent to frontend:", safeStringify(orders, null, 2));
    return NextResponse.json({ orders }, {
        headers: {
            'Cache-Control': 'no-store',
        }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders', details: error instanceof Error ? error.message : 'An unknown error occurred' }, { status: 500 });
  }
} 