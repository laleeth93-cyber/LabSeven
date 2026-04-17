// --- BLOCK app/actions/patient-list.ts OPEN ---
"use server";

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/server-auth'; // 🚨 IMPORTING OUR NEW GATEKEEPER

// Fetch all bills/patients for the list with optional Date Filtering
export async function getPatientList(searchQuery: string = '', startDate?: string, endDate?: string) {
    try {
        const { orgId } = await requireAuth(); // 🚨 GATEKEEPER

        // ONLY FETCH BILLS THAT ARE NOT DELETED AND BELONG TO THIS LAB 🚨
        const whereClause: any = { isDeleted: false, organizationId: orgId };
        
        if (searchQuery) {
            whereClause.OR = [
                { billNumber: { contains: searchQuery, mode: 'insensitive' } },
                { patient: { firstName: { contains: searchQuery, mode: 'insensitive' } } },
                { patient: { lastName: { contains: searchQuery, mode: 'insensitive' } } },
                { patient: { phone: { contains: searchQuery } } },
                { patient: { patientId: { contains: searchQuery, mode: 'insensitive' } } }
            ];
        }

        if (startDate || endDate) {
            whereClause.date = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0); 
                whereClause.date.gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999); 
                whereClause.date.lte = end;
            }
        }

        const bills = await prisma.bill.findMany({
            where: whereClause,
            include: {
                patient: true,
                items: {
                    where: { test: { isConfigured: true } },
                    include: { 
                        test: { 
                            select: { 
                                name: true, 
                                code: true, 
                                type: true, 
                                isOutsourced: true, 
                                isConfigured: true,
                                isCulture: true, 
                                cultureColumns: true 
                            } 
                        },
                        results: true 
                    }
                },
                payments: true
            },
            orderBy: { date: 'desc' },
            take: 200 
        });

        return { success: true, data: bills };
    } catch (error: any) {
        console.error("Error fetching patient list:", error);
        return { success: false, message: error.message, data: [] };
    }
}

// Clear Due Amount
export async function clearBillDue(billId: number, amount: number, paymentMode: string) {
    try {
        const { orgId } = await requireAuth(); // 🚨 GATEKEEPER
        
        // 🚨 Verify ownership
        const bill = await prisma.bill.findUnique({ where: { id: billId, organizationId: orgId } });
        if (!bill) return { success: false, message: "Bill not found" };

        const newPaidAmount = bill.paidAmount + amount;
        const newDueAmount = bill.netAmount - newPaidAmount;

        await prisma.$transaction([
            prisma.payment.create({
                // 🚨 Tag payment to the current lab
                data: { organizationId: orgId, billId: billId, amount: amount, mode: paymentMode, date: new Date() }
            }),
            prisma.bill.update({
                where: { id: billId },
                data: { paidAmount: newPaidAmount, dueAmount: newDueAmount < 0 ? 0 : newDueAmount, isFullyPaid: newDueAmount <= 0 }
            })
        ]);

        revalidatePath('/list');
        return { success: true, message: "Due cleared successfully!" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

// Refund Amount 
export async function processRefund(billId: number, amount: number, mode: string, reason: string) {
    try {
        const { orgId } = await requireAuth(); // 🚨 GATEKEEPER
        
        // 🚨 Verify ownership
        const bill = await prisma.bill.findUnique({ where: { id: billId, organizationId: orgId } });
        if (!bill) return { success: false, message: "Bill not found" };
        if (amount > bill.paidAmount) return { success: false, message: "Refund cannot exceed the paid amount." };

        const newPaidAmount = bill.paidAmount - amount;
        
        const refundModeString = `Refund - ${mode}`;
        const transactionNotes = reason ? `Reason: ${reason}` : null;

        await prisma.$transaction([
            prisma.payment.create({
                data: { 
                    organizationId: orgId, // 🚨 Tag payment to the current lab
                    billId: billId, 
                    amount: -amount, 
                    mode: refundModeString, 
                    transactionId: transactionNotes,
                    date: new Date() 
                }
            }),
            prisma.bill.update({
                where: { id: billId },
                data: { 
                    paidAmount: newPaidAmount, 
                    dueAmount: bill.netAmount - newPaidAmount,
                    isFullyPaid: (bill.netAmount - newPaidAmount) <= 0 
                }
            })
        ]);

        revalidatePath('/list');
        return { success: true, message: "Refund processed successfully!" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

// Delete Bill Entirely (Soft Delete to keep metrics)
export async function deleteBill(billId: number) {
    try {
        const { orgId } = await requireAuth(); // 🚨 GATEKEEPER
        
        // 🚨 Verify ownership
        const bill = await prisma.bill.findUnique({ where: { id: billId, organizationId: orgId } });
        if (!bill) return { success: false, message: "Bill not found" };

        // SOFT DELETE
        await prisma.bill.update({ 
            where: { id: billId },
            data: { isDeleted: true }
        });

        revalidatePath('/list');
        return { success: true, message: "Bill deleted successfully." };
    } catch (error: any) {
        console.error("Delete Error: ", error); 
        return { success: false, message: `Failed to delete: ${error.message}` };
    }
}

// Update Patient Details
export async function updatePatientDetails(patientId: number, data: any) {
    try {
        const { orgId } = await requireAuth(); // 🚨 GATEKEEPER
        
        // 🚨 Verify ownership
        const patient = await prisma.patient.findUnique({ where: { id: patientId, organizationId: orgId } });
        if (!patient) return { success: false, message: "Patient not found" };

        await prisma.patient.update({
            where: { id: patientId },
            data: {
                designation: data.designation,
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                email: data.email,
                gender: data.gender,
                ageY: parseInt(data.ageY) || 0,
                ageM: parseInt(data.ageM) || 0,
                ageD: parseInt(data.ageD) || 0,
                address: data.address,
                referralType: data.referralType,
                refDoctor: data.refDoctor
            }
        });
        
        revalidatePath('/list');
        return { success: true, message: "Patient updated successfully!" };
    } catch (error: any) {
        console.error("Error updating patient:", error);
        return { success: false, message: "Failed to update patient details." };
    }
}

export async function searchMasterTests(query: string) {
    if (!query || query.length < 2) return [];
    try {
        const { orgId } = await requireAuth(); // 🚨 GATEKEEPER
        return await prisma.test.findMany({
            where: {
                organizationId: orgId, // 🚨 Filter to current lab
                OR: [ { name: { contains: query, mode: 'insensitive' } }, { code: { contains: query, mode: 'insensitive' } } ],
                isActive: true
            },
            take: 10,
            select: { id: true, name: true, code: true }
        });
    } catch (error) { return []; }
}
// --- BLOCK app/actions/patient-list.ts CLOSE ---