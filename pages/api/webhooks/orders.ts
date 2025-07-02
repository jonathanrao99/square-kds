import { WebhooksHelper } from 'square';
import getRawBody from 'raw-body';
import { NextApiRequest } from 'next';
import { NextApiResponseServerIo } from '@/types/index';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponseServerIo) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  let rawBody: Buffer;
  let body: string;
  
  try {
    rawBody = await getRawBody(req);
    body = rawBody.toString();
  } catch (error) {
    console.error('Error reading webhook body:', error);
    return res.status(400).json({ error: 'Invalid request body' });
  }

  // Log all webhook events for debugging
  console.log('Webhook received:', {
    headers: req.headers,
    body: body.substring(0, 500) + (body.length > 500 ? '...' : ''),
  });

  const signature = req.headers['x-square-signature'] as string;
  const url = `https://${process.env.VERCEL_URL}/api/webhooks/orders`;
  const signatureKey = process.env.WEBHOOK_SECRET;

  if (!signatureKey) {
    console.error('WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  try {
    const isValid = WebhooksHelper.verifySignature({
        requestBody: body,
        signatureHeader: signature,
        signatureKey: signatureKey,
        notificationUrl: url,
    });
    if (!isValid) {
        console.error('Webhook signature verification failed');
        return res.status(401).json({ error: 'Signature verification failed' });
    }
  } catch (error) {
    console.error('Webhook verification error:', error);
    return res.status(500).json({ error: 'Internal server error during signature verification' });
  }

  let data;
  try {
    data = JSON.parse(body);
  } catch (error) {
    console.error('Error parsing webhook JSON:', error);
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const eventType = data.type;
  console.log(`Processing webhook event: ${eventType}`, data);

  // Try to emit to Socket.IO, but don't fail if it's not available
  try {
    const io = res.socket.server.io;
    if (io) {
      if (eventType === 'order.created') {
        io.emit('order.created', data.data.object.order_created || data.data.object);
        console.log('Emitted order.created event to Socket.IO');
      } else if (eventType === 'order.updated') {
        io.emit('order.updated', data.data.object.order_updated || data.data.object);
        console.log('Emitted order.updated event to Socket.IO');
      }
    } else {
      console.warn('Socket.IO not available, skipping event emission');
    }
  } catch (error) {
    console.error('Error emitting to Socket.IO:', error);
    // Don't fail the webhook - continue and return 200 to Square
  }

  // Always return 200 to Square to acknowledge receipt
  res.status(200).json({ status: 'success', eventType });
} 