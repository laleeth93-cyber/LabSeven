"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/server-auth";

const SUPER_ADMIN_ORG_ID = 1;

function requireSuperAdmin(orgId: number) {
  if (orgId !== SUPER_ADMIN_ORG_ID) {
    throw new Error("UNAUTHORIZED: Super Admin access is required.");
  }
}

// Generate next code for Central Department (DEP-0001, DEP-0002, etc.)
export async function generateCentralDepartmentCode() {
  try {
    const { orgId } = await requireAuth();
    requireSuperAdmin(orgId);

    const allDepts = await prisma.department.findMany({
      where: { organizationId: SUPER_ADMIN_ORG_ID },
      select: { code: true },
    });

    let maxNum = 0;
    allDepts.forEach((d) => {
      const match = d.code.match(/DEP-(\d+)/);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });

    return `DEP-${(maxNum + 1).toString().padStart(4, "0")}`;
  } catch (error) {
    return "DEP-0001";
  }
}

// Get all Central Departments
export async function getCentralDepartments() {
  try {
    const { orgId } = await requireAuth();
    requireSuperAdmin(orgId);

    const data = await prisma.department.findMany({
      where: { organizationId: SUPER_ADMIN_ORG_ID },
      orderBy: { name: "asc" },
    });
    return { success: true, data };
  } catch (error: any) {
    console.error("Get Central Departments Error:", error);
    return { success: false, message: error?.message || "Failed to load departments.", data: [] };
  }
}

// Get single Central Department by ID
export async function getCentralDepartmentById(id: number) {
  try {
    const { orgId } = await requireAuth();
    requireSuperAdmin(orgId);

    const data = await prisma.department.findFirst({
      where: { id, organizationId: SUPER_ADMIN_ORG_ID },
    });
    if (!data) return { success: false, message: "Department not found." };
    return { success: true, data };
  } catch (error: any) {
    console.error("Get Central Department By ID Error:", error);
    return { success: false, message: error?.message || "Failed to load department." };
  }
}

// Save (Create or Update) Central Department
export async function saveCentralDepartment(data: {
  id?: number | null;
  name: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}) {
  try {
    const { orgId } = await requireAuth();
    requireSuperAdmin(orgId);

    const name = (data.name || "").trim();
    if (!name) return { success: false, message: "Department name is required." };

    if (data.id) {
      // Update
      const existing = await prisma.department.findFirst({
        where: { id: data.id, organizationId: SUPER_ADMIN_ORG_ID },
      });
      if (!existing) return { success: false, message: "Department not found." };

      const duplicate = await prisma.department.findFirst({
        where: {
          organizationId: SUPER_ADMIN_ORG_ID,
          name: { equals: name, mode: "insensitive" },
          id: { not: data.id },
        },
      });
      if (duplicate) return { success: false, message: "A department with this name already exists." };

      const updated = await prisma.department.update({
        where: { id: data.id },
        data: {
          name,
          description: data.description || null,
          isActive: data.isActive !== undefined ? data.isActive : existing.isActive,
        },
      });

      await prisma.globalSyncLog.create({
        data: {
          organizationId: SUPER_ADMIN_ORG_ID,
          action: "CENTRAL_DEPARTMENT_UPDATED",
          details: { id: updated.id, name: updated.name, code: updated.code },
        },
      });

      revalidatePath("/super-admin/central-library");
      revalidatePath("/super-admin/central-library/departments");
      return { success: true, data: updated };
    } else {
      // Create
      const duplicate = await prisma.department.findFirst({
        where: {
          organizationId: SUPER_ADMIN_ORG_ID,
          name: { equals: name, mode: "insensitive" },
        },
      });
      if (duplicate) return { success: false, message: "A department with this name already exists." };

      let code = (data.code || "").trim();
      if (!code) code = await generateCentralDepartmentCode();

      const created = await prisma.department.create({
        data: {
          organizationId: SUPER_ADMIN_ORG_ID,
          name,
          code,
          description: data.description || null,
          isActive: data.isActive !== false,
        },
      });

      await prisma.globalSyncLog.create({
        data: {
          organizationId: SUPER_ADMIN_ORG_ID,
          action: "CENTRAL_DEPARTMENT_CREATED",
          details: { id: created.id, name: created.name, code: created.code },
        },
      });

      revalidatePath("/super-admin/central-library");
      revalidatePath("/super-admin/central-library/departments");
      return { success: true, data: created };
    }
  } catch (error: any) {
    console.error("Save Central Department Error:", error);
    return { success: false, message: error?.message || "Failed to save central department." };
  }
}

// Delete Central Department
export async function deleteCentralDepartment(id: number) {
  try {
    const { orgId } = await requireAuth();
    requireSuperAdmin(orgId);

    const existing = await prisma.department.findFirst({
      where: { id, organizationId: SUPER_ADMIN_ORG_ID },
    });
    if (!existing) return { success: false, message: "Department not found." };

    await prisma.department.delete({ where: { id } });

    await prisma.globalSyncLog.create({
      data: {
        organizationId: SUPER_ADMIN_ORG_ID,
        action: "CENTRAL_DEPARTMENT_DELETED",
        details: { id, name: existing.name, code: existing.code },
      },
    });

    revalidatePath("/super-admin/central-library");
    revalidatePath("/super-admin/central-library/departments");
    return { success: true };
  } catch (error: any) {
    console.error("Delete Central Department Error:", error);
    return { success: false, message: error?.message || "Failed to delete department." };
  }
}

// Toggle Central Department Status
export async function toggleCentralDepartmentStatus(id: number, currentStatus: boolean) {
  try {
    const { orgId } = await requireAuth();
    requireSuperAdmin(orgId);

    const updated = await prisma.department.update({
      where: { id },
      data: { isActive: !currentStatus },
    });

    await prisma.globalSyncLog.create({
      data: {
        organizationId: SUPER_ADMIN_ORG_ID,
        action: !currentStatus ? "CENTRAL_DEPARTMENT_ACTIVATED" : "CENTRAL_DEPARTMENT_DEACTIVATED",
        details: { id, isActive: !currentStatus },
      },
    });

    revalidatePath("/super-admin/central-library");
    revalidatePath("/super-admin/central-library/departments");
    return { success: true, isActive: updated.isActive };
  } catch (error: any) {
    console.error("Toggle Central Department Status Error:", error);
    return { success: false, message: error?.message || "Failed to toggle status." };
  }
}

