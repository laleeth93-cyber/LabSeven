"use server";

import { PrismaClient } from '@prisma/client';
import { unstable_noStore as noStore } from 'next/cache';

const prisma = new PrismaClient();

// 🚨 FIX: Added _cacheBuster to permanently prevent Next.js from serving stale data
export async function getPublicDocumentData(identifier: string, _cacheBuster?: string) {
    noStore(); 

    try {
        if (!identifier) {
            return { success: false, message: "Invalid Bill identifier provided." };
        }

        const numId = Number(identifier);

        const bill = await prisma.bill.findFirst({
            where: {
                OR: [
                    { id: isNaN(numId) ? -1 : numId },
                    { billNumber: identifier }
                ]
            },
            include: {
                patient: true,
                organization: true,
                approvedBy1: true,
                approvedBy2: true,
                items: {
                    include: {
                        test: {
                            include: {
                                parameters: {
                                    include: {
                                        parameter: {
                                            include: {
                                                ranges: true
                                            }
                                        }
                                    },
                                    orderBy: { order: 'asc' }
                                },
                                packageTests: {
                                    include: {
                                        test: {
                                            include: {
                                                parameters: {
                                                    include: {
                                                        parameter: {
                                                            include: {
                                                                ranges: true
                                                            }
                                                        }
                                                    },
                                                    orderBy: { order: 'asc' }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        results: {
                            include: {
                                parameter: true
                            }
                        }
                    }
                }
            }
        });

        if (!bill) {
            return { success: false, message: "Document not found or has been deleted." };
        }

        const labProfile = await prisma.labProfile.findFirst({
            where: { organizationId: bill.organizationId }
        });

        const reportSettings = await prisma.reportSettings.findFirst({
            where: { organizationId: bill.organizationId }
        });

        return {
            success: true,
            data: {
                bill,
                labProfile,
                reportSettings
            }
        };

    } catch (error: any) {
        console.error("Error in getPublicDocumentData:", error);
        return { success: false, message: "An error occurred while fetching the document." };
    }
}

// 🚨 FIX: Added this function to fetch historical graph data for the public Smart Report verification
export async function getPublicDeltaCheckData(billId: number, patientId: number) {
    noStore();
    try {
      // 1. Get current bill results
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
      const orgId = currentResults[0].billItem.bill.organizationId; // Securely scope to the same org
  
      // 2. Get all previous results for these parameters for this patient
      const previousResults = await prisma.testResult.findMany({
        where: {
          organizationId: orgId, 
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
      console.error("Public Delta Check Error:", error);
      return { success: false, data: [] };
    }
}