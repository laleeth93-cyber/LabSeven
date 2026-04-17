// --- BLOCK app/actions/super-admin-users.ts OPEN ---
"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function createSuperAdminUser(data: { name: string, username: string, email: string, password: string }) {
    try {
        // 1. Verify Master Org exists
        let masterOrg = await prisma.organization.findUnique({ where: { id: 1 } });
        if (!masterOrg) return { success: false, message: "Master Org not found." };

        // 2. Get the Super Admin Role
        let adminRole = await prisma.role.findFirst({
            where: { organizationId: 1, name: "Super Administrator" }
        });

        // 3. Check for duplicates
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: data.username },
                    { email: data.email }
                ]
            }
        });

        if (existingUser) {
            return { success: false, message: "Username or Email is already in use." };
        }

        // 4. Secure the password
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // 5. Create the user locked to Organization 1
        await prisma.user.create({
            data: {
                organizationId: 1,
                name: data.name,
                username: data.username,
                email: data.email,
                password: hashedPassword,
                roleId: adminRole?.id,
                isActive: true
            }
        });

        revalidatePath("/super-admin/admins");
        return { success: true, message: "New Super Admin created successfully!" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function toggleAdminStatus(id: number, currentStatus: boolean) {
    try {
        const user = await prisma.user.findUnique({ where: { id } });
        
        // Prevent locking yourself out!
        if (user?.email === "admin@labseven.in") {
            return { success: false, message: "Security risk: Cannot disable the primary System Architect account." };
        }

        await prisma.user.update({
            where: { id },
            data: { isActive: !currentStatus }
        });
        
        revalidatePath("/super-admin/admins");
        return { success: true, message: `Admin account ${!currentStatus ? 'activated' : 'disabled'}.` };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}
// --- BLOCK app/actions/super-admin-users.ts CLOSE ---