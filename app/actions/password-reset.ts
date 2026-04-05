// --- BLOCK app/actions/password-reset.ts OPEN ---
"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendOtpEmail } from "@/lib/email"; // 🚨 ADDED: We must import the email sender

export async function sendResetOtp(email: string) {
    try {
        // Clean the email so uppercase/spaces don't break the system
        const cleanEmail = email.toLowerCase().trim();
        
        const user = await prisma.user.findFirst({ where: { email: cleanEmail } });
        if (!user) {
            return { success: false, message: "No account found with this email address." };
        }

        // Generate a random 6-digit code
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Clear any old, unused reset codes for this email so they don't get mixed up
        await prisma.otpCode.deleteMany({
            where: { email: cleanEmail, purpose: "RESET_PASSWORD" }
        });

        // Save the new code to the database
        await prisma.otpCode.create({
            data: {
                email: cleanEmail,
                otp,
                purpose: "RESET_PASSWORD",
                expiresAt: new Date(Date.now() + 10 * 60 * 1000) // Expires in 10 mins
            }
        });

        // 🚨 CRITICAL FIX: Actually send the email to the user!
        await sendOtpEmail(cleanEmail, otp, 'RESET');

        // We keep the console log for development tracking
        console.log("\n=====================================");
        console.log(`🔑 PASSWORD RESET OTP FOR ${cleanEmail}: ${otp}`);
        console.log("=====================================\n");

        return { success: true, message: "An OTP code has been sent to your email!" };
    } catch (error: any) {
        console.error("Password Reset OTP Error:", error);
        return { success: false, message: "Failed to send email. Please try again later." };
    }
}

export async function resetPassword(email: string, otp: string, newPassword: string) {
    try {
        const cleanEmail = email.toLowerCase().trim();

        // Verify the 6-digit code
        const validOtp = await prisma.otpCode.findFirst({
            where: { 
                email: cleanEmail, 
                otp, 
                purpose: "RESET_PASSWORD", 
                expiresAt: { gt: new Date() } 
            }
        });

        if (!validOtp) {
            return { success: false, message: "Invalid or expired OTP code." };
        }

        // Encrypt the new password safely
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Save it to the user's account
        await prisma.user.update({
            where: { email: cleanEmail },
            data: { password: hashedPassword }
        });

        // Delete the used code so it can't be reused by hackers
        await prisma.otpCode.deleteMany({
            where: { email: cleanEmail, purpose: "RESET_PASSWORD" }
        });

        return { success: true, message: "Your password has been successfully reset!" };
    } catch (error: any) {
        return { success: false, message: "An error occurred while resetting your password." };
    }
}
// --- BLOCK app/actions/password-reset.ts CLOSE ---