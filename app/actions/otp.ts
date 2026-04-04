// --- BLOCK app/actions/otp.ts OPEN ---
"use server";

import { prisma } from '@/lib/prisma';
import { sendOtpEmail } from '@/lib/email';
import bcrypt from 'bcryptjs'; // 🚨 FIX: Added secure hashing library

// Helper to generate a 6-digit number
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function requestOtp(email: string, purpose: 'REGISTER' | 'RESET') {
    try {
        if (!email) return { success: false, message: "Email is required." };

        // If they are trying to reset a password, verify the account actually exists first
        if (purpose === 'RESET') {
            const user = await prisma.user.findFirst({ where: { email: email.toLowerCase() } });
            if (!user) return { success: false, message: "No active account found with this email." };
        }

        // Delete any existing unused OTPs for this email to prevent spam/confusion
        await prisma.otpCode.deleteMany({ where: { email: email.toLowerCase(), purpose } });

        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Expires in 10 minutes

        // Save to Database
        await prisma.otpCode.create({
            data: { email: email.toLowerCase(), otp, purpose, expiresAt }
        });

        // Send the Email
        await sendOtpEmail(email.toLowerCase(), otp, purpose);
        
        return { success: true };
    } catch (error: any) {
        console.error("OTP Generation Error:", error);
        return { success: false, message: "Failed to send verification email. Please try again." };
    }
}

export async function verifyOtpCode(email: string, otp: string, purpose: 'REGISTER' | 'RESET') {
    try {
        const record = await prisma.otpCode.findFirst({
            where: { email: email.toLowerCase(), purpose, otp }
        });

        if (!record) return { success: false, message: "Invalid verification code." };
        if (record.expiresAt < new Date()) return { success: false, message: "Code has expired. Please request a new one." };

        // Success! Delete the OTP so it can never be reused
        await prisma.otpCode.delete({ where: { id: record.id } });
        return { success: true };
    } catch (error) {
        return { success: false, message: "Verification failed." };
    }
}

// Special action to reset the password after OTP is verified
export async function resetPasswordWithVerifiedEmail(email: string, newPassword: string) {
    try {
        // Find user by email
        const user = await prisma.user.findFirst({ where: { email: email.toLowerCase() } });
        if (!user) return { success: false, message: "User not found." };

        // 🚨 FIX: Hash the password securely before saving it to the database!
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword } 
        });

        return { success: true };
    } catch (error) {
        return { success: false, message: "Failed to update password." };
    }
}
// --- BLOCK app/actions/otp.ts CLOSE ---