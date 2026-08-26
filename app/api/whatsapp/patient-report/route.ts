import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server-auth";
import { validatePhone, validatePdfUrl, checkRateLimit } from "@/lib/whatsapp/validators";

export async function POST(request: Request) {
  try {
    // 1. Authenticate Organization
    const { orgId } = await requireAuth();
    
    // 2. Extract payload
    const body = await request.json();
    const phone = body.patientPhone || body.phone;
    const patientName = body.patientName || "Patient";
    const pdfUrl = body.pdfUrl;
    const patientId = body.patientId;

    if (!orgId || !phone || !patientName || !pdfUrl) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const organization: any = await (prisma.organization as any).findUnique({
        where: { id: orgId },
        select: { whatsappLimit: true }
    });

    if (orgId !== 1 && (!organization || organization.whatsappLimit <= 0)) {
        return NextResponse.json({ error: "Insufficient WhatsApp Message Credits. Please contact Master HQ." }, { status: 403 });
    }

    // 3. FETCH LAB PROFILE AUTOMATICALLY
    const labProfile = await prisma.labProfile.findFirst({
        where: { organizationId: orgId }
    });
    const labName = labProfile?.name || "Smart Lab";
    const labPhone = labProfile?.phone || "N/A";

    // 4. Verify Active WhatsApp Credentials
    let account = await prisma.whatsAppAccount.findFirst({
      where: { organizationId: orgId, status: 'ACTIVE' }
    });

    if (!account || !account.phoneNumberId || !account.encryptedAccessToken) {
      console.log(`No active WhatsApp config for Org ${orgId}. Falling back to Super Admin (Org 1)...`);
      account = await prisma.whatsAppAccount.findFirst({
        where: { organizationId: 1, status: 'ACTIVE' }
      });
    }

    if (!account || !account.phoneNumberId || !account.encryptedAccessToken) {
      return NextResponse.json(
        { error: "WhatsApp is not configured or enabled for this organization (and no central fallback available)" },
        { status: 500 }
      );
    }

    // 5. Rate Limiter Check & Validations
    const isUnderLimit = await checkRateLimit(orgId);
    if (!isUnderLimit) {
      return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 });
    }

    const cleanPhone = await validatePhone(phone);
    if (!cleanPhone) {
      return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 });
    }

    const isPdfValid = await validatePdfUrl(pdfUrl);
    if (!isPdfValid) {
       return NextResponse.json({ error: "PDF URL is not accessible or invalid" }, { status: 400 });
    }

    // 6. META APPROVED TEMPLATE PAYLOAD (Without test_name)
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanPhone,
      type: "template",
      template: {
        name: "patient_report", 
        language: { code: "en" },
        components: [
          {
            type: "header",
            parameters: [
              {
                type: "document",
                document: {
                  link: pdfUrl,
                  filename: `${patientName} - Report` 
                },
              },
            ],
          },
          {
            type: "body",
            parameters: [
              { type: "text", parameter_name: "patient_name", text: String(patientName) },
              { type: "text", parameter_name: "lab_name", text: String(labName) },
              { type: "text", parameter_name: "phone_number", text: String(labPhone) }
            ],
          },
        ],
      },
    };

    // 7. Dispatch directly to Meta
    const response = await fetch(
      `https://graph.facebook.com/v20.0/${account.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${account.encryptedAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Meta API Error:", JSON.stringify(data, null, 2));
      return NextResponse.json(
        { success: false, error: data },
        { status: response.status }
      );
    }

    // 8. Log the successful send in the database queue history
    await prisma.whatsAppQueue.create({
      data: {
        organizationId: orgId,
        patientId: patientId || null,
        phone: cleanPhone,
        category: 'REPORT',
        transport: 'TEMPLATE',
        templateName: 'patient_report',
        pdfUrl: pdfUrl,
        status: 'COMPLETED',
        priority: 1,
      }
    });

    return NextResponse.json({ success: true, message: 'Report sent successfully', data });

  } catch (err) {
    console.error("Server Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}