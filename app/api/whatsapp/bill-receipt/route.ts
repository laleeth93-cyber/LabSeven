import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Map incoming keys securely
    const clientId = body.clientId || body.organizationId;
    const phone = body.phoneNumber || body.phone;
    const patientName = body.patientName || body.name || "Patient";
    const labName = body.labName || "Laboratory";
    const labPhone = body.labPhone || "N/A";
    const amount = body.paymentAmount ?? body.amount ?? 0;
    const pdfUrl = body.invoicePdfUrl || body.pdfUrl || body.pdf;

    console.log("--- WHATSAPP DISPATCH INITIATED ---");
    console.log("Payload Received:", { clientId, phone, patientName, labName, labPhone, amount, pdfUrl });

    // Safeguard: Ensure PDF exists before asking Meta to send it
    if (!pdfUrl) {
      console.log("ERROR: Missing PDF URL in the request.");
      return NextResponse.json(
        { error: "PDF URL is required to send the receipt." },
        { status: 400 }
      );
    }

    const finalClientId = Number(clientId) || 1;

    // Fetch the Organization and its related WhatsApp credentials
    const organization = (await prisma.organization.findUnique({
      where: { id: finalClientId },
      include: { whatsappAccounts: true },
    })) as any;

    let waConfig = organization?.whatsappAccounts?.find(
      (acc: any) =>
        acc.status === "ACTIVE" && acc.phoneNumberId && acc.encryptedAccessToken
    );

    if (finalClientId !== 1 && (!organization || organization.whatsappLimit <= 0)) {
      console.log("ERROR: Insufficient WhatsApp Message Credits.");
      return NextResponse.json(
        { error: "Insufficient WhatsApp Message Credits. Please contact Master HQ." },
        { status: 403 }
      );
    }

    // Fallback to Super Admin (Org 1) if the client hasn't configured their own WhatsApp
    if (!waConfig || !waConfig.phoneNumberId || !waConfig.encryptedAccessToken) {
      console.log(`No active WhatsApp config for Org ${finalClientId}. Falling back to Super Admin (Org 1)...`);
      const superAdminOrg = await prisma.organization.findUnique({
        where: { id: 1 },
        include: { whatsappAccounts: true },
      }) as any;
      
      waConfig = superAdminOrg?.whatsappAccounts?.find(
        (acc: any) =>
          acc.status === "ACTIVE" && acc.phoneNumberId && acc.encryptedAccessToken
      );
    }

    if (!waConfig || !waConfig.phoneNumberId || !waConfig.encryptedAccessToken) {
      console.log("ERROR: Missing WhatsApp configuration in database.");
      return NextResponse.json(
        { error: "WhatsApp is not configured or enabled for this organization (and no central fallback available)" },
        { status: 500 }
      );
    }

    // Format phone number (ensure country code)
    let cleanPhone = String(phone).replace(/\D/g, "");
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }

    // Meta Approved Template Payload mapped exactly to your variables
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanPhone,
      type: "template",
      template: {
        name: "bill_receipt",
        language: { code: "en" },
        components: [
          {
            type: "header",
            parameters: [
              {
                type: "document",
                document: {
                  link: pdfUrl,
                  filename: `${patientName} - Receipt`
                },
              },
            ],
          },
          {
            type: "body",
            parameters: [
              { 
                type: "text", 
                parameter_name: "patient_name", 
                text: String(patientName) 
              },
              { 
                type: "text", 
                parameter_name: "lab_name", 
                text: String(labName) 
              },
              { 
                type: "text", 
                parameter_name: "phone_number", 
                text: String(labPhone) 
              }
            ],
          },
        ],
      },
    };

    const response = await fetch(
      `https://graph.facebook.com/v20.0/${waConfig.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${waConfig.encryptedAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Meta API Error Response:", JSON.stringify(data, null, 2));
      return NextResponse.json(
        { success: false, error: data },
        { status: response.status }
      );
    }

    console.log("WhatsApp Message Sent Successfully via Template!");
    
    // Decrement the limit for this lab
    if (finalClientId !== 1) {
      await (prisma.organization as any).update({
        where: { id: finalClientId },
        data: { whatsappLimit: { decrement: 1 } }
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Server Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}