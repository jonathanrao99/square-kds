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
    const locationsResponse = await client.locations.list();
    console.log("Locations response received.");

    const locationIds = (locationsResponse.locations ?? [])
      .filter((l) => l.status === 'ACTIVE' && l.id)
      .map((l) => l.id!);
    console.log("Found ACTIVE Location IDs:", locationIds);
    
    if (locationIds.length === 0) {
        console.log("No location IDs found, returning empty orders array.");
        return NextResponse.json({ orders: [] });
    }

    // Search orders across locations
    const ordersResponse = await client.orders.search({ 
        locationIds,
        query: {
            filter: {
                stateFilter: {
                    states: ['OPEN'],
                }
            }
        }
    });

    // Convert BigInt values to strings for JSON serialization
    const safeOrdersResponse = JSON.parse(
      JSON.stringify(ordersResponse, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );
    console.log("Raw orders response from Square:", JSON.stringify(safeOrdersResponse, null, 2));

    // Ensure we always return an `orders` array for the frontend
    const orders = safeOrdersResponse.orders ?? safeOrdersResponse.result?.orders ?? [];
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