// BLOCK actions/masters.ts OPEN
"use server";

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

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

    // Fetch all codes to find the gap-proof max
    const allRecords = await model.findMany({ select: { code: true } });
    let maxNum = 0;
    
    // Regex matches PREFIX-NUMBER (e.g., SPC-0003)
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
    const model: any = getModelDelegate(tab);
    if (!model) return { success: false, data: [] };

    const data = await model.findMany({
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
    const model: any = getModelDelegate(tab);
    if (!model) return { success: false, message: "Invalid Master Type" };

    // 1. Check for Duplicate Name (Case Insensitive)
    // We exclude the current ID if we are updating
    const duplicateCheckWhere: any = {
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
      // --- UPDATE ---
      await model.update({
        where: { id: data.id },
        data: payload
      });
    } else {
      // --- CREATE ---
      // Collision Loop Check
      let existing = await model.findUnique({ where: { code: finalCode } });
      while (existing) {
        const match = finalCode.match(/([A-Z]+)-(\d+)/);
        if (match) {
           const prefix = match[1];
           const num = parseInt(match[2]) + 1;
           finalCode = `${prefix}-${num.toString().padStart(4, '0')}`;
           existing = await model.findUnique({ where: { code: finalCode } });
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
    const model: any = getModelDelegate(tab);
    if (!model) return { success: false };

    await model.delete({ where: { id } });
    revalidatePath('/masters');
    return { success: true };
  } catch (error) {
    return { success: false, message: "Failed to delete" };
  }
}

// --- TOGGLE STATUS ---
export async function toggleMasterStatus(tab: string, id: number, currentStatus: boolean) {
  try {
    const model: any = getModelDelegate(tab);
    if (!model) return { success: false };

    await model.update({
      where: { id },
      data: { isActive: !currentStatus }
    });
    revalidatePath('/masters');
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}
// BLOCK actions/masters.ts CLOSE