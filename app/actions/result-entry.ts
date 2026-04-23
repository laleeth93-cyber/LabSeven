"use server";

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/server-auth'; 

interface TestResultItem {
  billItemId: number;
  parameterId?: number | null; 
  value: string;
  flag: string;
}

export async function getSignatureUsers() {
    try {
        const { orgId } = await requireAuth(); 
        const users = await prisma.user.findMany({
            where: { organizationId: orgId, isActive: true, signatureUrl: { not: null }, isBillingOnly: false },
            select: { id: true, name: true, signName: true, designation: true, isDefaultSignature: true }
        });
        return { success: true, data: users };
    } catch (error) { return { success: false, data: [] }; }
}

export async function getPendingWorklist(search?: string) {
  try {
    const { orgId } = await requireAuth(); 
    const where: any = {
      organizationId: orgId, 
      items: { some: { status: { not: "Printed" } } }
    };

    if (search) {
      where.OR = [
        { billNumber: { contains: search, mode: 'insensitive' } },
        { patient: { firstName: { contains: search, mode: 'insensitive' } } },
        { patient: { phone: { contains: search } } }
      ];
    }

    const bills = await prisma.bill.findMany({
      where,
      include: {
        patient: true,
        items: {
          where: { status: { not: "Printed" } },
          select: { id: true, status: true, test: { select: { id: true, name: true } } }
        }
      },
      orderBy: { date: 'desc' },
      take: 50 
    });
    return { success: true, data: bills };
  } catch (error) { return { success: false, data: [] }; }
}

// 🚨 THE FIX: This is now incredibly lightweight. No parameters loaded here!
export async function getResultEntryData(billId: number) {
  try {
    const { orgId } = await requireAuth(); 
    if (!billId) throw new Error("Missing Bill ID");

    const bill = await prisma.bill.findUnique({
      where: { id: billId, organizationId: orgId }, 
      include: {
        patient: true,
        doctor: { select: { id: true, name: true } },
        approvedBy1: { select: { id: true, name: true, signName: true } },
        approvedBy2: { select: { id: true, name: true, signName: true } },
        items: {
          include: {
            test: {
              select: { // ⚡ ONLY fetching basic test info. No heavy parameters.
                id: true, name: true, isCulture: true, isConfigured: true, isCountNeeded: true, targetCount: true
              }
            },
            results: true
          }
        }
      }
    });
    if (!bill) return { success: false, error: "Bill not found" };
    return { success: true, data: bill };
  } catch (error) { return { success: false, error: "Failed to load bill" }; }
}

// 🚨 NEW API: Lazy-loads parameters only when needed
export async function getTestParameters(testId: number) {
  try {
    const { orgId } = await requireAuth();
    const testDetails = await prisma.test.findUnique({
      where: { id: testId, organizationId: orgId },
      select: {
        parameters: {
          include: { 
            parameter: { select: { id: true, name: true, unit: true, ranges: true, inputType: true, isMultiValue: true, options: true, method: true } } 
          },
          orderBy: { order: 'asc' }
        }
      }
    });
    return { success: true, data: testDetails?.parameters || [] };
  } catch (error) {
    console.error(`Error fetching parameters for test ${testId}:`, error);
    return { success: false, data: [] };
  }
}

// ... Keep your existing saveTestResults, saveTestNote, checkHistoryAvailability, getParameterHistory, clearAllEntryData, and getDeltaCheckData functions exactly as they were below here!
export async function saveTestResults(billId: number, results: TestResultItem[], status: string = 'Entered', sig1Id?: number | null, sig2Id?: number | null) {
    try {
      const { orgId } = await requireAuth(); 
      const billItemIds = Array.from(new Set(results.map(r => r.billItemId)));
      const existingResults = await prisma.testResult.findMany({
          where: { organizationId: orgId, billItemId: { in: billItemIds } }
      });
      const existingMap = new Map();
      existingResults.forEach(r => {
          const paramKey = r.parameterId === null ? 'null' : r.parameterId;
          existingMap.set(`${r.billItemId}_${paramKey}`, r);
      });
      const transactions = [];
      for (const res of results) {
        const paramIdToUse = res.parameterId === undefined ? null : res.parameterId;
        const key = `${res.billItemId}_${paramIdToUse === null ? 'null' : paramIdToUse}`;
        const existing = existingMap.get(key);
  
        if (existing) {
          transactions.push(prisma.testResult.update({
            where: { id: existing.id },
            data: { resultValue: res.value, flag: res.flag, updatedAt: new Date() }
          }));
        } else {
          transactions.push(prisma.testResult.create({
            data: {
              organizationId: orgId, billItemId: res.billItemId, parameterId: paramIdToUse, resultValue: res.value, flag: res.flag
            }
          }));
        }
      }
      for (const itemId of billItemIds) { transactions.push(prisma.billItem.update({ where: { id: itemId }, data: { status: status } })); }
      transactions.push(prisma.bill.update({ where: { id: billId }, data: { approvedBy1Id: sig1Id, approvedBy2Id: sig2Id } }));
      await prisma.$transaction(transactions);
      revalidatePath('/results/entry');
      return { success: true, message: `Results saved as ${status}` };
    } catch (error: any) { return { success: false, message: error.message }; }
  }
  
  export async function saveTestNote(billItemId: number, note: string) {
    try {
      await prisma.billItem.update({ where: { id: billItemId }, data: { notes: note } });
      revalidatePath('/results/entry');
      return { success: true };
    } catch (error: any) { return { success: false, message: error.message }; }
  }
  
  export async function checkHistoryAvailability(patientId: number, parameterIds: number[], excludeBillId?: number) {
    try {
      const { orgId } = await requireAuth(); 
      const whereClause: any = { organizationId: orgId, parameterId: { in: parameterIds }, billItem: { bill: { patientId: patientId } } };
      if (excludeBillId) { whereClause.billItem.bill.id = { not: excludeBillId }; }
      const results = await prisma.testResult.groupBy({ by: ['parameterId'], where: whereClause, _count: { id: true } });
      return { success: true, data: (results as any[]).map(r => r.parameterId) };
    } catch (error) { return { success: false, data: [] }; }
  }
  
  export async function getParameterHistory(patientId: number, parameterId: number) {
    try {
      const { orgId } = await requireAuth(); 
      const history = await prisma.testResult.findMany({
        where: { organizationId: orgId, parameterId: parameterId, billItem: { bill: { patientId: patientId } } },
        include: { billItem: { include: { bill: true } } },
        orderBy: { billItem: { bill: { date: 'desc' } } }, take: 10
      });
      const formattedHistory = history.map((h: any) => ({
        date: h.billItem.bill.date.toISOString().split('T')[0], value: h.resultValue, flag: h.flag, billNumber: h.billItem.bill.billNumber
      }));
      const graphData = [...formattedHistory].reverse();
      return { success: true, tableData: formattedHistory, graphData: graphData };
    } catch (error) { return { success: false }; }
  }