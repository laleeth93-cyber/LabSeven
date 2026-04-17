// --- BLOCK app/actions/parameters.ts OPEN ---
"use server";

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/server-auth'; // 🚨 IMPORTING OUR NEW GATEKEEPER

// --- HELPER: GENERATE NEXT CODE ---
export async function generateNextParameterCode() {
  try {
    const { orgId } = await requireAuth(); // 🚨 GATEKEEPER
    const allParams = await prisma.parameter.findMany({
      where: { organizationId: orgId }, // 🚨 Filter to current lab
      select: { code: true }
    });

    let maxNum = 0;
    allParams.forEach(p => {
      if (p.code) {
        const match = p.code.match(/PAR-(\d+)/);
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      }
    });

    return `PAR-${(maxNum + 1).toString().padStart(4, '0')}`;
  } catch (error) {
    return 'PAR-0001';
  }
}

// --- GET ALL ---
export async function getParameters() {
  try {
    const { orgId } = await requireAuth(); // 🚨 GATEKEEPER
    const data = await prisma.parameter.findMany({
      where: { organizationId: orgId }, // 🚨 Filter to current lab
      orderBy: { updatedAt: 'desc' },
      include: { ranges: true }
    });
    return { success: true, data };
  } catch (error) {
    console.error("Get Parameters Error:", error);
    return { success: false, message: "Failed to load parameters.", data: [] };
  }
}

// --- GET SINGLE ---
export async function getParameter(id: number) {
  try {
    const { orgId } = await requireAuth(); // 🚨 GATEKEEPER
    const data = await prisma.parameter.findFirst({
      where: { id: id, organizationId: orgId }, // 🚨 Ensure it belongs to lab
      include: { ranges: true }
    });
    if (!data) return { success: false, message: "Parameter not found" };
    return { success: true, data };
  } catch (error) {
    console.error("Get Parameter Error:", error);
    return { success: false, message: "Failed to fetch parameter" };
  }
}

// --- HELPER: PARSE NUMBER SAFE ---
function safeFloat(val: any): number | null {
  if (val === '' || val === null || val === undefined) return null;
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
}

function safeInt(val: any, defaultVal = 0): number {
  if (val === '' || val === null || val === undefined) return defaultVal;
  const num = parseInt(val, 10);
  return isNaN(num) ? defaultVal : num;
}

// --- CREATE ---
export async function createParameter(data: any) {
  try {
    const { orgId } = await requireAuth(); // 🚨 GATEKEEPER

    // 1. Duplicate Name Check
    const existingName = await prisma.parameter.findFirst({
        where: { 
            name: { equals: data.name, mode: 'insensitive' },
            organizationId: orgId // 🚨 Filter to current lab
        }
    });
    if (existingName) {
        return { success: false, message: "Parameter name already exists in your lab." };
    }

    // 2. Generate Code
    let finalCode = data.code;
    if (!finalCode) {
        finalCode = await generateNextParameterCode();
    }
    
    // Collision Loop
    let exists = await prisma.parameter.findFirst({ 
        where: { code: finalCode, organizationId: orgId } 
    });
    while(exists) {
        const match = finalCode.match(/PAR-(\d+)/);
        let num = match ? parseInt(match[1], 10) + 1 : 1;
        finalCode = `PAR-${num.toString().padStart(4, '0')}`;
        exists = await prisma.parameter.findFirst({ 
            where: { code: finalCode, organizationId: orgId } 
        });
    }

    const newParam = await prisma.parameter.create({
      data: {
        organizationId: orgId, // 🚨 Critical: Attach to lab
        name: data.name,
        code: finalCode,
        displayName: data.displayName || null,
        department: data.department || null,
        unit: data.unit || null,
        inputType: data.inputType || 'Numerical',
        price: safeFloat(data.price) || 0,
        isActive: data.isActive ?? true,
        method: data.method || null,
        decimals: safeInt(data.decimals, 2),
        
        // Additional info
        lowMessage: data.lowMessage || null,
        highMessage: data.highMessage || null,
        panicMessage: data.panicMessage || null,
        interpretation: data.interpretation || null,

        // Formatting
        resultAlignment: data.resultAlignment || 'Beside',
        isMultiValue: data.isMultiValue || false,
        options: data.options || [],

        reportTitle: data.reportTitle || null,
        colCaption1: data.colCaption1 || null,
        colCaption2: data.colCaption2 || null,
        colCaption3: data.colCaption3 || null,
        colCaption4: data.colCaption4 || null,
        colCaption5: data.colCaption5 || null,
        isFormula: data.isFormula || false,
        billingOnly: data.billingOnly || false,

        ranges: {
            create: (data.ranges || []).map((r: any) => ({
                organizationId: orgId, // 🚨 Tag range to lab
                gender: r.gender || 'Both',
                minAge: safeInt(r.minAge, 0),
                maxAge: safeInt(r.maxAge, 100),
                minAgeUnit: r.minAgeUnit || 'Years',
                maxAgeUnit: r.maxAgeUnit || 'Years',
                
                normalOperator: r.normalOperator || 'Between',
                lowRange: safeFloat(r.lowRange),
                highRange: safeFloat(r.highRange),
                normalRange: r.normalRange || null, // Text description

                normalValue: r.normalValue || null,
                abnormalValue: r.abnormalValue || null,
                
                criticalOperator: r.criticalOperator || 'Between',
                criticalLow: safeFloat(r.criticalLow),
                criticalHigh: safeFloat(r.criticalHigh),
                criticalValue: r.criticalValue || null,
            }))
        }
      }
    });

    revalidatePath('/parameters');
    return { success: true, data: newParam };
  } catch (error: any) {
    console.error("Create Parameter Error:", error);
    return { success: false, message: error.message || "Failed to create parameter." };
  }
}

// --- UPDATE ---
export async function updateParameter(id: number, data: any) {
  try {
    const { orgId } = await requireAuth(); // 🚨 GATEKEEPER

    // 1. Verify Ownership
    const existingParam = await prisma.parameter.findFirst({
        where: { id: id, organizationId: orgId }
    });
    if (!existingParam) {
        return { success: false, message: "Parameter not found." };
    }

    // 2. Duplicate Name Check (Exclude self)
    const existingName = await prisma.parameter.findFirst({
        where: { 
            name: { equals: data.name, mode: 'insensitive' },
            organizationId: orgId,
            id: { not: id }
        }
    });
    if (existingName) {
        return { success: false, message: "Parameter name already exists in your lab." };
    }

    const updated = await prisma.parameter.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        displayName: data.displayName || null,
        department: data.department || null,
        unit: data.unit || null,
        inputType: data.inputType || 'Numerical',
        price: safeFloat(data.price) || 0,
        isActive: data.isActive,
        method: data.method || null,
        decimals: safeInt(data.decimals, 2),
        
        // Additional info
        lowMessage: data.lowMessage || null,
        highMessage: data.highMessage || null,
        panicMessage: data.panicMessage || null,
        interpretation: data.interpretation || null,

        resultAlignment: data.resultAlignment || 'Beside',
        isMultiValue: data.isMultiValue || false,
        options: data.options || [],

        reportTitle: data.reportTitle || null,
        colCaption1: data.colCaption1 || null,
        colCaption2: data.colCaption2 || null,
        colCaption3: data.colCaption3 || null,
        colCaption4: data.colCaption4 || null,
        colCaption5: data.colCaption5 || null,
        isFormula: data.isFormula || false,
        billingOnly: data.billingOnly || false,

        ranges: {
            deleteMany: {}, // Deletes old ranges
            create: (data.ranges || []).map((r: any) => ({
                organizationId: orgId, // 🚨 Tag range to lab
                gender: r.gender || 'Both',
                minAge: safeInt(r.minAge, 0),
                maxAge: safeInt(r.maxAge, 100),
                minAgeUnit: r.minAgeUnit || 'Years',
                maxAgeUnit: r.maxAgeUnit || 'Years',
                
                normalOperator: r.normalOperator || 'Between',
                lowRange: safeFloat(r.lowRange),
                highRange: safeFloat(r.highRange),
                normalRange: r.normalRange || null,

                normalValue: r.normalValue || null,
                abnormalValue: r.abnormalValue || null,
                
                criticalOperator: r.criticalOperator || 'Between',
                criticalLow: safeFloat(r.criticalLow),
                criticalHigh: safeFloat(r.criticalHigh),
                criticalValue: r.criticalValue || null,
            }))
        }
      }
    });

    revalidatePath('/parameters');
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Update Parameter Error:", error);
    return { success: false, message: error.message || "Failed to update parameter." };
  }
}

// --- SAVE (UNIFIED) ---
export async function saveParameter(data: any) {
  if (data.id) {
    return updateParameter(data.id, data);
  } else {
    return createParameter(data);
  }
}

// --- UPDATE STATUS ONLY ---
export async function updateParameterStatus(id: number, isActive: boolean) {
  try {
    const { orgId } = await requireAuth(); // 🚨 GATEKEEPER
    
    // Security check
    const existingParam = await prisma.parameter.findFirst({ where: { id: id, organizationId: orgId } });
    if (!existingParam) return { success: false, message: "Parameter not found." };

    await prisma.parameter.update({
      where: { id },
      data: { isActive }
    });
    revalidatePath('/parameters');
    return { success: true };
  } catch (error) {
    console.error("Update Status Error:", error);
    return { success: false, message: "Failed to update status." };
  }
}

// --- DELETE ---
export async function deleteParameter(id: number) {
  try {
    const { orgId } = await requireAuth(); // 🚨 GATEKEEPER
    
    // Security check
    const existingParam = await prisma.parameter.findFirst({ where: { id: id, organizationId: orgId } });
    if (!existingParam) return { success: false, message: "Parameter not found." };

    await prisma.parameter.delete({ where: { id } });
    revalidatePath('/parameters');
    return { success: true };
  } catch (error) {
    return { success: false, message: "Failed to delete parameter. It may be linked to existing tests." };
  }
}
// --- BLOCK app/actions/parameters.ts CLOSE ---