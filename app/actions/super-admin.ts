"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/server-auth"; // 🚨 REQUIRED FOR SECURITY CHECK

// 1. Toggle Active/Suspended Status
export async function toggleLabStatus(orgId: number, currentStatus: boolean) {
    try {
        if (orgId === 1) return { success: false, message: "Cannot disable the Master HQ!" };

        await prisma.organization.update({
            where: { id: orgId },
            data: { isActive: !currentStatus }
        });

        revalidatePath("/super-admin");
        return { success: true, message: `Lab ${!currentStatus ? 'Enabled' : 'Disabled'} successfully.` };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

// 2. Delete Lab Permanently
export async function deleteLabPermanently(orgId: number) {
    try {
        if (orgId === 1) return { success: false, message: "Cannot delete the Master HQ!" };

        // Attempt to delete
        await prisma.organization.delete({
            where: { id: orgId }
        });

        revalidatePath("/super-admin");
        return { success: true, message: "Laboratory deleted permanently." };
    } catch (error: any) {
        if (error.code === 'P2003') {
            return { success: false, message: "Cannot delete: This lab contains active patient data. Clear data first." };
        }
        return { success: false, message: "Failed to delete laboratory." };
    }
}

// 3. Renew Lab Subscription (Smart Lifecycle)
export async function renewLabSubscription(orgId: number, planName: string, monthsToAdd: number) {
    try {
        if (orgId === 1) return { success: false, message: "Master HQ does not require renewal." };

        const org = await prisma.organization.findUnique({ where: { id: orgId } });
        if (!org) return { success: false, message: "Lab not found." };

        const now = new Date();
        // Get their current expiration (or default to their 5-day trial end if missing)
        let currentExp = org.subscriptionEndsAt ? new Date(org.subscriptionEndsAt) : new Date(org.createdAt.getTime() + 5 * 24 * 60 * 60 * 1000);
        
        // If the lab has already EXPIRED, their new plan starts from TODAY
        if (currentExp < now) {
            currentExp = now;
        }

        // Add the new months to the end of their existing date!
        const newExpirationDate = new Date(currentExp);
        newExpirationDate.setMonth(newExpirationDate.getMonth() + monthsToAdd);

        await prisma.organization.update({
            where: { id: orgId },
            data: { 
                plan: planName,
                subscriptionEndsAt: newExpirationDate,
                isActive: true // Auto-reactivate if they were suspended
            }
        });

        revalidatePath("/super-admin");
        return { success: true, message: `Renewed to ${planName}. New expiration: ${newExpirationDate.toLocaleDateString()}` };
    } catch (error: any) {
        return { success: false, message: "Failed to process renewal." };
    }
}

// 4. Toggle Sensitivity Module Access
export async function toggleSensitivityModule(orgId: number, currentStatus: boolean) {
    try {
        if (orgId === 1) return { success: true, message: "Master HQ always has full access." };

        await prisma.organization.update({
            where: { id: orgId },
            data: { hasSensitivity: !currentStatus }
        });

        revalidatePath("/super-admin");
        return { success: true, message: `Sensitivity module ${!currentStatus ? 'enabled' : 'disabled'} for this lab.` };
    } catch (error: any) {
        return { success: false, message: "Failed to update module settings." };
    }
}

// 5. Global Wipe: Delete ALL patient data across ALL laboratories
export async function wipeAllTenantData() {
    try {
        const { orgId } = await requireAuth();
        
        // 🚨 FIX: Security Check - Only Master HQ (orgId 1) can execute a global wipe!
        if (orgId !== 1) {
            throw new Error("Only Super Administrators (Master HQ) have permission to wipe global clinic data.");
        }

        // Delete all patient-related data across the entire database
        // Order matters to prevent foreign key constraint errors
        await prisma.$transaction([
            prisma.testResult.deleteMany(),
            prisma.payment.deleteMany(),
            prisma.billItem.deleteMany(),
            prisma.bill.deleteMany(),
            prisma.patient.deleteMany()
        ]);

        revalidatePath("/", "layout");

        return { success: true, message: "All Patients, Bills, and Results across ALL clients have been permanently deleted." };
    } catch (error: any) {
        console.error("Global Wipe Error:", error);
        return { success: false, message: error.message || "Failed to wipe global data." };
    }
}