// --- BLOCK app/api/test-email/route.ts OPEN ---
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function GET() {
  try {
    // 1. Check if the API key even exists in the environment
    const apiKey = process.env.SMTP_PASS;
    if (!apiKey) {
      return NextResponse.json({ error: "CRITICAL: SMTP_PASS is missing from .env file!" });
    }

    // 2. Initialize Resend
    const resend = new Resend(apiKey);

    // 3. Attempt to send a basic test email
    const data = await resend.emails.send({
      from: 'Lab Seven <noreply@labseven.in>',
      to: ['your-actual-email@gmail.com'], // 🚨 REPLACE THIS WITH YOUR REAL EMAIL
      subject: 'Lab Seven System Diagnostic',
      html: '<p>If you receive this, the Resend API is working perfectly!</p>',
    });

    if (data.error) {
      return NextResponse.json({ success: false, errorFromResend: data.error });
    }

    return NextResponse.json({ success: true, message: "Email sent successfully!", messageId: data.data?.id });

  } catch (error: any) {
    return NextResponse.json({ success: false, crashError: error.message });
  }
}
// --- BLOCK app/api/test-email/route.ts CLOSE ---