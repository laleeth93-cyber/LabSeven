// --- BLOCK app/actions/billing.ts OPEN ---
"use server";

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/server-auth'; // 🚨 IMPORTING OUR NEW GATEKEEPER

// 1. SEARCH TESTS (Multi-Tenant Upgraded)
export async function searchTests(query: string) {
  if (!query || query.length < 2) return [];

  try {
    const { orgId } = await requireAuth(); // 🚨 USING THE GATEKEEPER

    const tests = await prisma.test.findMany({
      where: {
        organizationId: orgId, // 🚨 Filter tests by this specific lab
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

// 2. CREATE BILL (Multi-Tenant Upgraded & TypeScript Fixed)
export async function createBill(data: any) {
  try {
    const { orgId } = await requireAuth(); // 🚨 USING THE GATEKEEPER
    const billNumber = data.billNumber || `INV-${Date.now()}`;
    
    // 🚨 Safely resolve the patient ID
    let patientDbId = parseInt(data.patientId);
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
        where: { id: { in: itemIds }, organizationId: orgId }, // 🚨 Ensure tests belong to this lab
        include: { packageTests: true } 
    });

    for (const submittedItem of data.items) {
        const dbTest = dbTests.find(t => t.id === submittedItem.testId);
        
        if (dbTest && dbTest.type === 'Package') {
             if (dbTest.packageTests && dbTest.packageTests.length > 0) {
                 dbTest.packageTests.forEach((pkgTest, index) => {
                     finalItemsToSave.push({
                         organizationId: orgId, // 🚨 Tag item to lab
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

    // SMART DOCTOR LINKING 
    let doctorId: number | undefined = undefined;
    if (data.referredBy && data.referredBy !== 'Self') {
        const doc = await prisma.doctor.findFirst({
            where: { name: data.referredBy, organizationId: orgId } // 🚨 Ensure doctor belongs to this lab
        });
        if (doc) doctorId = doc.id;
    }

    const newBill = await prisma.bill.create({
      data: {
        organizationId: orgId, // 🚨 Tag Bill to lab
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
        
        payments: {
          create: {
            organizationId: orgId, // 🚨 Tag Payment to lab
            amount: data.paidAmount,
            mode: data.paymentMode || 'Cash',
            date: new Date()
          }
        }
      }
    });

    revalidatePath('/list');
    revalidatePath('/');

    return { success: true, billNumber: newBill.billNumber };
  } catch (error) {
    console.error("Create Bill Error:", error);
    return { success: false, message: "Failed to save bill" };
  }
}
// --- BLOCK app/actions/billing.ts CLOSE ---