import { NextResponse } from 'next/server';
import { SquareClient, SquareEnvironment } from 'square';

// Environment variable validation
if (!process.env.SQUARE_ACCESS_TOKEN) {
    throw new Error("SQUARE_ACCESS_TOKEN is not set in the environment variables.");
}

// Initialize the Square client
const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN!,
  environment: process.env.SANDBOX === 'true' ? SquareEnvironment.Sandbox : SquareEnvironment.Production,
});

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
    // Fetch locations to get location IDs for searching orders
    const locationsResponse = await client.locations.list();
    const locationIds = (locationsResponse.locations ?? [])
      .filter(l => l.status === 'ACTIVE' && l.id)
      .map(l => l.id!);
    if (locationIds.length === 0) {
        return NextResponse.json({ orders: [] });
    }

    // Build filter
    const filter: any = { stateFilter: { states } };
    if (dateRange) {
      // For completed orders, filter by closedAt; otherwise, by createdAt
      if (states.includes('COMPLETED')) {
        filter.dateTimeFilter = { closedAt: dateRange };
      } else {
        filter.dateTimeFilter = { createdAt: dateRange };
      }
    }

    // Search orders
    const ordersResponse = await ordersApi.searchOrders({
            locationIds: [locationId],
            query: {
                filter: {
                    stateFilter: {
                        states: ['OPEN', 'COMPLETED']
                    },
                    // Fetch orders from the last 24 hours
                    dateTimeFilter: {

    // Convert BigInt values to strings for JSON serialization
    const safeOrdersResponse = JSON.parse(
      JSON.stringify(ordersResponse, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );
    const orders = safeOrdersResponse.orders ?? [];

    // Manually add isRush flag and sort
    (orders as any[]).forEach((order: any) => {
        order.isRush = order.ticketName?.toLowerCase().includes('rush');
    });
    (orders as any[]).sort((a: any, b: any) => {
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