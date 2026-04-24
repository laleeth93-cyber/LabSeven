"use server";

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getPublicDocumentData(billId: number) {
    try {
        if (!billId) {
            return { success: false, message: "Invalid Bill ID provided." };
        }

        // 1. Fetch the Bill and all its deeply nested relationships
        const bill = await prisma.bill.findUnique({
            where: { id: billId },
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

        // 2. Fetch the Lab Profile (Logo, Address, Phone, etc.)
        const labProfile = await prisma.labProfile.findFirst({
            where: { organizationId: bill.organizationId }
        });

        // 3. Fetch Report Settings 
        // 🚨 By NOT using a "select" statement, Prisma automatically fetches ALL columns, 
        // including your newly added 'deltaSettings' for the graph styles!
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