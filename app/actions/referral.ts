// --- BLOCK app/actions/referral.ts OPEN ---
"use server";

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Fetch referrals by type
export async function getReferrals(type: string, searchQuery: string = '') {
    try {
        const whereClause: any = { type: type }; 
        
        if (searchQuery) {
            whereClause.OR = [
                { name: { contains: searchQuery, mode: 'insensitive' } },
                { phone: { contains: searchQuery, mode: 'insensitive' } },
                { clinicName: { contains: searchQuery, mode: 'insensitive' } },
                { specialization: { contains: searchQuery, mode: 'insensitive' } },
                { hospital: { contains: searchQuery, mode: 'insensitive' } },
                { contactPerson: { contains: searchQuery, mode: 'insensitive' } }
            ];
        }

        const referrals = await prisma.doctor.findMany({
            where: whereClause,
            orderBy: { name: 'asc' }
        });

        return { success: true, data: referrals };
    } catch (error: any) {
        console.error("Error fetching referrals:", error);
        return { success: false, message: error.message, data: [] };
    }
}

// Create or Update Referral
export async function saveReferral(data: any, type: string) {
    try {
        const commissionVal = data.commission ? parseFloat(data.commission) : 0;

        const payload = {
            name: data.name,
            phone: data.phone || null,
            email: data.email || null,
            specialization: data.specialization || null,
            clinicName: data.clinicName || null,
            hospital: data.hospital || null,
            degree: data.degree || null,
            contactPerson: data.contactPerson || null,
            commission: isNaN(commissionVal) ? 0 : commissionVal,
            isActive: data.isActive ?? true
        };

        if (data.id) {
            const updated = await prisma.doctor.update({
                where: { id: data.id },
                data: payload
            });
            revalidatePath('/referrals');
            return { success: true, data: updated, message: `${type} updated successfully!` };
        } else {
            const created = await prisma.doctor.create({
                data: {
                    type: type,
                    ...payload
                }
            });
            revalidatePath('/referrals');
            return { success: true, data: created, message: `${type} added successfully!` };
        }
    } catch (error: any) {
        console.error("Error saving referral:", error);
        return { success: false, message: "Failed to save details. " + error.message };
    }
}

// Delete Referral
export async function deleteReferral(id: number) {
    try {
        await prisma.doctor.delete({ where: { id } });
        revalidatePath('/referrals');
        return { success: true, message: "Deleted successfully!" };
    } catch (error: any) {
        return { success: false, message: "Cannot delete as they are already linked to patients/bills." };
    }
}

// Toggle Status - FIXED
export async function toggleReferralStatus(id: number, newStatus: boolean) {
    try {
        await prisma.doctor.update({
            where: { id },
            data: { isActive: newStatus } // FIX: Store the new status exactly as provided by the UI
        });
        revalidatePath('/referrals');
        return { success: true };
    } catch (error: any) {
        return { success: false, message: "Failed to update status." };
    }
}
// --- BLOCK app/actions/referral.ts CLOSE ---