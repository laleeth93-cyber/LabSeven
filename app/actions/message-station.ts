"use server";

import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function getMessageStationStats() {
    try {
        const session = await getServerSession(authOptions);
        const orgId = (session?.user as any)?.orgId;
        
        if (!orgId) {
            return { success: false, error: 'Unauthorized' };
        }

        // Count logs
        const logs = await prisma.whatsAppLog.groupBy({
            by: ['category'],
            where: { organizationId: orgId },
            _count: {
                id: true
            }
        });

        const org: any = await prisma.organization.findUnique({
            where: { id: orgId },
            select: { whatsappLimit: true } as any
        });

        const stats = {
            totalSent: 0,
            reportCount: 0,
            invoiceCount: 0,
            alertCount: 0,
            limit: org?.whatsappLimit || 0
        };

        logs.forEach(log => {
            stats.totalSent += log._count.id;
            const cat = log.category.toUpperCase();
            if (cat.includes('REPORT')) {
                stats.reportCount += log._count.id;
            } else if (cat.includes('BILL') || cat.includes('INVOICE') || cat.includes('RECEIPT')) {
                stats.invoiceCount += log._count.id;
            } else if (cat.includes('ADMIN') || cat.includes('ALERT')) {
                stats.alertCount += log._count.id;
            }
        });



        return { success: true, data: stats };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getMessageStationSettings() {
    try {
        const session = await getServerSession(authOptions);
        const orgId = (session?.user as any)?.orgId;
        
        if (!orgId) {
            return { success: false, error: 'Unauthorized' };
        }

        const org = await prisma.organization.findUnique({
            where: { id: orgId },
            select: { 
                whatsappReportAuto: true, whatsappReportManual: true,
                whatsappInvoiceAuto: true, whatsappInvoiceManual: true,
                whatsappAdminAlertAuto: true, whatsappAdminAlertManual: true,
                whatsappLimit: true
            }
        });

        if (!org) {
            return { success: false, error: 'Organization not found' };
        }

        return { success: true, data: org };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateMessageStationSettings(data: { 
    whatsappReportAuto?: boolean, whatsappReportManual?: boolean,
    whatsappInvoiceAuto?: boolean, whatsappInvoiceManual?: boolean,
    whatsappAdminAlertAuto?: boolean, whatsappAdminAlertManual?: boolean
}) {
    try {
        const session = await getServerSession(authOptions);
        const orgId = (session?.user as any)?.orgId;
        
        if (!orgId) {
            return { success: false, error: 'Unauthorized' };
        }

        const updated = await prisma.organization.update({
            where: { id: orgId },
            data: {
                ...(data.whatsappReportAuto !== undefined && { whatsappReportAuto: data.whatsappReportAuto }),
                ...(data.whatsappReportManual !== undefined && { whatsappReportManual: data.whatsappReportManual }),
                ...(data.whatsappInvoiceAuto !== undefined && { whatsappInvoiceAuto: data.whatsappInvoiceAuto }),
                ...(data.whatsappInvoiceManual !== undefined && { whatsappInvoiceManual: data.whatsappInvoiceManual }),
                ...(data.whatsappAdminAlertAuto !== undefined && { whatsappAdminAlertAuto: data.whatsappAdminAlertAuto }),
                ...(data.whatsappAdminAlertManual !== undefined && { whatsappAdminAlertManual: data.whatsappAdminAlertManual }),
            }
        });

        return { success: true, data: updated };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// -----------------------------------------------------------------------------
// RECHARGE MODULE ACTIONS
// -----------------------------------------------------------------------------

export async function getOrganizationsForRecharge() {
    try {
        const session = await getServerSession(authOptions);
        const orgId = (session?.user as any)?.orgId;
        
        // Strictly Super Admin (Master HQ) only
        if (Number(orgId) !== 1) {
            return { success: false, error: 'Unauthorized. Only Master HQ can view organizations.' };
        }

        const orgs: any = await (prisma.organization as any).findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                whatsappLimit: true
            },
            orderBy: { name: 'asc' }
        });

        return { success: true, data: orgs };
    } catch (error: any) {
        console.error("DB Error in getOrganizationsForRecharge:", error);
        return { success: false, error: 'Failed to retrieve organizations. If you just updated the database schema, please restart your development server.' };
    }
}

export async function rechargeOrganization(targetOrgId: number, amountINR: number) {
    try {
        const session = await getServerSession(authOptions);
        const orgId = (session?.user as any)?.orgId;
        
        if (Number(orgId) !== 1) {
            return { success: false, error: 'Unauthorized.' };
        }

        if (!targetOrgId || amountINR <= 0) {
            return { success: false, error: 'Invalid organization or amount.' };
        }

        // Each message costs 0.15 INR (15 paisa)
        const messagesToAdd = Math.floor(amountINR / 0.15);

        const updated: any = await (prisma.organization as any).update({
            where: { id: targetOrgId },
            data: {
                whatsappLimit: {
                    increment: messagesToAdd
                }
            }
        });

        return { success: true, data: updated, addedMessages: messagesToAdd };
    } catch (error: any) {
        console.error("DB Error in rechargeOrganization:", error);
        return { success: false, error: 'Failed to process recharge. Please ensure your database is synchronized and restart the server if needed.' };
    }
}

export async function resetOrganizationLimit(targetOrgId: number) {
    try {
        const session = await getServerSession(authOptions);
        const orgId = (session?.user as any)?.orgId;
        
        if (Number(orgId) !== 1) {
            return { success: false, error: 'Unauthorized.' };
        }

        if (!targetOrgId) {
            return { success: false, error: 'Invalid organization.' };
        }

        const updated: any = await (prisma.organization as any).update({
            where: { id: targetOrgId },
            data: {
                whatsappLimit: 0
            }
        });

        return { success: true, data: updated };
    } catch (error: any) {
        console.error("DB Error in resetOrganizationLimit:", error);
        return { success: false, error: 'Failed to reset organization limit. Please ensure your database is synchronized and restart the server if needed.' };
    }
}
