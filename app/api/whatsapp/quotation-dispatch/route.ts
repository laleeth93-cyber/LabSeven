import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phoneNumber, patientName, quotationPdfUrl } = body;

    if (!phoneNumber || !patientName || !quotationPdfUrl) {
      return NextResponse.json(
        { error: 'Missing required parameters: phoneNumber, patientName, or quotationPdfUrl' },
        { status: 400 }
      );
    }

    const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const metaPayload = {
      messaging_product: 'whatsapp',
      to: cleanPhoneNumber,
      type: 'template',
      template: {
        name: 'quotation_dispatch',
        language: { code: 'en' },
        components: [
          {
            type: 'header',
            parameters: [
              {
                type: 'document',
                document: {
                  link: quotationPdfUrl, 
                  filename: 'Lab_Quotation.pdf'
                }
              }
            ]
          },
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                parameter_name: 'patient_name',
                text: String(patientName) 
              }
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

    return NextResponse.json(
      { success: true, data: metaData }, 
      { status: 200 }
    );

  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
