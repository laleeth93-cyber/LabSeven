import { NextResponse } from 'next/server';
import { dispatchMessage } from '@/lib/whatsapp/dispatcher';

export async function POST(request: Request) {
  try {
    // In a real environment, you would verify the QStash or Webhook signature here
    // e.g. const signature = request.headers.get('upstash-signature');
    // if (!isValidSignature(signature, body)) return 401;

    const body = await request.json();
    const { queueId } = body;

    if (!queueId) {
      return NextResponse.json({ error: 'Missing queueId' }, { status: 400 });
    }

    // Await the dispatcher (This can run immediately since it is a reliable background worker triggered by an external queue)
    await dispatchMessage(queueId);

    return NextResponse.json({ success: true, message: 'Message dispatched successfully' });
  } catch (error: any) {
    console.error('Queue Worker Error:', error);
    // Returning 500 will tell QStash (or external queue) to retry this webhook
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
