// --- BLOCK app/actions/microbiology.ts OPEN ---
"use server";

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ADDED 'susceptibilityInfo'
type MicroType = 'organism' | 'antibiotic' | 'antibioticClass' | 'interpretation' | 'susceptibilityInfo';

function revalidateMicrobiology() {
    revalidatePath('/organisms');
    revalidatePath('/antibiotics');
    revalidatePath('/antibiotic-classes');
    revalidatePath('/multi-values');
    revalidatePath('/susceptibility-info');
    revalidatePath('/sensitivity');
}

export async function getOrganismsPaginated(page: number = 1, limit: number = 20, search: string = '') {
    try {
        const skip = (page - 1) * limit;
        const where = search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' as any } },
                { code: { contains: search, mode: 'insensitive' as any } }
            ]
        } : {};

        const [data, total] = await Promise.all([
            (prisma.organism as any).findMany({
                where, skip, take: limit,
                include: { antibiotics: { select: { id: true } } },
                orderBy: { name: 'asc' }
            }),
            (prisma.organism as any).count({ where })
        ]);

        return { success: true, data, total, totalPages: Math.ceil(total / limit) };
    } catch (error: any) { return { success: false, message: error.message }; }
}

export async function getAntibioticsPaginated(page: number = 1, limit: number = 20, search: string = '') {
    try {
        const skip = (page - 1) * limit;
        const where = search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' as any } },
                { code: { contains: search, mode: 'insensitive' as any } },
                { group: { contains: search, mode: 'insensitive' as any } }
            ]
        } : {};

        const [data, total] = await Promise.all([
            prisma.antibiotic.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
            prisma.antibiotic.count({ where })
        ]);

        return { success: true, data, total, totalPages: Math.ceil(total / limit) };
    } catch (error: any) { return { success: false, message: error.message }; }
}

export async function getAntibioticClassesPaginated(page: number = 1, limit: number = 20, search: string = '') {
    try {
        const skip = (page - 1) * limit;
        const where = search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' as any } },
                { code: { contains: search, mode: 'insensitive' as any } }
            ]
        } : {};

        const [data, total] = await Promise.all([
            prisma.antibioticClass.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
            prisma.antibioticClass.count({ where })
        ]);

        return { success: true, data, total, totalPages: Math.ceil(total / limit) };
    } catch (error: any) { return { success: false, message: error.message }; }
}

export async function getInterpretationsPaginated(page: number = 1, limit: number = 20, search: string = '') {
    try {
        const skip = (page - 1) * limit;
        const where = search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' as any } },
                { code: { contains: search, mode: 'insensitive' as any } }
            ]
        } : {};

        const [data, total] = await Promise.all([
            prisma.antibioticInterpretation.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
            prisma.antibioticInterpretation.count({ where })
        ]);

        return { success: true, data, total, totalPages: Math.ceil(total / limit) };
    } catch (error: any) { return { success: false, message: error.message }; }
}

// NEW FETCHER FOR SUSCEPTIBILITY INFO
export async function getSusceptibilityInfoPaginated(page: number = 1, limit: number = 20, search: string = '') {
    try {
        const skip = (page - 1) * limit;
        const where = search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' as any } },
                { code: { contains: search, mode: 'insensitive' as any } }
            ]
        } : {};

        const [data, total] = await Promise.all([
            prisma.susceptibilityInfo.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
            prisma.susceptibilityInfo.count({ where })
        ]);

        return { success: true, data, total, totalPages: Math.ceil(total / limit) };
    } catch (error: any) { return { success: false, message: error.message }; }
}

export async function getMicrobiologyMaster(type: MicroType) {
    try {
        let data: any = [];
        if (type === 'organism') {
            data = await (prisma.organism as any).findMany({ include: { antibiotics: { select: { id: true } } }, orderBy: { name: 'asc' } });
        }
        else if (type === 'antibiotic') data = await prisma.antibiotic.findMany({ orderBy: { name: 'asc' } });
        else if (type === 'interpretation') data = await prisma.antibioticInterpretation.findMany({ orderBy: { name: 'asc' } });
        else if (type === 'susceptibilityInfo') data = await prisma.susceptibilityInfo.findMany({ orderBy: { name: 'asc' } });
        else data = await prisma.antibioticClass.findMany({ orderBy: { name: 'asc' } });
        
        return { success: true, data };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function saveMicrobiologyMaster(type: MicroType, data: any) {
    try {
        if (type === 'organism') {
            if (data.id) await (prisma.organism as any).update({ where: { id: data.id }, data: { code: data.code, name: data.name, isActive: data.isActive } });
            else await (prisma.organism as any).create({ data: { code: data.code, name: data.name, isActive: data.isActive } });
        } else if (type === 'antibiotic') {
            if (data.id) await prisma.antibiotic.update({ where: { id: data.id }, data: { code: data.code, name: data.name, group: data.group, isActive: data.isActive } });
            else await prisma.antibiotic.create({ data: { code: data.code, name: data.name, group: data.group, isActive: data.isActive } });
        } else if (type === 'interpretation') {
            if (data.id) await prisma.antibioticInterpretation.update({ where: { id: data.id }, data: { code: data.code, name: data.name, isActive: data.isActive } });
            else await prisma.antibioticInterpretation.create({ data: { code: data.code, name: data.name, isActive: data.isActive } });
        } else if (type === 'susceptibilityInfo') {
            if (data.id) await prisma.susceptibilityInfo.update({ where: { id: data.id }, data: { code: data.code, name: data.name, details: data.details, isActive: data.isActive } });
            else await prisma.susceptibilityInfo.create({ data: { code: data.code, name: data.name, details: data.details, isActive: data.isActive } });
        } else {
            if (data.id) await prisma.antibioticClass.update({ where: { id: data.id }, data: { code: data.code, name: data.name, isActive: data.isActive } });
            else await prisma.antibioticClass.create({ data: { code: data.code, name: data.name, isActive: data.isActive } });
        }
        revalidateMicrobiology();
        return { success: true, message: `Saved successfully!` };
    } catch (error: any) {
        if (error.code === 'P2002') return { success: false, message: 'Code already exists. Please use a unique Code.' };
        return { success: false, message: error.message };
    }
}

export async function mapOrganismAntibiotics(organismId: number, antibioticIds: number[]) {
    try {
        await (prisma.organism as any).update({
            where: { id: organismId },
            data: { antibiotics: { set: antibioticIds.map(id => ({ id })) } }
        });
        revalidateMicrobiology();
        return { success: true, message: 'Antibiotic panel updated successfully!' };
    } catch (error: any) { return { success: false, message: error.message }; }
}

export async function importMicrobiologyMaster(type: MicroType, dataArray: any[]) {
    try {
        if (!dataArray || dataArray.length === 0) return { success: false, message: "No data found to import." };
        
        if (type === 'organism') {
            await (prisma.organism as any).createMany({ data: dataArray.map(d => ({ code: d.code, name: d.name, isActive: true })), skipDuplicates: true });
        } else if (type === 'antibiotic') {
            await prisma.antibiotic.createMany({ data: dataArray.map(d => ({ code: d.code, name: d.name, group: d.group || null, isActive: true })), skipDuplicates: true });
        } else if (type === 'interpretation') {
            await prisma.antibioticInterpretation.createMany({ data: dataArray.map(d => ({ code: d.code, name: d.name, isActive: true })), skipDuplicates: true });
        } else if (type === 'susceptibilityInfo') {
            await prisma.susceptibilityInfo.createMany({ data: dataArray.map(d => ({ code: d.code, name: d.name, details: d.details, isActive: true })), skipDuplicates: true });
        } else {
            await prisma.antibioticClass.createMany({ data: dataArray.map(d => ({ code: d.code, name: d.name, isActive: true })), skipDuplicates: true });
        }
        revalidateMicrobiology();
        return { success: true, message: `Successfully imported ${dataArray.length} records! (Duplicates were skipped)` };
    } catch (error: any) { return { success: false, message: "Bulk import failed: " + error.message }; }
}

export async function deleteMicrobiologyMaster(type: MicroType, id: number) {
    try {
        if (type === 'organism') await (prisma.organism as any).delete({ where: { id } });
        else if (type === 'antibiotic') await prisma.antibiotic.delete({ where: { id } });
        else if (type === 'interpretation') await prisma.antibioticInterpretation.delete({ where: { id } });
        else if (type === 'susceptibilityInfo') await prisma.susceptibilityInfo.delete({ where: { id } });
        else await prisma.antibioticClass.delete({ where: { id } });
        revalidateMicrobiology();
        return { success: true };
    } catch (error: any) {
        return { success: false, message: 'Cannot delete item, it may be linked to existing test results.' };
    }
}

export async function deleteAllMicrobiologyMaster(type: MicroType) {
    try {
        if (type === 'organism') await (prisma.organism as any).deleteMany();
        else if (type === 'antibiotic') await prisma.antibiotic.deleteMany();
        else if (type === 'interpretation') await prisma.antibioticInterpretation.deleteMany();
        else if (type === 'susceptibilityInfo') await prisma.susceptibilityInfo.deleteMany();
        else await prisma.antibioticClass.deleteMany();
        revalidateMicrobiology();
        return { success: true, message: 'All records deleted successfully!' };
    } catch (error: any) {
        return { success: false, message: 'Cannot delete all items. Some may be linked to existing records.' };
    }
}
// --- BLOCK app/actions/microbiology.ts CLOSE ---