"use server";

import { PrismaClient } from '@prisma/client';
import { unstable_noStore as noStore } from 'next/cache';

const prisma = new PrismaClient();

export async function getPublicDocumentData(billId: number) {
    noStore(); // 🚨 FIX: This strictly disables caching so you always get the latest graph styles!

    try {
        if (!billId) {
            return { success: false, message: "Invalid Bill ID provided." };
        }

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