// --- BLOCK app/actions/settings.ts OPEN ---
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { comparePassword, hashPassword } from "@/lib/auth-utils";

export async function changeUserPassword(currentPass: string, newPass: string) {
    try {
        // 1. Verify who is making the request
        const session = await getServerSession(authOptions);
        if (!session?.user || !(session.user as any).id) {
            return { success: false, message: "Unauthorized. Please log in again." };
        }

        const userId = parseInt((session.user as any).id);

        // 2. Fetch the user from the database
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return { success: false, message: "User account not found." };
        }

        // 3. Verify their current password is correct
        const isCorrect = await comparePassword(currentPass, user.password);
        if (!isCorrect) {
            return { success: false, message: "Incorrect current password." };
        }

        // 4. Hash the new password and save it
        const hashedNewPassword = await hashPassword(newPass);

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedNewPassword }
        });

        return { success: true, message: "Password updated successfully!" };

    } catch (error) {
        console.error("Password Change Error:", error);
        return { success: false, message: "An error occurred while updating your password." };
    }
}
// --- BLOCK app/actions/settings.ts CLOSE ---