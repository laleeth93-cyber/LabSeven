// --- BLOCK app/actions/reset.ts OPEN ---
"use server";

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/server-auth'; // 🚨 IMPORTING OUR NEW GATEKEEPER

export async function resetLabTransactionalData() {
    try {
        const { orgId } = await requireAuth(); // 🚨 GATEKEEPER

        // 🚨 SECURITY: We ONLY delete transactional data (Patients, Bills, Results)
        // AND we strictly enforce that it only deletes data for the currently logged-in Organization.
        // We DO NOT delete Master Data (Tests, Parameters, Departments) or Users.

        await prisma.$transaction([
            // 1. Delete all Test Results for this lab
            prisma.testResult.deleteMany({ where: { organizationId: orgId } }),
            
            // 2. Delete all Bill Items for this lab
            prisma.billItem.deleteMany({ where: { organizationId: orgId } }),
            
            // 3. Delete all Payments for this lab
            prisma.payment.deleteMany({ where: { organizationId: orgId } }),
            
            // 4. Delete all Bills for this lab
            prisma.bill.deleteMany({ where: { organizationId: orgId } }),
            
            // 5. Delete all Patients for this lab
            prisma.patient.deleteMany({ where: { organizationId: orgId } }),
        ]);

        // Refresh all main dashboard routes
        revalidatePath('/');
        revalidatePath('/list');
        revalidatePath('/results/entry');
        
        return { success: true, message: "Your lab's patient and billing data has been successfully reset." };
    } catch (error: any) {
        console.error("Reset Error:", error);
        return { success: false, message: "Failed to reset lab data." };
    }
}
// --- BLOCK app/actions/reset.ts CLOSE ---