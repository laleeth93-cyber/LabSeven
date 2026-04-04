// --- BLOCK app/api/setup-master/route.ts OPEN ---
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    let masterOrg = await prisma.organization.findUnique({ where: { id: 1 } });

    if (!masterOrg) {
        masterOrg = await prisma.organization.create({
            data: {
                name: "Lab Seven Master HQ",
                email: "admin@labseven.in",
                phone: "9999999999",
                address: "System Control Center",
                plan: "SuperAdmin",
                isActive: true,
            }
        });
    }

    let adminRole = await prisma.role.findFirst({
        where: { organizationId: 1, name: "Super Administrator" }
    });

    if (!adminRole) {
        adminRole = await prisma.role.create({
            data: {
                organizationId: 1,
                name: "Super Administrator",
                description: "Complete System Access"
            }
        });
    }

    const superAdminEmail = "admin@labseven.in";
    const hashedPassword = await bcrypt.hash("MasterKey2026!", 10);
    
    const existingAdmin = await prisma.user.findFirst({ where: { email: superAdminEmail } });

    if (existingAdmin) {
        // 🚨 THE FIX: Forcefully update the existing broken account
        await prisma.user.update({
            where: { id: existingAdmin.id },
            data: {
                password: hashedPassword,
                isActive: true, // Force it to be active
                organizationId: 1,
                roleId: adminRole.id
            }
        });
        
        return NextResponse.json({ 
            success: true, 
            message: "⚠️ EXISTING ACCOUNT OVERWRITTEN: Super Admin account has been forcefully updated and activated. You can now log in." 
        });
    }

    // If it truly doesn't exist, create it
    await prisma.user.create({
        data: {
            organizationId: 1,
            name: "System Architect",
            username: "superadmin",
            email: superAdminEmail,
            password: hashedPassword,
            roleId: adminRole.id,
            isActive: true
        }
    });
    
    return NextResponse.json({ 
        success: true, 
        message: "✅ Super Admin created successfully! You can now log in."
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
// --- BLOCK app/api/setup-master/route.ts CLOSE ---