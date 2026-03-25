"use server";

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface TestResultItem {
  billItemId: number;
  parameterId?: number | null; 
  value: string;
  flag: string;
}

// 🚨 Helper function to get the current tenant's Organization ID
async function getOrgId() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) throw new Error("Unauthorized: No Organization ID found.");
    return session.user.orgId;
}

export async function getSignatureUsers() {
    try {
        const orgId = await getOrgId();
        const users = await prisma.user.findMany({
            where: { 
                organizationId: orgId, // 🚨 Filter to current lab
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
    const orgId = await getOrgId();
    const where: any = {
      organizationId: orgId, // 🚨 Filter to current lab
      items: {
        some: {
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
    console.error("CRITICAL: Error fetching worklist.", error);
    return { success: false, data: [] };
  }
}

export async function getResultEntryData(billId: number) {
  try {
    const orgId = await getOrgId();
    if (!billId) throw new Error("Missing Bill ID");

    const bill = await prisma.bill.findUnique({
      where: { id: billId, organizationId: orgId }, // 🚨 Security check
      include: {
        patient: true,
        doctor: true,
        approvedBy1: true,
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
    console.error("CRITICAL: Error loading bill data.", error);
    return { success: false, error: "Failed to load bill" };
  }
}

export async function saveTestResults(billId: number, results: TestResultItem[], status: string = 'Entered', sig1Id?: number | null, sig2Id?: number | null) {
  try {
    const orgId = await getOrgId();

    for (const res of results) {
      const paramIdToUse = res.parameterId === undefined ? null : res.parameterId;

      const existing = await prisma.testResult.findFirst({
        where: {
          organizationId: orgId, // 🚨 Scope to current lab
          billItemId: res.billItemId,
          parameterId: paramIdToUse
        }
      });

      if (existing) {
        await prisma.testResult.update({
          where: { id: existing.id },
          data: {
            resultValue: res.value,
            flag: res.flag, 
            updatedAt: new Date()
          }
        });
      } else {
        await prisma.testResult.create({
          data: {
            organizationId: orgId, // 🚨 Critical for SaaS! Fixes Vercel build
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
        data: { status: status }
      });
    }

    await prisma.bill.update({
        where: { id: billId },
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
      data: { notes: note }
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
    const orgId = await getOrgId();
    const whereClause: any = {
        organizationId: orgId, // 🚨 Scope history to current lab
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
    const orgId = await getOrgId();
    const history = await prisma.testResult.findMany({
      where: {
        organizationId: orgId, // 🚨 Scope history to current lab
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
    const orgId = await getOrgId();
    await prisma.$transaction([
      // 🚨 CRITICAL FIX: Only deletes records for THIS specific lab
      prisma.testResult.deleteMany({ where: { organizationId: orgId } }), 
      prisma.payment.deleteMany({ where: { organizationId: orgId } }),
      prisma.billItem.deleteMany({ where: { bill: { organizationId: orgId } } }),
      prisma.bill.deleteMany({ where: { organizationId: orgId } })
    ]);

    revalidatePath('/results/entry');
    return { success: true, message: "All bills and results deleted permanently for your lab." };
  } catch (error: any) {
    console.error("Error clearing data:", error);
    return { success: false, message: error.message };
  }
}

export async function getDeltaCheckData(billId: number, patientId: number) {
  try {
    const orgId = await getOrgId();
    
    // 1. Get current bill results
    const currentResults = await prisma.testResult.findMany({
      where: { organizationId: orgId, billItem: { billId: billId } },
      include: {
        parameter: true,
        billItem: { include: { bill: true, test: true } }
      }
    });

    if (!currentResults.length) return { success: true, data: [] };

    const currentBillDate = currentResults[0].billItem.bill.date;
    const parameterIds = currentResults.map((r: any) => r.parameterId);

    // 2. Get all previous results for these parameters for this patient
    const previousResults = await prisma.testResult.findMany({
      where: {
        organizationId: orgId, // 🚨 Limit history scope
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