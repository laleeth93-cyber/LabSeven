"use server";

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// 🚨 Helper function to get the current tenant's Organization ID
async function getOrgId() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) throw new Error("Unauthorized: No Organization ID found.");
    return session.user.orgId;
}

// 1. SEARCH TESTS (Multi-Tenant Upgraded)
export async function searchTests(query: string) {
  if (!query || query.length < 2) return [];

  try {
    const orgId = await getOrgId(); // Get current lab ID

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
    const orgId = await getOrgId(); // Get current lab ID
    const billNumber = data.billNumber || `INV-${Date.now()}`;
    
    // 🚨 Safely resolve the patient ID
    // Frontend might pass the string "PAT-123" or the numeric ID. We handle both!
    let patientDbId = parseInt(data.patientId);
    if (isNaN(patientDbId)) {
        // If it's a string, look up the patient using the compound unique key
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
        
        // ✅ FIX: Use direct scalar IDs to satisfy Prisma's UncheckedCreateInput!
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

    // CRITICAL: Force Next.js to dump its cache so the List page updates immediately!
    revalidatePath('/list');
    revalidatePath('/');

    return { success: true, billNumber: newBill.billNumber };
  } catch (error) {
    console.error("Create Bill Error:", error);
    return { success: false, message: "Failed to save bill" };
  }
}