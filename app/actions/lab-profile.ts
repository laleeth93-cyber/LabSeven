// --- BLOCK app/actions/lab-profile.ts OPEN ---
"use server";

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/server-auth'; // 🚨 IMPORTING OUR NEW GATEKEEPER

export async function getLabProfile() {
    try {
        const { orgId } = await requireAuth(); // 🚨 GATEKEEPER

        let profile = await prisma.labProfile.findFirst({
            where: { organizationId: orgId } // 🚨 Filter by current lab
        });
        
        if (!profile) { 
            profile = await prisma.labProfile.create({ 
                data: { organizationId: orgId } // 🚨 Attach to current lab
            }); 
        }
        return { success: true, data: profile };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function updateLabProfile(data: any) {
    try {
        const { orgId } = await requireAuth(); // 🚨 GATEKEEPER

        const profile = await prisma.labProfile.findFirst({
            where: { organizationId: orgId } // 🚨 Filter by current lab
        });

        const payload = {
            name: data.name, 
            tagline: data.tagline, 
            address: data.address, 
            phone: data.phone, 
            email: data.email, 
            website: data.website, 
            logoUrl: data.logoUrl
        };

        if (profile) {
            await prisma.labProfile.update({
                where: { id: profile.id },
                data: payload
            });
        } else {
            await prisma.labProfile.create({
                data: {
                    ...payload,
                    organizationId: orgId // 🚨 Attach to current lab
                }
            });
        }
        
        revalidatePath('/lab-profile');
        revalidatePath('/reports');
        revalidatePath('/list');
        return { success: true, message: "Lab Profile saved successfully!" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}
// --- BLOCK app/actions/lab-profile.ts CLOSE ---