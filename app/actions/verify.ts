// --- BLOCK app/actions/verify.ts OPEN ---
"use server";

import { prisma } from "@/lib/prisma";

export async function getPublicDocumentData(billId: number) {
    try {
        if (!billId || isNaN(billId)) {
            return { success: false, message: "Invalid verification link." };
        }

        // Fetch everything required to build the PDF report
        const bill = await prisma.bill.findUnique({
            where: { id: billId },
            include: {
                organization: true,
                patient: true,
                doctor: true,
                payments: true,
                items: {
                    include: {
                        test: {
                            include: { department: true }
                        },
                        results: {
                            include: { parameter: true }
                        }
                    }
                }
            }
        });

        if (!bill) return { success: false, message: "Document not found." };
        if (bill.isDeleted) return { success: false, message: "This document has been revoked by the laboratory." };

        // Fetch the lab's PDF formatting settings
        const reportSettings = await prisma.reportSettings.findFirst({
            where: { organizationId: bill.organizationId }
        });

        return { 
            success: true, 
            data: { bill, reportSettings } 
        };
    } catch (error) {
        console.error("Verification Error:", error);
        return { success: false, message: "System error while loading the document." };
    }
}
// --- BLOCK app/actions/verify.ts CLOSE ---