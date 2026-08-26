import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

export async function POST(request: Request) {
  try {
    let orgId = 1;
    try {
      const auth = await requireAuth();
      orgId = auth.orgId;
    } catch (e) {
      // Proceed with orgId = 1 as fallback if not authenticated
    }

    const body = await request.json();
    let { 
      adminPhone, 
      adminName = "Manager", 
      patientName, 
      testList = "N/A", 
      paidAmount = 0, 
      dueAmount = 0,
      clientId
    } = body;

    const finalClientId = Number(clientId) || orgId;

    // Fetch the Organization and its related WhatsApp credentials + lab profile
    const organization = (await prisma.organization.findUnique({
      where: { id: finalClientId },
      include: { whatsappAccounts: true },
    })) as any;

    const labProfile = await prisma.labProfile.findFirst({
      where: { organizationId: finalClientId }
    });

    if (!adminPhone || adminPhone === "919876543210") {
      adminPhone = labProfile?.phone || organization?.phone;
    }

    if (!adminPhone || !patientName) {
      return NextResponse.json(
        { error: 'Missing required parameters: adminPhone or patientName' },
        { status: 400 }
      );
    }

    const cleanPhoneNumber = adminPhone.replace(/\D/g, '');
    
    let waConfig = organization?.whatsappAccounts?.find(
      (acc: any) => acc.status === "ACTIVE" && acc.phoneNumberId && acc.encryptedAccessToken
    );

    if (finalClientId !== 1 && (!organization || organization.whatsappLimit <= 0)) {
      console.log("ERROR: Insufficient WhatsApp Message Credits for Admin Alert.");
      return NextResponse.json(
        { error: "Insufficient WhatsApp Message Credits. Please contact Master HQ." },
        { status: 403 }
      );
    }

    if (!waConfig) {
      const superAdminOrg = await prisma.organization.findUnique({
        where: { id: 1 },
        include: { whatsappAccounts: true },
      }) as any;
      waConfig = superAdminOrg?.whatsappAccounts?.find(
        (acc: any) => acc.status === "ACTIVE" && acc.phoneNumberId && acc.encryptedAccessToken
      );
    }

    const phoneNumberId = waConfig?.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = waConfig?.encryptedAccessToken || process.env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
      return NextResponse.json(
        { error: 'Server configuration error: Missing WhatsApp environment variables' },
        { status: 500 }
      );
    }

    const metaPayload = {
      messaging_product: 'whatsapp',
      to: cleanPhoneNumber,
      type: 'template',
      template: {
        name: 'admin_billing_alert',
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', parameter_name: 'admin_name', text: String(adminName) },
              { type: 'text', parameter_name: 'patient_name', text: String(patientName) },
              { type: 'text', parameter_name: 'test_list', text: String(testList) },
              { type: 'text', parameter_name: 'paid_amount', text: String(paidAmount) },
              { type: 'text', parameter_name: 'due_amount', text: String(dueAmount) }
            ]
          }
        ]
      }
    };

    const metaResponse = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metaPayload)
    });

    const metaData = await metaResponse.json();

    if (!metaResponse.ok) {
      console.error('Meta API Error:', JSON.stringify(metaData, null, 2));
      return NextResponse.json(
        { error: 'WhatsApp dispatch failed', details: metaData.error },
        { status: metaResponse.status }
      );
    }
    
    if (finalClientId !== 1) {
      await (prisma.organization as any).update({
        where: { id: finalClientId },
        data: { whatsappLimit: { decrement: 1 } }
      });
    }

    return NextResponse.json({ success: true, data: metaData }, { status: 200 });
  } catch (error: any) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}