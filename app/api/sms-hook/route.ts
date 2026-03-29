// FILE: app/api/sms-hook/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // 1. Supabase sends us the user's phone number and the secure OTP
    const payload = await req.json();
    const phone = payload?.user?.phone;
    const otp = payload?.sms?.otp;

    if (!phone || !otp) {
      return NextResponse.json({ error: "Missing data from Supabase" }, { status: 400 });
    }

    // 2. Clean the phone number (Fast2SMS doesn't like the "+" symbol or country code if using local route)
    // Supabase usually sends +919876543210, we just want 9876543210 for Fast2SMS
    const cleanPhone = phone.replace("+91", ""); 

    // 3. Send the OTP using the Fast2SMS API
    const fast2smsUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${process.env.FAST2SMS_API_KEY}&route=otp&variables_values=${otp}&numbers=${cleanPhone}`;
    
    const response = await fetch(fast2smsUrl, { method: "GET" });

    if (!response.ok) {
      console.error("Fast2SMS refused to send the message.");
      return NextResponse.json({ error: "Fast2SMS Error" }, { status: 500 });
    }

    // 4. Tell Supabase that we successfully handled the SMS delivery!
    return NextResponse.json({ message: "SMS sent successfully via Fast2SMS" }, { status: 200 });
    
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}