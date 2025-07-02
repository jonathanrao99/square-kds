import { NextResponse } from 'next/server';
import { getIo } from '@/lib/socket-server';

// You will need to set this environment variable in your .env.local file
const SQUARE_WEBHOOK_SECRET = process.env.SQUARE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  if (!SQUARE_WEBHOOK_SECRET) {
    console.error('SQUARE_WEBHOOK_SECRET is not set.');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('x-square-signature');

  if (!signature) {
    console.warn('Webhook received without signature.');
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }

  // TODO: Implement actual Square webhook signature verification here.
  // This is a placeholder. You'll need to use Square's SDK or a crypto library
  // to verify the signature against the rawBody and SQUARE_WEBHOOK_SECRET.
  // For example, using Square's Node.js SDK:
  // const isValid = await new WebhookHelper(SQUARE_WEBHOOK_SECRET).verify(rawBody, signature);
  // if (!isValid) {
  //   console.warn('Invalid webhook signature.');
  //   return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
  // }

  try {
    const body = JSON.parse(rawBody);
    console.log('Webhook received:', body);

    const io = getIo();

    // Example: Emit events based on webhook type
    if (body.type === 'order.created') {
      io.emit('order.created', body.data.object.order);
      console.log('Emitted order.created event for order:', body.data.object.order.id);
    } else if (body.type === 'order.updated') {
      io.emit('order.updated', body.data.object.order);
      console.log('Emitted order.updated event for order:', body.data.object.order.id);
    }

    return NextResponse.json({ message: 'Webhook processed' }, { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}