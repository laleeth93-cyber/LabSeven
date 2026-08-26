import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Initialize Cloudflare R2 Client
const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string || "uploads";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create a clean filename with a timestamp to avoid overwrites
    const originalName = file.name.replace(/\s+/g, '_');
    const fileName = `${folder}/${Date.now()}-${originalName}`;

    // Upload to R2
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
      })
    );

    // Construct the public URL
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;

    console.log(`File successfully uploaded to R2: ${publicUrl}`);

    // Return the exact JSON structure the frontend InvoiceModal expects
    return NextResponse.json({ success: true, url: publicUrl }, { status: 200 });

  } catch (error) {
    console.error("R2 Upload Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload file to Cloudflare R2" },
      { status: 500 }
    );
  }
}