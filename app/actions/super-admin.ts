// --- BLOCK app/actions/super-admin.ts OPEN ---
"use server";

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';
import { revalidatePath } from 'next/cache';

// Helper to check if the logged-in user is the Super Admin
async function requireSuperAdmin() {
    const { orgId } = await requireAuth();
    if (orgId !== 1) {
        throw new Error("UNAUTHORIZED: Only the Super Admin can perform this action.");
    }
    return orgId;
}

export async function getAllLaboratories() {
    try {
        await requireSuperAdmin();

        // Fetch all organizations EXCEPT the Super Admin template (ID: 1)
        const labs = await prisma.organization.findMany({
            where: { id: { not: 1 } },
            include: {
                _count: {
                    select: { 
                        users: true, 
                        bills: true, 
                        patients: true 
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return { success: true, data: labs };
    } catch (error: any) {
        console.error("Super Admin Fetch Error:", error);
        return { success: false, message: error.message, data: [] };
    }
}

export async function toggleLaboratoryStatus(labId: number, currentStatus: boolean) {
    try {
        await requireSuperAdmin();

        await prisma.organization.update({
            where: { id: labId },
            data: { isActive: !currentStatus }
        });

        // If we suspend a lab, we should also suspend all of its users so they get logged out
        await prisma.user.updateMany({
            where: { organizationId: labId },
            data: { isActive: !currentStatus }
        });

        revalidatePath('/super-admin');
        return { success: true, message: `Laboratory has been ${!currentStatus ? 'Activated' : 'Suspended'}.` };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}
// --- BLOCK app/actions/super-admin.ts CLOSE ---