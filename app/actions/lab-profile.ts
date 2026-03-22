// --- app/actions/lab-profile.ts Block Open ---
"use server";

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getLabProfile() {
    try {
        // @ts-ignore
        let profile = await prisma.labProfile.findFirst();
        if (!profile) { 
            // @ts-ignore
            profile = await prisma.labProfile.create({ data: {} }); 
        }
        return { success: true, data: profile };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function updateLabProfile(data: any) {
    try {
        // @ts-ignore
        const profile = await prisma.labProfile.findFirst();
        if (profile) {
            // @ts-ignore
            await prisma.labProfile.update({
                where: { id: profile.id },
                data: {
                    name: data.name, tagline: data.tagline, address: data.address, 
                    phone: data.phone, email: data.email, website: data.website, logoUrl: data.logoUrl
                }
            });
        } else {
            // @ts-ignore
            await prisma.labProfile.create({
                data: {
                    name: data.name, tagline: data.tagline, address: data.address, 
                    phone: data.phone, email: data.email, website: data.website, logoUrl: data.logoUrl
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
// --- app/actions/lab-profile.ts Block Close ---