// --- app/actions/authorizations.ts Block Open ---
"use server";

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getRoles() {
    try {
        const roles = await prisma.role.findMany({
            orderBy: { name: 'asc' }
        });
        return { success: true, data: roles };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function saveRole(data: { id?: number, name: string, description?: string }) {
    try {
        if (data.id) {
            await prisma.role.update({
                where: { id: data.id },
                data: { name: data.name, description: data.description }
            });
        } else {
            await prisma.role.create({
                data: { name: data.name, description: data.description }
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
        const users = await prisma.user.findMany({
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
            
            // NEW: Add billing only field
            isBillingOnly: data.isBillingOnly || false
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
        if (data.isDefaultSignature) {
            await prisma.user.updateMany({
                data: { isDefaultSignature: false }
            });

            const reportSettings = await prisma.reportSettings.findFirst();
            let formattedDesignation = data.designation || '';
            if (data.degree) formattedDesignation += formattedDesignation ? ` | ${data.degree}` : data.degree;
            if (data.regNumber) formattedDesignation += formattedDesignation ? ` | ${data.regNumber}` : data.regNumber;

            const reportDataToSync = {
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
// --- app/actions/authorizations.ts Block Close ---