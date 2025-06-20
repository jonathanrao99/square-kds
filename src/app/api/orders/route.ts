import { NextResponse } from 'next/server';
import { SquareClient, SquareEnvironment } from 'square';

// Initialize the Square client
const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN!,
  environment: process.env.SANDBOX === 'true' ? SquareEnvironment.Sandbox : SquareEnvironment.Production,
});

export async function GET() {
  try {
    // Fetch locations to get location IDs for searching orders
    const locationsResponse = await client.locations.list();
    const locationIds = (locationsResponse.locations ?? [])
      .map((l) => l.id!)
      .filter((id): id is string => Boolean(id));
    // Search orders across locations
    const ordersResponse = await client.orders.search({ locationIds });
    // Convert BigInt values to strings for JSON serialization
    const safeOrders = JSON.parse(
      JSON.stringify(ordersResponse, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );
    // Ensure we always return an `orders` array for the frontend
    const orders = safeOrders.orders ?? safeOrders.result?.orders ?? [];
    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
} 