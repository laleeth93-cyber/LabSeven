// --- BLOCK lib/email.ts OPEN ---
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_PORT === '465', 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOtpEmail(to: string, otp: string, purpose: 'REGISTER' | 'RESET') {
  const subject = purpose === 'REGISTER' 
    ? 'Verify your Laboratory Registration' 
    : 'Reset your Lab Seven Password';

  const html = `
    <div style="font-family: Arial, sans-serif; max-w: 500px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #a07be1; text-align: center; margin-bottom: 20px;">Lab Seven Environment</h2>
        <p style="color: #334155; font-size: 16px; text-align: center;">Your secure verification code is:</p>
        <div style="font-size: 36px; font-weight: 900; text-align: center; letter-spacing: 8px; padding: 24px; background: #f8fafc; border-radius: 8px; margin: 24px 0; color: #1e293b;">
            ${otp}
        </div>
        <p style="color: #64748b; font-size: 13px; text-align: center;">This code will expire in 10 minutes. If you did not request this code, please ignore this email.</p>
    </div>
  `;

  try {
    console.log(`⏳ Attempting to send email to ${to}...`);
    
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    });
    
    console.log(`✅ Email successfully sent! Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("❌ NODEMAILER ERROR:");
    console.error(error); // This will print the EXACT reason it failed!
    throw error;
  }
}
// --- BLOCK lib/email.ts CLOSE ---