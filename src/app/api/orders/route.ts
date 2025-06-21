import { NextResponse, NextRequest } from 'next/server';
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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status') || 'open';
  const timeFilter = searchParams.get('timeFilter');

  console.log(`Fetching ${status.toUpperCase()} orders from Square API...`);
  
  try {
    // Fetch locations to get location IDs for searching orders
    // Retrieve all locations
    const locationsResponse = await client.locations.list();
    console.log("Locations response received.");

    // Extract active location IDs
    const locationIds = (locationsResponse.locations ?? [])
      .filter(l => l.status === 'ACTIVE' && l.id)
      .map(l => l.id!);
    console.log("Found ACTIVE Location IDs:", locationIds);
    
    if (locationIds.length === 0) {
        console.log("No location IDs found, returning empty orders array.");
        return NextResponse.json({ orders: [] });
    }

    const query: any = {
      locationIds,
      query: {
        filter: {
          stateFilter: {
            states: [status.toUpperCase()],
          }
        },
        sort: {
          sortField: 'CREATED_AT',
          sortOrder: 'DESC'
        }
      }
    };

    if (status === 'completed' && timeFilter) {
      const now = new Date();
      let startAt: Date;

      if (timeFilter === 'day') {
        startAt = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      } else if (timeFilter === 'week') {
        startAt = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      } else { // month
        startAt = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      }
      
      query.query.filter.dateTimeFilter = {
        createdAt: {
          startAt: startAt.toISOString(),
        }
      };
      query.query.sort.sortField = 'CLOSED_AT';
    }

    // Search orders across locations
    const ordersResponse = await client.orders.search(query);

    // Convert BigInt values to strings for JSON serialization
    const safeOrdersResponse = JSON.parse(
      JSON.stringify(ordersResponse, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );
    
    const orders = safeOrdersResponse.orders ?? [];

    // Manually add isRush flag and sort
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    orders.forEach((order: any) => {
        order.isRush = order.ticketName?.toLowerCase().includes('rush');
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    orders.sort((a: any, b: any) => {
        if (a.isRush && !b.isRush) return -1;
        if (!a.isRush && b.isRush) return 1;
        return 0;
    });

    console.log("Raw orders response from Square:", JSON.stringify(safeOrdersResponse, null, 2));

    // Ensure we always return an `orders` array for the frontend
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