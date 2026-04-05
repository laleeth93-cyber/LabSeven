// --- BLOCK app/actions/reset.ts OPEN ---
"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server-auth";

export async function resetLabTransactionalData() {
    try {
        const { orgId } = await requireAuth();

        // 🚨 IMPORTANT: We must delete in a specific order to respect database relationships.
        // E.g., You cannot delete a Bill if Payments or BillItems are still attached to it.
        
        // 1. Delete all test results
        await prisma.testResult.deleteMany({ where: { organizationId: orgId } });
        
        // 2. Delete all payments
        await prisma.payment.deleteMany({ where: { organizationId: orgId } });
        
        // 3. Delete all bill items
        await prisma.billItem.deleteMany({ where: { organizationId: orgId } });
        
        // 4. Delete the bills themselves
        await prisma.bill.deleteMany({ where: { organizationId: orgId } });
        
        // 5. Finally, delete the patients
        await prisma.patient.deleteMany({ where: { organizationId: orgId } });

        return { success: true, message: "All test patients and billing records have been successfully cleared." };
    } catch (error: any) {
        console.error("Data Reset Error:", error);
        return { success: false, message: error.message || "Failed to reset laboratory data. Please try again." };
    }
}
// --- BLOCK app/actions/reset.ts CLOSE ---