"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const API_KEY = process.env.INTERNAL_API_KEY || "labseven_secret_key_2025";

export async function changeUserPassword(currentPass: string, newPass: string) {
    try {
        // 1. Verify who is making the request using NextAuth
        const session = await getServerSession(authOptions);
        if (!session?.user || !(session.user as any).id) {
            return { success: false, message: "Unauthorized. Please log in again." };
        }

        const userId = parseInt((session.user as any).id);

        // 2. Forward the secure request to the Node engine
        const response = await fetch(`${BACKEND_URL}/api/settings/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            body: JSON.stringify({ userId, currentPass, newPass })
        });

        return await response.json();

    } catch (error) {
        console.error("Password Change Error:", error);
        return { success: false, message: "An error occurred while updating your password." };
    }
}