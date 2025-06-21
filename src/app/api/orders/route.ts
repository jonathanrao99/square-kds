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

export async function GET() {
  console.log("Fetching orders from Square API...");
  try {
    // Fetch locations to get location IDs for searching orders
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const locationsResponse: any = await (client.locations as any).listLocations();
    console.log("Locations response received.");

    const locationIds = (locationsResponse.result.locations ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((l: any) => l.status === 'ACTIVE' && l.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((l: any) => l.id!);
    console.log("Found ACTIVE Location IDs:", locationIds);
    
    if (locationIds.length === 0) {
        console.log("No location IDs found, returning empty orders array.");
        return NextResponse.json({ orders: [] });
    }

    // Search orders across locations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ordersResponse: any = await (client.orders as any).searchOrders({ 
      body: {
        locationIds,
        query: {
            filter: {
                stateFilter: {
                    states: ['OPEN'],
                }
            },
            sort: {
                sortField: 'CREATED_AT',
                sortOrder: 'DESC'
            }
        }
      }
    });

    // Convert BigInt and identify rush orders
    const safeOrdersResponse = JSON.parse(
      JSON.stringify(ordersResponse.result, (_, value) =>
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