import { NextRequest, NextResponse } from "next/server";
import { r2Client } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = formData.get("folder") as string || "uploads";

    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
    }

    // Convert file to buffer for uploading
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a clean, unique filename to prevent overwrites
    const ext = file.name.split('.').pop();
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '').replace(`.${ext}`, '');
    const uniqueFilename = `${folder}/${Date.now()}-${cleanName}.${ext}`;

    // Upload to Cloudflare R2
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: uniqueFilename,
      Body: buffer,
      ContentType: file.type,
    });

    await r2Client.send(command);

    // Construct the public URL
    // Ensure R2_PUBLIC_URL doesn't end with a trailing slash in your .env
    const baseUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, '');
    const fileUrl = `${baseUrl}/${uniqueFilename}`;

    return NextResponse.json({ success: true, url: fileUrl });
    
  } catch (error: any) {
    console.error("R2 Upload Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}