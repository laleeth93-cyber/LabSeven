"use server";

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // ✅ Fixed Import

// 🚨 Helper function to get the current tenant's Organization ID
async function getOrgId() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) throw new Error("Unauthorized: No Organization ID found.");
    return session.user.orgId;
}

export async function getRoles() {
    try {
        const orgId = await getOrgId();
        const roles = await prisma.role.findMany({
            where: { organizationId: orgId }, // 🚨 Filter by tenant
            orderBy: { name: 'asc' }
        });
        return { success: true, data: roles };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function saveRole(data: { id?: number, name: string, description?: string }) {
    try {
        const orgId = await getOrgId();
        if (data.id) {
            await prisma.role.update({
                where: { id: data.id },
                data: { name: data.name, description: data.description }
            });
        } else {
            await prisma.role.create({
                // 🚨 Must include organizationId for the Multi-Tenant schema!
                data: { name: data.name, description: data.description, organizationId: orgId }
            });
        }
        revalidatePath('/authorizations');
        return { success: true, message: "Role saved successfully" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function getUsers() {
    try {
        const orgId = await getOrgId();
        const users = await prisma.user.findMany({
            where: { organizationId: orgId }, // 🚨 Filter by tenant
            include: {
                role: true,
                doctor: true
            },
            orderBy: { name: 'asc' }
        });
        return { success: true, data: users };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function saveUser(data: any) {
    try {
        const orgId = await getOrgId();
        const payload = {
            name: data.name,
            username: data.username,
            password: data.password, 
            email: data.email?.trim() ? data.email.trim() : null,
            phone: data.phone?.trim() ? data.phone.trim() : null,
            degree: data.degree,
            roleId: data.roleId ? parseInt(data.roleId) : null,
            isActive: data.isActive,
            allowConcession: data.allowConcession,
            concessionLimit: data.concessionLimit ? parseFloat(data.concessionLimit) : 0,
            isBillingOnly: data.isBillingOnly || false,
            organizationId: orgId // 🚨 Locks this user to the specific lab!
        };

        if (data.id) {
            await prisma.user.update({
                where: { id: data.id },
                data: payload
            });
        } else {
            await prisma.user.create({
                data: payload
            });
        }
        revalidatePath('/authorizations');
        return { success: true, message: "User saved successfully" };
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { success: false, message: "A user with this username or email already exists." };
        }
        return { success: false, message: error.message };
    }
}

export async function toggleUserStatus(id: number, isActive: boolean) {
    try {
        await prisma.user.update({
            where: { id },
            data: { isActive }
        });
        revalidatePath('/authorizations');
        return { success: true, message: `User account ${isActive ? 'enabled' : 'disabled'}` };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function resetUserPassword(id: number, newPassword: string) {
    try {
        await prisma.user.update({
            where: { id },
            data: { password: newPassword }
        });
        revalidatePath('/authorizations');
        return { success: true, message: "Password reset successfully" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function deleteUser(id: number) {
    try {
        await prisma.user.delete({
            where: { id }
        });
        revalidatePath('/authorizations');
        return { success: true, message: "User deleted successfully" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function saveUserSignatureDetails(data: any) {
    try {
        const orgId = await getOrgId(); // Get current lab ID
        
        if (data.isDefaultSignature) {
            await prisma.user.updateMany({
                where: { organizationId: orgId }, // 🚨 Ensure we only reset defaults for THIS lab
                data: { isDefaultSignature: false }
            });

            const reportSettings = await prisma.reportSettings.findFirst({
                where: { organizationId: orgId }
            });
            
            let formattedDesignation = data.designation || '';
            if (data.degree) formattedDesignation += formattedDesignation ? ` | ${data.degree}` : data.degree;
            if (data.regNumber) formattedDesignation += formattedDesignation ? ` | ${data.regNumber}` : data.regNumber;

            const reportDataToSync = {
                organizationId: orgId, // 🚨 Required field
                doc1Name: data.signName || data.name,
                doc1Designation: formattedDesignation,
                doc1SignUrl: data.signatureUrl
            };

            if (reportSettings) {
                await prisma.reportSettings.update({
                    where: { id: reportSettings.id },
                    data: reportDataToSync
                });
            } else {
                await prisma.reportSettings.create({
                    data: reportDataToSync
                });
            }
        }

        await prisma.user.update({
            where: { id: data.id },
            data: { 
                signatureUrl: data.signatureUrl,
                signName: data.signName,
                degree: data.degree,
                designation: data.designation,
                regNumber: data.regNumber,
                signText1: data.signText1,
                signText2: data.signText2,
                isDefaultSignature: data.isDefaultSignature
            }
        });
        
        revalidatePath('/authorizations');
        revalidatePath('/reports');
        revalidatePath('/list');
        return { success: true, message: "Signature profile updated successfully" };
    } catch (error: any) { 
        return { success: false, message: error.message }; 
    }
}

export async function getUserPermissions(userId: number) {
    try {
        const userPerms = await prisma.userPermission.findMany({
            where: { userId },
            include: { permission: true }
        });
        return { success: true, data: userPerms.map((up: any) => up.permission) };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function saveUserPermissions(userId: number, permissionsToSave: {module: string, action: string}[]) {
    try {
        await prisma.userPermission.deleteMany({
            where: { userId }
        });

        for (const p of permissionsToSave) {
            let perm = await prisma.permission.findUnique({
                where: { module_action: { module: p.module, action: p.action } }
            });
            
            if (!perm) {
                perm = await prisma.permission.create({
                    data: { module: p.module, action: p.action }
                });
            }
            
            await prisma.userPermission.create({
                data: { userId, permissionId: perm.id }
            });
        }
        
        revalidatePath('/authorizations');
        return { success: true, message: "Permissions mapped successfully!" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}