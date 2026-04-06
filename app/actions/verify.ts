// --- BLOCK app/actions/verify.ts OPEN ---
"use server";

import { prisma } from "@/lib/prisma";

export async function getPublicDocumentData(billId: number) {
    try {
        if (!billId || isNaN(billId)) {
            return { success: false, message: "Invalid verification link." };
        }

        // Fetch everything required to build the PDF report exactly like the internal app does
        const bill = await prisma.bill.findUnique({
            where: { id: billId },
            include: {
                organization: true,
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

        if (!bill) return { success: false, message: "Document not found." };
        if (bill.isDeleted) return { success: false, message: "This document has been revoked by the laboratory." };

        const reportSettings = await prisma.reportSettings.findFirst({
            where: { organizationId: bill.organizationId }
        });

        const labProfile = await prisma.labProfile.findFirst({
            where: { organizationId: bill.organizationId }
        });

        return { 
            success: true, 
            data: { bill, reportSettings, labProfile } 
        };
    } catch (error) {
        console.error("Verification Error:", error);
        return { success: false, message: "System error while loading the document." };
    }
}
// --- BLOCK app/actions/verify.ts CLOSE ---