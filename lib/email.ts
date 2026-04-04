// --- BLOCK lib/email.ts OPEN ---
import { Resend } from 'resend';

const resend = new Resend(process.env.SMTP_PASS);

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
    console.log(`⏳ Using Resend SDK to email: [${to}]...`);
    
    const { data, error } = await resend.emails.send({
      from: 'Lab Seven <noreply@labseven.in>',
      to: [to],
      subject: subject,
      html: html,
    });
    
    // 🚨 THIS IS THE CRITICAL FIX: Trap the hidden Resend error
    if (error) {
      console.error("❌ RESEND REJECTED THE EMAIL:", error);
      throw new Error(error.message);
    }
    
    console.log(`✅ Email successfully sent via Resend API! ID:`, data?.id);
    return true;
  } catch (error) {
    console.error("❌ FATAL EMAIL ERROR:", error);
    throw error;
  }
}
// --- BLOCK lib/email.ts CLOSE ---