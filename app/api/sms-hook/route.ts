// FILE: app/api/sms-hook/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const phone = payload?.user?.phone;
    const otp = payload?.sms?.otp;

    console.log("1. Received from Supabase:", { phone, otp });

    if (!phone || !otp) {
      console.error("Error: Missing phone or OTP from Supabase");
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const cleanPhone = phone.replace("+91", ""); 
    console.log("2. Clean Phone:", cleanPhone);
    console.log("3. API Key Loaded:", process.env.FAST2SMS_API_KEY ? "Yes!" : "NO KEY FOUND!");

    const fast2smsUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${process.env.FAST2SMS_API_KEY}&route=otp&variables_values=${otp}&numbers=${cleanPhone}`;
    
    console.log("4. Sending request to Fast2SMS...");
    const response = await fetch(fast2smsUrl, { method: "GET" });
    const responseText = await response.text(); 
    
    console.log("5. Fast2SMS Response Code:", response.status);
    console.log("6. Fast2SMS Response Body:", responseText);

    if (!response.ok) {
      return NextResponse.json({ error: "Fast2SMS Error" }, { status: 500 });
    }

    return NextResponse.json({ message: "SMS sent successfully via Fast2SMS" }, { status: 200 });
    
  } catch (error) {
    console.error("CRITICAL ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}