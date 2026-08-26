import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

export async function POST(request: Request) {
  try {
    const { orgId } = await requireAuth();
    const body = await request.json();
    const { logId } = body;

    if (!logId) {
      return NextResponse.json({ error: 'Missing logId' }, { status: 400 });
    }

    const log = await prisma.whatsAppLog.findFirst({
      where: { id: logId, organizationId: orgId }
    });

    if (!log) {
      return NextResponse.json({ error: 'Log entry not found' }, { status: 404 });
    }

    const organization: any = await (prisma.organization as any).findUnique({
        where: { id: orgId },
        select: { whatsappLimit: true }
    });

    if (orgId !== 1 && (!organization || organization.whatsappLimit <= 0)) {
        return NextResponse.json({ error: "Insufficient WhatsApp Message Credits. Please contact Master HQ." }, { status: 403 });
    }

    // Resend by creating a new queue item based on the old log
    const queueItem = await prisma.whatsAppQueue.create({
      data: {
        organizationId: orgId,
        patientId: log.patientId,
        billId: log.billId,
        phone: log.phone,
        category: log.category,
        transport: log.transport,
        pdfUrl: log.pdfUrl,
        templateName: log.templateName,
        caption: log.caption,
        status: 'PENDING',
        priority: 5, // Extremely high priority for manual resends
      }
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    fetch(`${baseUrl}/api/whatsapp/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queueId: queueItem.id })
    }).catch(e => console.error("Failed to trigger queue asynchronously:", e));

    return NextResponse.json({ success: true, message: 'Message queued for resend', queueId: queueItem.id });
  } catch (err: any) {
    console.error('Resend Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
