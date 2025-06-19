import { NextResponse } from 'next/server';
import { WebhooksHelper } from 'square';
import getRawBody from 'raw-body';
import { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextApiRequest, res: NextApiResponse) {
  const signature = req.headers['x-square-signature'] as string;
  const url = `https://<YOUR_VERCEL_URL>/api/webhooks/orders`; // Replace with your deployed URL
  const signatureKey = process.env.WEBHOOK_SECRET!;

  const rawBody = await getRawBody(req);
  const body = rawBody.toString();

  if (!WebhooksHelper.verifySignature({
    requestBody: body,
    signatureHeader: signature,
    signatureKey: signatureKey,
    notificationUrl: url,
  })) {
    return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 });
  }

  const data = JSON.parse(body);
  const eventType = data.type;
  const orderData = data.data.object.order;

  const io = (res.socket as any).server.io;
  
  if (eventType === 'order.created') {
    io.emit('order.created', orderData);
  } else if (eventType === 'order.updated') {
    io.emit('order.updated', orderData);
  }

  return NextResponse.json({ status: 'success' }, { status: 200 });
} 