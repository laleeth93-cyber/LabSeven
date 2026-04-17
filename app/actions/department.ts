// --- BLOCK app/actions/department.ts OPEN ---
"use server";

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/server-auth'; // 🚨 IMPORTING OUR NEW GATEKEEPER

// --- GENERATOR: MAX + 1 LOGIC ---
export async function generateDepartmentCode() {
  try {
    const { orgId } = await requireAuth(); // 🚨 GATEKEEPER
    const allDepts = await prisma.department.findMany({
      where: { organizationId: orgId }, // 🚨 Filter to current lab
      select: { code: true }
    });

    let maxNum = 0;
    allDepts.forEach(d => {
      const match = d.code.match(/DEP-(\d+)/);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });

    return `DEP-${(maxNum + 1).toString().padStart(4, '0')}`;
  } catch (error: any) {
    return 'DEP-0001';
  }
}

// --- GET ALL DEPARTMENTS ---
export async function getDepartments() {
  try {
    const { orgId } = await requireAuth(); // 🚨 GATEKEEPER
    const data = await prisma.department.findMany({
      where: { organizationId: orgId }, // 🚨 Filter to current lab
      orderBy: { name: 'asc' }
    });
    return { success: true, data };
  } catch (error: any) {
    console.error("Get Departments Error:", error);
    return { success: false, message: error?.message || "Failed to load departments.", data: [] };
  }
}

// --- CREATE ---
export async function createDepartment(data: any) {
  try {
    const { orgId } = await requireAuth(); // 🚨 GATEKEEPER

    // 1. Check for Duplicate Name (Case Insensitive) within this lab
    const existingName = await prisma.department.findFirst({
      where: {
        organizationId: orgId, // 🚨 Filter to current lab
        name: {
          equals: data.name,
          mode: 'insensitive' 
        }
      }
    });

    if (existingName) {
      return { success: false, message: "Department name already exists in your lab." };
    }

    // 2. Generate Code
    let code = data.code || await generateDepartmentCode();
    
    // 3. Collision Loop Check for Code 
    let exists = await prisma.department.findUnique({ 
        where: { organizationId_code: { organizationId: orgId, code: code } } 
    });
    
    while(exists) {
        const match = code.match(/DEP-(\d+)/);
        let num = match ? parseInt(match[1], 10) + 1 : 1;
        code = `DEP-${num.toString().padStart(4, '0')}`;
        exists = await prisma.department.findUnique({ 
            where: { organizationId_code: { organizationId: orgId, code: code } } 
        });
    }

    // 4. Create
    const newDept = await prisma.department.create({
      data: {
        organizationId: orgId, // 🚨 Attach to current lab
        name: data.name,
        code: code,
        description: data.description || '',
        isActive: data.isActive ?? true
      }
    });

    revalidatePath('/department');
    return { success: true, data: newDept };
  } catch (error: any) {
    console.error("Create Department Error:", error);
    return { success: false, message: error?.message || "Failed to create department." };
  }
}

// --- UPDATE ---
export async function updateDepartment(id: number, data: any) {
  try {
    const { orgId } = await requireAuth(); // 🚨 GATEKEEPER

    // 🚨 SECURITY CHECK: Verify ownership
    const existingDept = await prisma.department.findFirst({
        where: { id: id, organizationId: orgId }
    });
    if (!existingDept) return { success: false, message: "Department not found or unauthorized." };

    // 1. Check for Duplicate Name (Case Insensitive), excluding current ID
    const existingName = await prisma.department.findFirst({
      where: {
        organizationId: orgId, // 🚨 Filter to current lab
        name: {
          equals: data.name,
          mode: 'insensitive'
        },
        NOT: {
          id: id 
        }
      }
    });

    if (existingName) {
      return { success: false, message: "Department name already exists in your lab." };
    }

    // 2. Update
    const updated = await prisma.department.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        description: data.description || '',
        isActive: data.isActive
      }
    });

    revalidatePath('/department');
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Update Department Error:", error);
    return { success: false, message: error?.message || "Failed to update department." };
  }
}

// --- SAVE (UNIFIED) ---
export async function saveDepartment(data: any) {
  if (data.id) {
    return updateDepartment(data.id, data);
  } else {
    return createDepartment(data);
  }
}

// --- DELETE ---
export async function deleteDepartment(id: number) {
  try {
    const { orgId } = await requireAuth(); // 🚨 GATEKEEPER
    
    // 🚨 SECURITY FIX: Only delete if it belongs to this lab
    await prisma.department.deleteMany({ 
        where: { id: id, organizationId: orgId } 
    });
    
    revalidatePath('/department');
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error?.message || "Failed to delete department. It may be in use." };
  }
}

// --- TOGGLE STATUS ---
export async function toggleDepartmentStatus(id: number, currentStatus: boolean) {
  try {
    const { orgId } = await requireAuth(); // 🚨 GATEKEEPER
    
    // 🚨 SECURITY FIX: Only update if it belongs to this lab
    await prisma.department.updateMany({
      where: { id: id, organizationId: orgId },
      data: { isActive: !currentStatus }
    });
    
    revalidatePath('/department');
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error?.message || "Failed to update status." };
  }
}
// --- BLOCK app/actions/department.ts CLOSE ---