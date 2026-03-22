// --- BLOCK app/actions/tests.ts OPEN ---
"use server";

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function generateTestCode(type: string = 'Test') {
  try {
    const prefix = type === 'Package' ? 'PKG' : 'TST';
    
    const allTests = await prisma.test.findMany({ select: { code: true } });
    let maxNum = 0;
    
    const regex = new RegExp(`^${prefix}-(\\d+)$`);
    
    allTests.forEach(t => {
      const match = t.code.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    return `${prefix}-${(maxNum + 1).toString().padStart(4, '0')}`;
  } catch (error) {
    const prefix = type === 'Package' ? 'PKG' : 'TST';
    return `${prefix}-0001`;
  }
}

export async function getOutsourceLabs() {
  try {
    const data = await prisma.doctor.findMany({ 
        where: { type: 'Outsource', isActive: true } 
    });
    return { success: true, data };
  } catch (error) {
    return { success: false, data: [] };
  }
}

export async function getTests() {
  try {
    const data = await prisma.test.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        department: true,
        method: true,
        specimen: true,
        vacutainer: true,
        outsourceLab: true,
        parameters: { 
            include: { parameter: true } 
        }
      }
    });
    return { success: true, data };
  } catch (error) {
    return { success: false, message: "Failed to load tests.", data: [] };
  }
}

export async function getTestById(id: number) {
  try {
    const data = await prisma.test.findUnique({
      where: { id },
      include: {
        department: true,
        method: true,
        specimen: true,
        vacutainer: true,
        outsourceLab: true,
        parameters: {
          include: { parameter: true },
          orderBy: { order: 'asc' }
        }
      }
    });
    return { success: true, data };
  } catch (error) {
    return { success: false, message: "Test not found" };
  }
}

export async function createTest(data: any) {
  try {
    const actualType = data.testType || data.type || 'Test';
    let code = data.code || await generateTestCode(actualType);
    const prefix = actualType === 'Package' ? 'PKG' : 'TST';
    
    let exists = await prisma.test.findUnique({ where: { code } });
    const regex = new RegExp(`^${prefix}-(\\d+)$`);
    
    while(exists) {
        const match = code.match(regex);
        let num = match ? parseInt(match[1], 10) + 1 : 1;
        code = `${prefix}-${num.toString().padStart(4, '0')}`;
        exists = await prisma.test.findUnique({ where: { code } });
    }

    const newTest = await prisma.test.create({
      data: {
        name: data.name || data.testName,
        displayName: data.displayName || data.displayTestName || null,
        code: code,
        type: actualType,
        price: parseFloat(data.price) || 0,
        
        departmentId: data.departmentId ? parseInt(data.departmentId) : null,
        methodId: data.methodId ? parseInt(data.methodId) : null,
        specimenId: data.specimenId ? parseInt(data.specimenId) : null,
        vacutainerId: data.vacutainerId ? parseInt(data.vacutainerId) : null,
        
        minDays: parseInt(data.minDays) || 0,
        minHours: parseInt(data.minHours) || 0,
        minMinutes: parseInt(data.minMinutes) || 0,
        maxDays: parseInt(data.maxDays) || 0,
        maxHours: parseInt(data.maxHours) || 0,
        maxMinutes: parseInt(data.maxMinutes) || 0,

        instructions: data.instructions || data.guidelines || '',
        
        lmpRequired: data.lmpRequired || false,
        idRequired: data.idRequired || false,
        consentRequired: data.consentRequired || false,
        billingOnly: data.billingOnly || false,
        isCulture: data.isCulture || false,
        cultureColumns: data.cultureColumns || null,
        
        isOutsourced: data.isOutsourced || false,
        outsourceLabId: data.outsourceLabId ? parseInt(data.outsourceLabId) : null,

        isActive: data.isActive ?? true,
        
        parameters: {
          create: (data.parameters || []).map((p: any, index: number) => ({
            parameterId: parseInt(p.parameterId),
            order: index + 1
          }))
        }
      }
    });

    revalidatePath('/tests');
    return { success: true, data: newTest };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to create test." };
  }
}

export async function updateTest(id: number, data: any) {
  try {
    const updated = await prisma.test.update({
      where: { id },
      data: {
        name: data.name || data.testName,
        displayName: data.displayName || data.displayTestName || null,
        code: data.code,
        type: data.testType || 'Test',
        price: parseFloat(data.price) || 0,
        
        departmentId: data.departmentId ? parseInt(data.departmentId) : null,
        methodId: data.methodId ? parseInt(data.methodId) : null,
        specimenId: data.specimenId ? parseInt(data.specimenId) : null,
        vacutainerId: data.vacutainerId ? parseInt(data.vacutainerId) : null,
        
        minDays: parseInt(data.minDays) || 0,
        minHours: parseInt(data.minHours) || 0,
        minMinutes: parseInt(data.minMinutes) || 0,
        maxDays: parseInt(data.maxDays) || 0,
        maxHours: parseInt(data.maxHours) || 0,
        maxMinutes: parseInt(data.maxMinutes) || 0,
        
        instructions: data.instructions || data.guidelines || '',
        
        lmpRequired: data.lmpRequired,
        idRequired: data.idRequired,
        consentRequired: data.consentRequired,
        billingOnly: data.billingOnly,
        isCulture: data.isCulture,
        cultureColumns: data.cultureColumns,
        
        isOutsourced: data.isOutsourced,
        outsourceLabId: data.outsourceLabId ? parseInt(data.outsourceLabId) : null,

        isActive: data.isActive
      }
    });

    if (data.parameters) {
      await prisma.testParameter.deleteMany({ where: { testId: id } });
      if (data.parameters.length > 0) {
        await prisma.testParameter.createMany({
          data: data.parameters.map((p: any, index: number) => ({
            testId: id,
            parameterId: parseInt(p.parameterId),
            order: index + 1
          }))
        });
      }
    }

    revalidatePath('/tests');
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to update test." };
  }
}

export async function saveTest(data: any) {
  if (data.id) return updateTest(data.id, data);
  return createTest(data);
}

export async function deleteTest(id: number) {
  try {
    await prisma.test.delete({ where: { id } });
    revalidatePath('/tests');
    return { success: true };
  } catch (error) {
    return { success: false, message: "Failed to delete test." };
  }
}

export async function toggleTestStatus(id: number, currentStatus: boolean) {
  try {
    await prisma.test.update({
      where: { id },
      data: { isActive: !currentStatus }
    });
    revalidatePath('/tests');
    return { success: true };
  } catch (error) {
    return { success: false, message: "Failed to toggle status." };
  }
}
// --- BLOCK app/actions/tests.ts CLOSE ---