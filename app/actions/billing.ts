"use server";

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/server-auth';

// 1. SEARCH TESTS
export async function searchTests(query: string) {
  if (!query || query.length < 2) return [];

  try {
    const { orgId } = await requireAuth();

    const tests = await prisma.test.findMany({
      where: {
        organizationId: orgId, 
        OR: [
          { name: { contains: query, mode: 'insensitive' } }, 
          { code: { contains: query, mode: 'insensitive' } }  
        ],
        isActive: true
      },
      include: {
        outsourceLab: true 
      },
      take: 10, 
    });
    return tests;
  } catch (error) {
    console.error("Search Error:", error);
    return [];
  }
}

// 2. CREATE OR UPDATE BILL
export async function createBill(data: any) {
  try {
    const { orgId } = await requireAuth();
    const billNumber = data.billNumber || `INV-${Date.now()}`;
    
    let patientDbId = Number(data.patientId); 
    
    if (isNaN(patientDbId)) {
        const pt = await prisma.patient.findUnique({
           where: { organizationId_patientId: { organizationId: orgId, patientId: data.patientId } }
        });
        if (!pt) throw new Error("Patient not found in this laboratory.");
        patientDbId = pt.id;
    }

    let finalItemsToSave: { organizationId: number, testId: number, price: number, isUrgent: boolean }[] = [];
    
    const itemIds = data.items.map((i: any) => i.testId);
    const dbTests = await prisma.test.findMany({
        where: { id: { in: itemIds }, organizationId: orgId }, 
        include: { packageTests: true } 
    });

    for (const submittedItem of data.items) {
        const dbTest = dbTests.find(t => t.id === submittedItem.testId);
        
        if (dbTest && dbTest.type === 'Package') {
             if (dbTest.packageTests && dbTest.packageTests.length > 0) {
                 dbTest.packageTests.forEach((pkgTest, index) => {
                     finalItemsToSave.push({
                         organizationId: orgId, 
                         testId: pkgTest.testId,
                         price: index === 0 ? submittedItem.price : 0, 
                         isUrgent: false
                     });
                 });
             } else {
                 finalItemsToSave.push({ organizationId: orgId, testId: submittedItem.testId, price: submittedItem.price, isUrgent: false });
             }
        } else {
             finalItemsToSave.push({ organizationId: orgId, testId: submittedItem.testId, price: submittedItem.price, isUrgent: false });
        }
    }

    let doctorId: number | undefined = undefined;
    if (data.referredBy && data.referredBy !== 'Self') {
        const doc = await prisma.doctor.findFirst({
            where: { name: data.referredBy, organizationId: orgId } 
        });
        if (doc) doctorId = doc.id;
    }

    // 🔥 FIX: Fetch the existing bill AND its existing items
    const existingBill = await prisma.bill.findFirst({
      where: {
        billNumber: billNumber,
        organizationId: orgId
      },
      include: {
        items: true // We need the existing items to compare against
      }
    });

    if (existingBill) {
      // --- SMART UPDATE LOGIC ---
      // 1. Find which test IDs are already on the bill
      const existingTestIds = existingBill.items.map((item) => item.testId);
      const incomingTestIds = finalItemsToSave.map((item) => item.testId);

      // 2. Identify NEW items that need to be created
      const newItemsToCreate = finalItemsToSave.filter(
        (newItem) => !existingTestIds.includes(newItem.testId)
      );

      // 3. Identify OLD items that were removed by the user and should be deleted
      const itemsToDelete = existingBill.items.filter(
        (oldItem) => !incomingTestIds.includes(oldItem.testId)
      );

      // ➡️ UPDATE EXISTING BILL
      await prisma.bill.update({
        where: { id: existingBill.id },
        data: {
          patientId: patientDbId, 
          doctorId: doctorId || null, 
          date: new Date(data.date),
          subTotal: data.subTotal,
          discountPercent: data.discountPercent,
          discountAmount: data.discountAmount,
          discountReason: data.discountReason || null,
          netAmount: data.netAmount,
          paidAmount: data.paidAmount,
          dueAmount: data.dueAmount,
          isFullyPaid: data.dueAmount <= 0,
          
          // 🔥 FIX: Only delete removed tests, and only create new tests.
          // Existing tests remain entirely untouched, preserving your results!
          items: {
            delete: itemsToDelete.map((item) => ({ id: item.id })),
            create: newItemsToCreate
          },
          
          // Delete old payment records and replace with current
          payments: {
            deleteMany: {},
            ...(data.paidAmount > 0 && {
                create: {
                  organizationId: orgId,
                  amount: data.paidAmount,
                  mode: data.paymentMode || 'Cash',
                  date: new Date()
                }
            })
          }
        }
      });
      
    } else {
      // ➡️ CREATE NEW BILL
      await prisma.bill.create({
        data: {
          organizationId: orgId, 
          billNumber: billNumber,
          patientId: patientDbId, 
          doctorId: doctorId || null, 
          date: new Date(data.date),
          subTotal: data.subTotal,
          discountPercent: data.discountPercent,
          discountAmount: data.discountAmount,
          discountReason: data.discountReason || null,
          netAmount: data.netAmount,
          paidAmount: data.paidAmount,
          dueAmount: data.dueAmount,
          isFullyPaid: data.dueAmount <= 0,
          
          items: {
            create: finalItemsToSave 
          },
          
          ...(data.paidAmount > 0 && {
              payments: {
                create: {
                  organizationId: orgId,
                  amount: data.paidAmount,
                  mode: data.paymentMode || 'Cash',
                  date: new Date()
                }
              }
          })
        }
      });
    }

    revalidatePath('/list');
    revalidatePath('/');

    return { success: true, billNumber: billNumber };
  } catch (error: any) {
    console.error("Create/Update Bill Error:", error);
    return { success: false, message: error.message || "Unknown database error occurred" };
  }
}

// 3. GENERATE SEQUENTIAL INVOICE NUMBER
export async function getNextBillNumber() {
  try {
    const { orgId } = await requireAuth();
    
    const today = new Date();
    const dateStr = today.getFullYear().toString() +
                    (today.getMonth() + 1).toString().padStart(2, '0') +
                    today.getDate().toString().padStart(2, '0');
    const prefix = `INV-${dateStr}`;

    const lastBill = await prisma.bill.findFirst({
      where: {
        organizationId: orgId,
        billNumber: { startsWith: prefix }
      },
      orderBy: { billNumber: 'desc' }
    });

    if (lastBill && lastBill.billNumber.includes('-')) {
      const parts = lastBill.billNumber.split('-');
      const lastSerial = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSerial)) {
        const nextSerial = (lastSerial + 1).toString().padStart(4, '0');
        return `${prefix}-${nextSerial}`;
      }
    }
    
    return `${prefix}-0001`;

  } catch (error) {
    console.error("Failed to generate Bill Sequence:", error);
    return null;
  }
}

// 4. FETCH CURRENT USER'S SIGNATURE
export async function getCurrentUserSignature() {
  try {
    const { user } = await requireAuth();
    const dbUser = await prisma.user.findUnique({
      where: { id: parseInt(user.id) }
    });

    if (dbUser) {
      let designation = dbUser.designation || '';
      if (dbUser.degree) designation += ` | ${dbUser.degree}`;
      
      return { 
        success: true, 
        data: {
           name: dbUser.signName || dbUser.name,
           designation: designation,
           signatureUrl: dbUser.signatureUrl || null
        }
      };
    }
    return { success: false };
  } catch (error) {
    return { success: false };
  }
}

// 5. FETCH SPECIFIC BILL DETAILS
export async function getBillDetails(billNumber: string) {
  try {
    const { orgId } = await requireAuth();

    const bill = await prisma.bill.findFirst({
      where: {
        billNumber: billNumber,
        organizationId: orgId
      },
      include: {
        patient: true,
        items: {
          include: {
            test: true 
          }
        },
        payments: true 
      }
    });

    if (!bill) {
      return { success: false, error: "Bill not found." };
    }

    return {
      success: true,
      data: {
        bill: bill,
        patient: bill.patient
      }
    };
  } catch (error: any) {
    console.error("Error fetching bill details:", error);
    return { success: false, error: error.message || "Failed to fetch bill details." };
  }
}