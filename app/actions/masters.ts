// --- BLOCK app/actions/masters.ts OPEN ---
"use server";

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/server-auth'; // 🚨 IMPORTING OUR NEW GATEKEEPER

// --- HELPER: MAP TAB NAME TO PRISMA MODEL ---
const getModelDelegate = (tab: string) => {
  switch (tab) {
    case 'specimen': return prisma.specimen;
    case 'vacutainer': return prisma.vacutainer;
    case 'method': return prisma.method;
    case 'uom': return prisma.uOM; 
    case 'operator': return prisma.operator;
    case 'multivalue': return prisma.labList; 
    default: return null;
  }
};

// --- GENERATE CODE (MAX + 1 LOGIC) ---
export async function generateMasterCode(tab: string) {
  try {
    const { orgId } = await requireAuth(); // 🚨 GATEKEEPER
    const model: any = getModelDelegate(tab);
    if (!model) return '';

    let prefix = 'GEN';
    switch (tab) {
      case 'specimen': prefix = 'SPC'; break;
      case 'vacutainer': prefix = 'VAC'; break;
      case 'method': prefix = 'MET'; break;
      case 'uom': prefix = 'UOM'; break;
      case 'operator': prefix = 'OPR'; break;
      case 'multivalue': prefix = 'LST'; break;
    }

    // 🚨 Fetch codes ONLY for the current lab
    const allRecords = await model.findMany({ 
        where: { organizationId: orgId },
        select: { code: true } 
    });
    
    let maxNum = 0;
    const regex = new RegExp(`${prefix}-(\\d+)`);

    allRecords.forEach((r: any) => {
      const match = r.code.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });

    return `${prefix}-${(maxNum + 1).toString().padStart(4, '0')}`;
  } catch (error) {
    return 'GEN-0000';
  }
}

// --- GET ALL RECORDS ---
export async function getMasterData(tab: string) {
  try {
    const { orgId } = await requireAuth(); // 🚨 GATEKEEPER
    const model: any = getModelDelegate(tab);
    if (!model) return { success: false, data: [] };

    const data = await model.findMany({
      where: { organizationId: orgId }, // 🚨 Filter to current lab
      orderBy: { id: 'desc' }
    });
    return { success: true, data };
  } catch (error) {
    console.error(`Error fetching ${tab}:`, error);
    return { success: false, data: [] };
  }
}

// --- SAVE (CREATE OR UPDATE) ---
export async function saveMasterData(tab: string, data: any) {
  try {
    const { orgId } = await requireAuth(); // 🚨 GATEKEEPER
    const model: any = getModelDelegate(tab);
    if (!model) return { success: false, message: "Invalid Master Type" };

    // 1. Check for Duplicate Name (Case Insensitive) within this Lab
    const duplicateCheckWhere: any = {
      organizationId: orgId, // 🚨 Scope to lab
      name: {
        equals: data.name,
        mode: 'insensitive'
      }
    };
    
    if (data.id) {
      duplicateCheckWhere.id = { not: data.id };
    }

    const existingName = await model.findFirst({
      where: duplicateCheckWhere
    });

    if (existingName) {
      return { success: false, message: `${tab} name already exists.` };
    }

    // 2. Generate Code if Create
    let finalCode = data.code;
    if (!data.id && !finalCode) {
      finalCode = await generateMasterCode(tab);
    }

    // 3. Prepare Payload
    const payload: any = {
      organizationId: orgId, // 🚨 Tag to lab
      name: data.name,
      code: finalCode,
      isActive: data.isActive
    };

    if (tab === 'specimen') {
      payload.type = data.type;
      payload.container = data.container;
    } else if (tab === 'vacutainer') {
      payload.color = data.color;
    } else if (tab === 'operator') {
      payload.symbol = data.symbol;
    } else if (tab === 'multivalue') {
      payload.values = data.values;
    }

    if (data.id) {
      // --- UPDATE (Ensure ownership using updateMany) ---
      await model.updateMany({
        where: { id: data.id, organizationId: orgId },
        data: payload
      });
    } else {
      // --- CREATE ---
      // Collision Loop Check scoped to Lab
      let existing = await model.findFirst({ where: { code: finalCode, organizationId: orgId } });
      while (existing) {
        const match = finalCode.match(/([A-Z]+)-(\d+)/);
        if (match) {
           const prefix = match[1];
           const num = parseInt(match[2]) + 1;
           finalCode = `${prefix}-${num.toString().padStart(4, '0')}`;
           existing = await model.findFirst({ where: { code: finalCode, organizationId: orgId } });
        } else {
           break; 
        }
      }
      
      payload.code = finalCode;
      await model.create({ data: payload });
    }

    revalidatePath('/masters');
    return { success: true };
  } catch (error) {
    console.error(`Error saving ${tab}:`, error);
    return { success: false, message: "Database Error" };
  }
}

// --- DELETE ---
export async function deleteMasterData(tab: string, id: number) {
  try {
    const { orgId } = await requireAuth(); // 🚨 GATEKEEPER
    const model: any = getModelDelegate(tab);
    if (!model) return { success: false };

    // 🚨 Ensure we only delete if it belongs to this lab
    await model.deleteMany({ where: { id: id, organizationId: orgId } });
    revalidatePath('/masters');
    return { success: true };
  } catch (error) {
    return { success: false, message: "Failed to delete. It may be linked to existing tests." };
  }
}

// --- TOGGLE STATUS ---
export async function toggleMasterStatus(tab: string, id: number, currentStatus: boolean) {
  try {
    const { orgId } = await requireAuth(); // 🚨 GATEKEEPER
    const model: any = getModelDelegate(tab);
    if (!model) return { success: false };

    // 🚨 Ensure we only update if it belongs to this lab
    await model.updateMany({
      where: { id: id, organizationId: orgId },
      data: { isActive: !currentStatus }
    });
    revalidatePath('/masters');
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}
// --- BLOCK app/actions/masters.ts CLOSE ---