// --- BLOCK app/actions/authorizations.ts OPEN ---
"use server";

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/server-auth'; 
import bcrypt from 'bcryptjs';

export async function getRoles() {
    try {
        const { orgId } = await requireAuth(); 
        const roles = await prisma.role.findMany({
            where: { organizationId: orgId }, 
            orderBy: { name: 'asc' }
        });
        return { success: true, data: roles };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function saveRole(data: { id?: number, name: string, description?: string }) {
    try {
        const { orgId } = await requireAuth(); 
        if (data.id) {
            await prisma.role.updateMany({
                where: { id: data.id, organizationId: orgId },
                data: { name: data.name, description: data.description }
            });
        } else {
            await prisma.role.create({
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
        const { orgId } = await requireAuth(); 
        const users = await prisma.user.findMany({
            where: { organizationId: orgId }, 
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
        const { orgId } = await requireAuth(); 
        
        const cleanEmail = data.email?.trim().toLowerCase() || null;
        const cleanUsername = data.username.trim().toLowerCase();

        if (cleanEmail) {
            const existingEmailUser = await prisma.user.findFirst({
                where: { email: cleanEmail }
            });
            if (existingEmailUser && existingEmailUser.id !== data.id) {
                return { success: false, message: "This Email ID is already registered in the system. Email addresses must be completely unique across all laboratories." };
            }
        }

        const existingUsernameUser = await prisma.user.findFirst({
            where: { username: cleanUsername }
        });
        
        if (existingUsernameUser && existingUsernameUser.id !== data.id) {
            return { success: false, message: "This Username is already taken by another account. Please choose a different username." };
        }

        const payload: any = {
            name: data.name,
            username: cleanUsername,
            email: cleanEmail,
            phone: data.phone?.trim() ? data.phone.trim() : null,
            degree: data.degree,
            roleId: data.roleId ? parseInt(data.roleId) : null,
            isActive: data.isActive,
            allowConcession: data.allowConcession,
            concessionLimit: data.concessionLimit ? parseFloat(data.concessionLimit) : 0,
            isBillingOnly: data.isBillingOnly || false,
            organizationId: orgId 
        };

        if (data.password && data.password.trim() !== '') {
            payload.password = await bcrypt.hash(data.password, 10);
        }

        if (data.id) {
            await prisma.user.updateMany({
                where: { id: data.id, organizationId: orgId },
                data: payload
            });
        } else {
            if (!payload.password) {
                return { success: false, message: "A password is required for new users." };
            }
            await prisma.user.create({
                data: payload
            });
        }
        
        revalidatePath('/authorizations');
        return { success: true, message: "User saved successfully" };
    } catch (error: any) {
        if (error.code === 'P2002') return { success: false, message: "A user with this username or email already exists in the database." };
        return { success: false, message: error.message };
    }
}

export async function toggleUserStatus(id: number, isActive: boolean) {
    try {
        const { orgId } = await requireAuth(); 
        await prisma.user.updateMany({
            where: { id: id, organizationId: orgId },
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
        const { orgId } = await requireAuth(); 
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.updateMany({
            where: { id: id, organizationId: orgId },
            data: { password: hashedPassword }
        });
        revalidatePath('/authorizations');
        return { success: true, message: "Password reset successfully" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function deleteUser(id: number) {
    try {
        const { orgId } = await requireAuth(); 
        await prisma.user.deleteMany({
            where: { id: id, organizationId: orgId }
        });
        revalidatePath('/authorizations');
        return { success: true, message: "User deleted successfully" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function saveUserSignatureDetails(data: any) {
    try {
        const { orgId } = await requireAuth(); 
        
        if (data.isDefaultSignature) {
            await prisma.user.updateMany({
                where: { organizationId: orgId }, 
                data: { isDefaultSignature: false }
            });

            const reportSettings = await prisma.reportSettings.findFirst({
                where: { organizationId: orgId }
            });
            
            let formattedDesignation = data.designation || '';
            if (data.degree) formattedDesignation += formattedDesignation ? ` | ${data.degree}` : data.degree;
            if (data.regNumber) formattedDesignation += formattedDesignation ? ` | ${data.regNumber}` : data.regNumber;

            const reportDataToSync = {
                organizationId: orgId, 
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

        await prisma.user.updateMany({
            where: { id: data.id, organizationId: orgId },
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
        // 🚨 THE FIX: We also fetch the user's role to determine if they are an Admin
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { role: true }
        });

        const userPerms = await prisma.userPermission.findMany({
            where: { userId },
            include: { permission: true }
        });

        return { 
            success: true, 
            data: userPerms.map((up: any) => up.permission),
            roleName: user?.role?.name || ''
        };
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
// --- BLOCK app/actions/authorizations.ts CLOSE ---