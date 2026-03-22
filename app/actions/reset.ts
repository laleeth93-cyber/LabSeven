// BLOCK app/actions/reset.ts OPEN
"use server";

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function resetTestAndResultData() {
  try {
    // --- 1. CLEAR TRANSACTIONS (Result Entry) ---
    // We must delete these first because they depend on the Tests
    
    // Delete all Test Results
    await prisma.testResult.deleteMany({});
    
    // Delete all Bill Items (The link between Bill and Test)
    await prisma.billItem.deleteMany({});
    
    // Delete all Payments
    await prisma.payment.deleteMany({});
    
    // Delete all Bills
    await prisma.bill.deleteMany({});
    
    // --- 2. CLEAR CONFIGURATION (Test Module) ---
    
    // Delete Test Parameters (The link between Test and Parameter)
    await prisma.testParameter.deleteMany({});
    
    // Delete Tests (This clears the Test List, Configuration, and Formats)
    await prisma.test.deleteMany({});
    
    // Note: We DO NOT delete Patients, Doctors, or Parameters (Master Data) 
    // as you likely want to keep those for re-use.

    // Revalidate all pages to reflect the empty state
    revalidatePath('/');
    revalidatePath('/tests');
    revalidatePath('/tests/configuration');
    revalidatePath('/tests/formats');
    revalidatePath('/results');
    revalidatePath('/results/entry');
    
    return { success: true, message: "Database reset successfully! All tests and results have been wiped." };
  } catch (error: any) {
    console.error("Reset Error:", error);
    return { success: false, message: "Failed to reset: " + error.message };
  }
}
// BLOCK app/actions/reset.ts CLOSE