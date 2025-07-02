import { NextResponse } from 'next/server';
import { legacySquareClient } from '@/lib/square';

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();

    if (typeof orderId !== 'string' || orderId.trim() === '') {
      return NextResponse.json({ error: 'Invalid Order ID provided' }, { status: 400 });
    }

    console.log(`Attempting to complete order: ${orderId}`);

    // Fetch the order first to get its current version
    const retrieveResponse = await legacySquareClient.ordersApi.retrieveOrder(orderId);
    const order = retrieveResponse.result.order;

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Update the order state to COMPLETED
    const updateResponse = await legacySquareClient.ordersApi.updateOrder(
      orderId,
      {
        order: {
          locationId: order.locationId,
          version: order.version,
          state: 'COMPLETED',
        },
        idempotencyKey: `${orderId}-${Date.now()}-complete`,
      }
    );

    console.log(`Order ${orderId} completed successfully:`, updateResponse.result);
    return NextResponse.json({ message: 'Order completed successfully', order: updateResponse.result.order });
  } catch (error) {
    console.error('Error completing order:', error);
    return NextResponse.json({ error: 'Failed to complete order', details: error instanceof Error ? error.message : 'An unknown error occurred' }, { status: 500 });
  }
}