import { prisma } from '@/lib/prisma';
import { decryptToken } from './crypto';

export async function dispatchMessage(queueId: number) {
  const queueItem = await prisma.whatsAppQueue.findUnique({
    where: { id: queueId },
    include: {
      organization: {
        include: {
          whatsappAccounts: {
            where: { status: 'ACTIVE' },
            take: 1
          }
        }
      }
    }
  });

  if (!queueItem) throw new Error('Queue item not found');

  if (queueItem.organizationId !== 1 && queueItem.organization.whatsappLimit <= 0) {
    await markQueueFailed(queueId, 'Insufficient Message Credits');
    return;
  }

  let account = queueItem.organization.whatsappAccounts[0];
  
  if (!account || !account.encryptedAccessToken || !account.phoneNumberId) {
    console.log(`[WhatsApp Queue ${queueId}] No active config for Org ${queueItem.organizationId}. Falling back to Super Admin (Org 1)...`);
    const superAdminOrg = await prisma.organization.findUnique({
      where: { id: 1 },
      include: {
        whatsappAccounts: {
          where: { status: 'ACTIVE' },
          take: 1
        }
      }
    });
    
    if (superAdminOrg?.whatsappAccounts?.[0]) {
       account = superAdminOrg.whatsappAccounts[0];
    }
  }

  if (!account || !account.encryptedAccessToken || !account.phoneNumberId) {
    await markQueueFailed(queueId, 'No active WhatsApp account or missing credentials');
    return;
  }

  const accessToken = decryptToken(account.encryptedAccessToken);
  if (!accessToken) {
    await markQueueFailed(queueId, 'Failed to decrypt access token');
    return;
  }

  // Update status to processing
  await prisma.whatsAppQueue.update({
    where: { id: queueId },
    data: { status: 'PROCESSING', processingStartedAt: new Date() }
  });

  let success = false;
  let metaResponse: any = null;
  let metaErrorCode: string | null = null;
  let metaErrorMessage: string | null = null;

  try {
    // Attempt Primary Transport
    metaResponse = await sendMetaRequest(
      account.phoneNumberId, 
      accessToken, 
      buildPayload(queueItem, queueItem.transport)
    );
    success = true;
  } catch (error: any) {
    metaResponse = error.response || error.message;
    metaErrorCode = error.code?.toString() || null;
    metaErrorMessage = error.message || null;

    // Check for Outside 24-Hour Window (Error 131047)
    if (metaErrorCode === '131047' && account.templateName) {
      console.log(`[WhatsApp Queue ${queueId}] Outside 24-hour window, falling back to template`);
      try {
        metaResponse = await sendMetaRequest(
          account.phoneNumberId,
          accessToken,
          buildPayload(queueItem, 'TEMPLATE', account.templateName)
        );
        success = true;
        metaErrorCode = null;
        metaErrorMessage = null;
      } catch (fallbackError: any) {
        metaResponse = fallbackError.response || fallbackError.message;
        metaErrorCode = fallbackError.code?.toString() || null;
        metaErrorMessage = fallbackError.message || null;
      }
    }
    
    // Check for Invalid Token error to auto-disable
    if (metaErrorCode === '190' || metaErrorMessage?.includes('Invalid OAuth access token')) {
       await incrementFailureAndCheckAutoDisable(account.id);
    }
  }

  // Update Log and Queue
  await prisma.whatsAppLog.create({
    data: {
      organizationId: queueItem.organizationId,
      patientId: queueItem.patientId,
      billId: queueItem.billId,
      phone: queueItem.phone,
      category: queueItem.category,
      transport: success ? (metaErrorCode ? 'TEMPLATE' : queueItem.transport) : queueItem.transport,
      status: success ? 'SENT' : 'FAILED',
      pdfUrl: queueItem.pdfUrl,
      templateName: queueItem.templateName || account.templateName,
      caption: queueItem.caption,
      metaMessageId: success ? metaResponse?.messages?.[0]?.id : null,
      metaErrorCode,
      metaErrorMessage,
      metaResponse: metaResponse ? JSON.parse(JSON.stringify(metaResponse)) : null,
    }
  });

  if (success) {
    await prisma.whatsAppQueue.update({
      where: { id: queueId },
      data: { status: 'COMPLETED', completedAt: new Date() }
    });
    
    if (queueItem.organizationId !== 1) {
      await prisma.organization.update({
        where: { id: queueItem.organizationId },
        data: { whatsappLimit: { decrement: 1 } }
      });
    }
  } else {
    const nextRetry = queueItem.retryCount + 1;
    if (nextRetry < 3) {
      await prisma.whatsAppQueue.update({
        where: { id: queueId },
        data: { 
          status: 'PENDING', 
          retryCount: nextRetry, 
          lastError: metaErrorMessage,
          // Exponential backoff (e.g., 5 mins, 15 mins)
          scheduledAt: new Date(Date.now() + Math.pow(3, nextRetry) * 60000) 
        }
      });
    } else {
      await markQueueFailed(queueId, metaErrorMessage || 'Max retries exceeded');
    }
  }
}

async function markQueueFailed(queueId: number, errorMsg: string) {
  await prisma.whatsAppQueue.update({
    where: { id: queueId },
    data: { status: 'FAILED', completedAt: new Date(), lastError: errorMsg }
  });
}

async function sendMetaRequest(phoneNumberId: string, accessToken: string, payload: any) {
  const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.error?.message || 'Meta API Error');
    (error as any).code = data.error?.code;
    (error as any).response = data;
    throw error;
  }
  return data;
}

function buildPayload(queueItem: any, transport: string, templateName?: string) {
  const base = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: queueItem.phone,
  };

  if (transport === 'DOCUMENT') {
    return {
      ...base,
      type: 'document',
      document: {
        link: queueItem.pdfUrl,
        filename: `${queueItem.category}.pdf`,
        caption: queueItem.caption || ''
      }
    };
  } else if (transport === 'TEMPLATE') {
    return {
      ...base,
      type: 'template',
      template: {
        name: templateName || queueItem.templateName,
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [
               // Ideally these come from parsed parameters, but we'll put placeholders or URL for now
               { type: 'text', text: queueItem.pdfUrl || 'Document Link' }
            ]
          }
        ]
      }
    };
  }
  // Fallback text
  return {
    ...base,
    type: 'text',
    text: { body: queueItem.caption || 'Message' }
  };
}

async function incrementFailureAndCheckAutoDisable(accountId: number) {
  const account = await prisma.whatsAppAccount.update({
    where: { id: accountId },
    data: { failureCount: { increment: 1 } }
  });

  if (account.failureCount >= 10 && account.status !== 'DISABLED') {
    await prisma.whatsAppAccount.update({
      where: { id: accountId },
      data: { status: 'DISABLED' }
    });
    console.error(`WhatsApp Account ${accountId} AUTO-DISABLED due to 10 consecutive failures.`);
    // Add audit log or admin alert here in the future
  }
}
