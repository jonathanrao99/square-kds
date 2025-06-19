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

  const signature = req.headers['x-square-signature'] as string;
  const url = `https://kds-app-tau.vercel.app/api/webhooks/orders`; // Replace with your deployed URL
  const signatureKey = process.env.WEBHOOK_SECRET!;

  const rawBody = await getRawBody(req);
  const body = rawBody.toString();

  try {
    const isValid = WebhooksHelper.verifySignature({
        requestBody: body,
        signatureHeader: signature,
        signatureKey: signatureKey,
        notificationUrl: url,
    });
    if (!isValid) {
        return res.status(401).json({ error: 'Signature verification failed' });
    }
  } catch (error) {
    console.error('Webhook verification error:', error);
    return res.status(500).json({ error: 'Internal server error during signature verification' });
  }

  const data = JSON.parse(body);
  const eventType = data.type;

  const io = res.socket.server.io;
  
  if (eventType === 'order.created') {
    io.emit('order.created', data.data.object.order);
  } else if (eventType === 'order.updated') {
    io.emit('order.updated', data.data.object.order);
  }

  res.status(200).json({ status: 'success' });
} 