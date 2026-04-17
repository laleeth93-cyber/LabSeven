// --- BLOCK app/actions/tenant.ts OPEN ---
"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server-auth";

export async function getTenantFeatures() {
    try {
        const { orgId } = await requireAuth();
        
        // Master HQ always sees everything!
        if (orgId === 1) return { success: true, hasSensitivity: true }; 
        
        const org = await prisma.organization.findUnique({
            where: { id: orgId },
            select: { hasSensitivity: true }
        });
        
        return { success: true, hasSensitivity: org?.hasSensitivity || false };
    } catch (error) {
        return { success: false, hasSensitivity: false };
    }
}
// --- BLOCK app/actions/tenant.ts CLOSE ---