// --- BLOCK app/actions/result-entry.ts OPEN ---
"use server";

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

interface TestResultItem {
  billItemId: number;
  parameterId?: number | null; // FIX: Allow null for culture results
  value: string;
  flag: string;
}

export async function getSignatureUsers() {
    try {
        // @ts-ignore
        const users = await prisma.user.findMany({
            // @ts-ignore
            where: { 
                isActive: true, 
                signatureUrl: { not: null },
                isBillingOnly: false 
            },
            select: { id: true, name: true, signName: true, designation: true, isDefaultSignature: true }
        });
        return { success: true, data: users };
    } catch (error) {
        return { success: false, data: [] };
    }
}

export async function getPendingWorklist(search?: string) {
  try {
    const where: any = {
      items: {
        some: {
          // @ts-ignore
          status: { not: "Printed" } 
        }
      }
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
          where: { 
            // @ts-ignore: Status field exists in schema
            status: { not: "Printed" } 
          },
          include: {
            test: true
          }
        }
      },
      orderBy: { date: 'desc' },
      take: 50
    });

    return { success: true, data: bills };
  } catch (error) {
    console.error("CRITICAL: Error fetching worklist. Is the database running?", error);
    return { success: false, data: [] };
  }
}

export async function getResultEntryData(billId: number) {
  try {
    if (!billId) throw new Error("Missing Bill ID");

    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: {
        patient: true,
        doctor: true,
        // @ts-ignore
        approvedBy1: true,
        // @ts-ignore
        approvedBy2: true,
        items: {
          include: {
            test: {
              include: {
                department: true,
                parameters: {
                  include: { parameter: { include: { ranges: true } } },
                  orderBy: { order: 'asc' }
                },
                // @ts-ignore
                packageTests: {
                  include: {
                    test: {
                      include: {
                        department: true, 
                        parameters: {
                          include: { parameter: { include: { ranges: true } } },
                          orderBy: { order: 'asc' }
                        }
                      }
                    }
                  },
                  orderBy: { id: 'asc' }
                }
              }
            },
            // @ts-ignore: Relation exists in schema
            results: {
                include: { parameter: { include: { ranges: true } } }
            }
          }
        }
      }
    });

    if (!bill) {
        console.error(`ERROR: No bill found with ID ${billId}`);
        return { success: false, error: "Bill not found" };
    }

    return { success: true, data: bill };
  } catch (error) {
    console.error("CRITICAL: Error loading bill data. Check database connection:", error);
    return { success: false, error: "Failed to load bill" };
  }
}

export async function saveTestResults(billId: number, results: TestResultItem[], status: string = 'Entered', sig1Id?: number | null, sig2Id?: number | null) {
  try {
    for (const res of results) {
      // FIX: Explicitly handle null so Prisma doesn't overwrite the first record it finds
      const paramIdToUse = res.parameterId === undefined ? null : res.parameterId;

      // @ts-ignore: TestResult model exists in schema
      const existing = await prisma.testResult.findFirst({
        where: {
          billItemId: res.billItemId,
          parameterId: paramIdToUse
        }
      });

      if (existing) {
        // @ts-ignore: TestResult model exists in schema
        await prisma.testResult.update({
          where: { id: existing.id },
          data: {
            resultValue: res.value,
            flag: res.flag, 
            updatedAt: new Date()
          }
        });
      } else {
        // @ts-ignore: TestResult model exists in schema
        await prisma.testResult.create({
          data: {
            billItemId: res.billItemId,
            parameterId: paramIdToUse,
            resultValue: res.value,
            flag: res.flag
          }
        });
      }
    }

    const billItemIds = Array.from(new Set(results.map(r => r.billItemId)));
    
    for (const itemId of billItemIds) {
      await prisma.billItem.update({
        where: { id: itemId },
        data: { 
            // @ts-ignore: Status field exists in schema
            status: status 
        }
      });
    }

    // @ts-ignore
    await prisma.bill.update({
        where: { id: billId },
        // @ts-ignore
        data: {
            approvedBy1Id: sig1Id,
            approvedBy2Id: sig2Id
        }
    });

    revalidatePath('/results/entry');
    return { success: true, message: `Results saved as ${status}` };
  } catch (error: any) {
    console.error("CRITICAL: Error saving results:", error);
    return { success: false, message: error.message };
  }
}

export async function saveTestNote(billItemId: number, note: string) {
  try {
    await prisma.billItem.update({
      where: { id: billItemId },
      data: { 
        // @ts-ignore: Notes field exists in schema
        notes: note 
      }
    });
    
    revalidatePath('/results/entry');
    return { success: true };
  } catch (error: any) {
    console.error("Error saving note:", error);
    return { success: false, message: error.message };
  }
}

export async function checkHistoryAvailability(patientId: number, parameterIds: number[], excludeBillId?: number) {
  try {
    const whereClause: any = {
        parameterId: { in: parameterIds },
        billItem: {
          bill: {
            patientId: patientId
          }
        }
    };

    if (excludeBillId) {
        whereClause.billItem.bill.id = { not: excludeBillId };
    }

    // @ts-ignore: TestResult model exists in schema
    const results = await prisma.testResult.groupBy({
      by: ['parameterId'],
      where: whereClause,
      _count: {
        id: true
      }
    });

    return { success: true, data: (results as any[]).map(r => r.parameterId) };
  } catch (error) {
    console.error("Error checking history:", error);
    return { success: false, data: [] };
  }
}

export async function getParameterHistory(patientId: number, parameterId: number) {
  try {
    // @ts-ignore: TestResult model exists in schema
    const history = await prisma.testResult.findMany({
      where: {
        parameterId: parameterId,
        billItem: {
          bill: {
            patientId: patientId
          }
        }
      },
      include: {
        billItem: {
          include: {
            bill: true
          }
        }
      },
      orderBy: {
        billItem: {
          bill: {
            date: 'desc'
          }
        }
      },
      take: 10
    });

    const formattedHistory = history.map((h: any) => ({
      date: h.billItem.bill.date.toISOString().split('T')[0],
      value: h.resultValue,
      flag: h.flag,
      billNumber: h.billItem.bill.billNumber
    }));

    const graphData = [...formattedHistory].reverse();

    return { success: true, tableData: formattedHistory, graphData: graphData };
  } catch (error) {
    console.error("Error fetching history:", error);
    return { success: false };
  }
}

export async function clearAllEntryData() {
  try {
    await prisma.$transaction([
      // @ts-ignore: TestResult exists
      prisma.testResult.deleteMany({}), 
      prisma.payment.deleteMany({}),
      prisma.billItem.deleteMany({}),
      prisma.bill.deleteMany({})
    ]);

    revalidatePath('/results/entry');
    return { success: true, message: "All bills and results deleted permanently." };
  } catch (error: any) {
    console.error("Error clearing data:", error);
    return { success: false, message: error.message };
  }
}

export async function getDeltaCheckData(billId: number, patientId: number) {
  try {
    // 1. Get current bill results
    // @ts-ignore
    const currentResults = await prisma.testResult.findMany({
      where: { billItem: { billId: billId } },
      include: {
        parameter: true,
        billItem: { include: { bill: true, test: true } }
      }
    });

    if (!currentResults.length) return { success: true, data: [] };

    const currentBillDate = currentResults[0].billItem.bill.date;
    const parameterIds = currentResults.map((r: any) => r.parameterId);

    // 2. Get all previous results for these parameters for this patient
    // @ts-ignore
    const previousResults = await prisma.testResult.findMany({
      where: {
        parameterId: { in: parameterIds },
        billItem: {
          bill: {
            patientId: patientId,
            id: { not: billId },
            date: { lt: currentBillDate }
          }
        }
      },
      include: {
        billItem: { include: { bill: true } }
      },
      orderBy: {
        billItem: { bill: { date: 'desc' } }
      }
    });

    // 3. Process and calculate Delta Variance
    const deltaData = currentResults.map((curr: any) => {
       const history = previousResults.filter((p: any) => p.parameterId === curr.parameterId);
       const prev = history.length > 0 ? history[0] : null;
       
       let deltaPercent = null;
       let trend = 'flat';
       let isClinicallySignificant = false;

       if (prev && curr.resultValue && prev.resultValue) {
           const cVal = parseFloat(curr.resultValue);
           const pVal = parseFloat(prev.resultValue);
           
           if (!isNaN(cVal) && !isNaN(pVal) && pVal !== 0) {
               deltaPercent = ((cVal - pVal) / pVal) * 100;
               
               if (deltaPercent > 0) trend = 'up';
               else if (deltaPercent < 0) trend = 'down';

               // Flag as significant if variance is > 15%
               if (Math.abs(deltaPercent) > 15) {
                   isClinicallySignificant = true;
               }
           }
       }

       return {
         parameterId: curr.parameterId,
         parameterName: curr.parameter?.name || 'Unknown',
         unit: curr.parameter?.unit || '',
         testName: curr.billItem?.test?.name || 'Unknown',
         
         currentValue: curr.resultValue,
         currentDate: curr.billItem.bill.date,
         currentFlag: curr.flag,
         
         previousValue: prev ? prev.resultValue : null,
         previousDate: prev ? prev.billItem.bill.date : null,
         previousFlag: prev ? prev.flag : null,
         
         // NEW: Capture full history timeline
         history: history.map((h: any) => ({
             value: h.resultValue,
             date: h.billItem.bill.date,
             flag: h.flag
         })),

         deltaPercent: deltaPercent !== null ? deltaPercent.toFixed(1) : null,
         trend: trend,
         isClinicallySignificant: isClinicallySignificant
       };
    });

    return { success: true, data: deltaData };
  } catch (error) {
    console.error("Delta Check Error:", error);
    return { success: false, data: [] };
  }
}
// --- BLOCK app/actions/result-entry.ts CLOSE ---