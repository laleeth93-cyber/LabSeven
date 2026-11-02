"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/server-auth";
import { GlobalSyncItemType } from "@prisma/client";

const SUPER_ADMIN_ORG_ID = 1;

function requireSuperAdmin(orgId: number) {
  if (orgId !== SUPER_ADMIN_ORG_ID) {
    throw new Error("UNAUTHORIZED: Super Admin access is required.");
  }
}

// Generate code for Central Tests (TST-0001, PKG-0001, etc.)
export async function generateCentralTestCode(type: string = "Test") {
  try {
    const { orgId } = await requireAuth();
    requireSuperAdmin(orgId);

    const prefix = type === "Package" ? "PKG" : "TST";
    const allTests = await prisma.globalTest.findMany({
      select: { code: true },
    });

    let maxNum = 0;
    const regex = new RegExp(`^${prefix}-(\\d+)$`);

    allTests.forEach((t) => {
      const match = t.code.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });

    return `${prefix}-${(maxNum + 1).toString().padStart(4, "0")}`;
  } catch (error) {
    const prefix = type === "Package" ? "PKG" : "TST";
    return `${prefix}-0001`;
  }
}

// Fetch all Central Tests for the Central Test Library page
export async function getCentralTests() {
  try {
    const { orgId } = await requireAuth();
    requireSuperAdmin(orgId);

    const records = await prisma.globalTest.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        parameters: true,
        formats: true,
      },
    });

    const data = records.map((t) => {
      const payload = (t.payload && typeof t.payload === "object" && !Array.isArray(t.payload))
        ? (t.payload as Record<string, any>)
        : {};

      return {
        id: t.id,
        code: t.code,
        name: t.name,
        displayName: payload.displayName || payload.displayTestName || t.name,
        category: t.category || payload.category || payload.departmentName || null,
        department: payload.departmentName || payload.department || t.category || null,
        departmentId: payload.departmentId || null,
        price: typeof payload.price === "number" ? payload.price : parseFloat(payload.price || "0") || 0,
        type: payload.testType || payload.type || t.category || "Test",
        gender: payload.gender || "Both",
        isActive: t.isActive,
        isOutsourced: payload.isOutsourced === true,
        sampleVolume: payload.sampleVolume || null,
        barcodeCopies: payload.barcodeCopies || 1,
        instructions: payload.instructions || "",
        parametersCount: t.parameters.length,
        formatsCount: t.formats.length,
        payload,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      };
    });

    return { success: true, data };
  } catch (error: any) {
    console.error("Get Central Tests Error:", error);
    return { success: false, message: error?.message || "Failed to load central tests.", data: [] };
  }
}

// Fetch single Central Test by ID for Edit page
export async function getCentralTestById(id: string) {
  try {
    const { orgId } = await requireAuth();
    requireSuperAdmin(orgId);

    const record = await prisma.globalTest.findUnique({
      where: { id },
      include: {
        parameters: true,
        formats: true,
      },
    });

    if (!record) return { success: false, message: "Central test not found." };

    const payload = (record.payload && typeof record.payload === "object" && !Array.isArray(record.payload))
      ? (record.payload as Record<string, any>)
      : {};

    const data = {
      id: record.id,
      code: record.code,
      name: record.name,
      displayName: payload.displayName || payload.displayTestName || "",
      testType: payload.testType || payload.type || record.category || "Test",
      type: payload.testType || payload.type || record.category || "Test",
      departmentId: payload.departmentId ? String(payload.departmentId) : "",
      departmentName: payload.departmentName || payload.department || "",
      gender: payload.gender || "Both",
      price: payload.price !== undefined ? String(payload.price) : "0",
      methodId: payload.methodId ? String(payload.methodId) : "",
      specimenId: payload.specimenId ? String(payload.specimenId) : "",
      vacutainerId: payload.vacutainerId ? String(payload.vacutainerId) : "",
      sampleVolume: payload.sampleVolume || "",
      barcodeCopies: payload.barcodeCopies !== undefined ? String(payload.barcodeCopies) : "1",
      minDays: payload.minDays !== undefined ? String(payload.minDays) : "0",
      minHours: payload.minHours !== undefined ? String(payload.minHours) : "0",
      minMinutes: payload.minMinutes !== undefined ? String(payload.minMinutes) : "0",
      maxDays: payload.maxDays !== undefined ? String(payload.maxDays) : "0",
      maxHours: payload.maxHours !== undefined ? String(payload.maxHours) : "0",
      maxMinutes: payload.maxMinutes !== undefined ? String(payload.maxMinutes) : "0",
      instructions: payload.instructions || "",
      lmpRequired: payload.lmpRequired === true,
      idRequired: payload.idRequired === true,
      consentRequired: payload.consentRequired === true,
      billingOnly: payload.billingOnly === true,
      isCulture: payload.isCulture === true,
      isOutsourced: payload.isOutsourced === true,
      outsourceLabId: payload.outsourceLabId ? String(payload.outsourceLabId) : "",
      printNextPage: payload.printNextPage === true,
      showTestNameOnReport: payload.showTestNameOnReport === true,
      isActive: record.isActive,
      payload,
    };

    return { success: true, data };
  } catch (error: any) {
    console.error("Get Central Test By ID Error:", error);
    return { success: false, message: error?.message || "Failed to load test details." };
  }
}

// Fetch clinical dropdown masters from Super Admin Org (Org 1)
export async function getCentralClinicalMasters() {
  try {
    const { orgId } = await requireAuth();
    requireSuperAdmin(orgId);

    const [departments, methods, specimens, vacutainers, outsourceLabs] = await Promise.all([
      prisma.department.findMany({
        where: { organizationId: SUPER_ADMIN_ORG_ID, isActive: true },
        orderBy: { name: "asc" },
      }),
      prisma.method.findMany({
        where: { organizationId: SUPER_ADMIN_ORG_ID, isActive: true },
        orderBy: { name: "asc" },
      }),
      prisma.specimen.findMany({
        where: { organizationId: SUPER_ADMIN_ORG_ID, isActive: true },
        orderBy: { name: "asc" },
      }),
      prisma.vacutainer.findMany({
        where: { organizationId: SUPER_ADMIN_ORG_ID, isActive: true },
        orderBy: { name: "asc" },
      }),
      prisma.doctor.findMany({
        where: { organizationId: SUPER_ADMIN_ORG_ID, type: "Outsource", isActive: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return {
      success: true,
      data: {
        departments,
        methods,
        specimens,
        vacutainers,
        outsourceLabs,
      },
    };
  } catch (error: any) {
    console.error("Get Central Clinical Masters Error:", error);
    return {
      success: false,
      data: {
        departments: [],
        methods: [],
        specimens: [],
        vacutainers: [],
        outsourceLabs: [],
      },
    };
  }
}

// Create Central Test
export async function createCentralTest(formData: any) {
  try {
    const { orgId } = await requireAuth();
    requireSuperAdmin(orgId);

    const actualType = formData.testType || formData.type || "Test";
    const testName = (formData.testName || formData.name || "").trim();
    const code = (formData.code || await generateCentralTestCode(actualType)).trim();

    if (!testName) {
      return { success: false, message: "Test name is required." };
    }
    if (!code) {
      return { success: false, message: "Test code is required." };
    }

    // Check duplicate code
    const existingCode = await prisma.globalTest.findUnique({
      where: { code },
    });
    if (existingCode) {
      return { success: false, message: `Central test with code "${code}" already exists.` };
    }

    // Lookup department name if departmentId provided
    let departmentName = "";
    if (formData.departmentId) {
      const dept = await prisma.department.findFirst({
        where: { id: parseInt(formData.departmentId), organizationId: SUPER_ADMIN_ORG_ID },
        select: { name: true },
      });
      if (dept) departmentName = dept.name;
    }

    const payload = {
      code,
      name: testName,
      displayName: formData.displayTestName || formData.displayName || null,
      type: actualType,
      testType: actualType,
      gender: formData.gender || "Both",
      price: parseFloat(formData.price) || 0,
      departmentId: formData.departmentId ? parseInt(formData.departmentId) : null,
      departmentName: departmentName || null,
      methodId: formData.methodId ? parseInt(formData.methodId) : null,
      specimenId: formData.specimenId ? parseInt(formData.specimenId) : null,
      vacutainerId: formData.vacutainerId ? parseInt(formData.vacutainerId) : null,
      sampleVolume: formData.sampleVolume || null,
      barcodeCopies: formData.barcodeCopies ? parseInt(formData.barcodeCopies) : 1,
      minDays: parseInt(formData.minDays) || 0,
      minHours: parseInt(formData.minHours) || 0,
      minMinutes: parseInt(formData.minMinutes) || 0,
      maxDays: parseInt(formData.maxDays) || 0,
      maxHours: parseInt(formData.maxHours) || 0,
      maxMinutes: parseInt(formData.maxMinutes) || 0,
      instructions: formData.instructions || "",
      lmpRequired: formData.lmpRequired === true,
      idRequired: formData.idRequired === true,
      consentRequired: formData.consentRequired === true,
      billingOnly: formData.billingOnly === true,
      isCulture: formData.isCulture === true,
      cultureColumns: formData.cultureColumns || null,
      showTestNameOnReport: formData.showTestNameOnReport === true,
      isOutsourced: formData.isOutsourced === true,
      outsourceLabId: formData.outsourceLabId ? parseInt(formData.outsourceLabId) : null,
      printNextPage: formData.printNextPage === true,
      isActive: formData.isActive !== false,
    };

    const newCentralTest = await prisma.globalTest.create({
      data: {
        code,
        name: testName,
        category: actualType,
        payload,
        isActive: formData.isActive !== false,
      },
    });

    await prisma.globalSyncLog.create({
      data: {
        organizationId: SUPER_ADMIN_ORG_ID,
        action: "CENTRAL_TEST_CREATED",
        itemType: GlobalSyncItemType.Test,
        details: { id: newCentralTest.id, code, name: testName },
      },
    });

    revalidatePath("/super-admin/central-library");
    revalidatePath("/super-admin/central-library/tests");
    return { success: true, data: newCentralTest };
  } catch (error: any) {
    console.error("Create Central Test Error:", error);
    return { success: false, message: error?.message || "Failed to create central test." };
  }
}

// Update Central Test
export async function updateCentralTest(id: string, formData: any) {
  try {
    const { orgId } = await requireAuth();
    requireSuperAdmin(orgId);

    const existing = await prisma.globalTest.findUnique({ where: { id } });
    if (!existing) return { success: false, message: "Central test not found." };

    const actualType = formData.testType || formData.type || "Test";
    const testName = (formData.testName || formData.name || "").trim();
    const code = (formData.code || existing.code).trim();

    if (!testName) return { success: false, message: "Test name is required." };
    if (!code) return { success: false, message: "Test code is required." };

    // Check duplicate code if code changed
    if (code !== existing.code) {
      const duplicate = await prisma.globalTest.findFirst({
        where: { code, id: { not: id } },
      });
      if (duplicate) return { success: false, message: `Another test with code "${code}" already exists.` };
    }

    // Lookup department name if departmentId provided
    let departmentName = "";
    if (formData.departmentId) {
      const dept = await prisma.department.findFirst({
        where: { id: parseInt(formData.departmentId), organizationId: SUPER_ADMIN_ORG_ID },
        select: { name: true },
      });
      if (dept) departmentName = dept.name;
    }

    const payload = {
      ...(typeof existing.payload === "object" && !Array.isArray(existing.payload) ? existing.payload : {}),
      code,
      name: testName,
      displayName: formData.displayTestName || formData.displayName || null,
      type: actualType,
      testType: actualType,
      gender: formData.gender || "Both",
      price: parseFloat(formData.price) || 0,
      departmentId: formData.departmentId ? parseInt(formData.departmentId) : null,
      departmentName: departmentName || null,
      methodId: formData.methodId ? parseInt(formData.methodId) : null,
      specimenId: formData.specimenId ? parseInt(formData.specimenId) : null,
      vacutainerId: formData.vacutainerId ? parseInt(formData.vacutainerId) : null,
      sampleVolume: formData.sampleVolume || null,
      barcodeCopies: formData.barcodeCopies ? parseInt(formData.barcodeCopies) : 1,
      minDays: parseInt(formData.minDays) || 0,
      minHours: parseInt(formData.minHours) || 0,
      minMinutes: parseInt(formData.minMinutes) || 0,
      maxDays: parseInt(formData.maxDays) || 0,
      maxHours: parseInt(formData.maxHours) || 0,
      maxMinutes: parseInt(formData.maxMinutes) || 0,
      instructions: formData.instructions || "",
      lmpRequired: formData.lmpRequired === true,
      idRequired: formData.idRequired === true,
      consentRequired: formData.consentRequired === true,
      billingOnly: formData.billingOnly === true,
      isCulture: formData.isCulture === true,
      cultureColumns: formData.cultureColumns || null,
      showTestNameOnReport: formData.showTestNameOnReport === true,
      isOutsourced: formData.isOutsourced === true,
      outsourceLabId: formData.outsourceLabId ? parseInt(formData.outsourceLabId) : null,
      printNextPage: formData.printNextPage === true,
      isActive: formData.isActive !== false,
    };

    const updated = await prisma.globalTest.update({
      where: { id },
      data: {
        code,
        name: testName,
        category: actualType,
        payload,
        isActive: formData.isActive !== false,
      },
    });

    await prisma.globalSyncLog.create({
      data: {
        organizationId: SUPER_ADMIN_ORG_ID,
        action: "CENTRAL_TEST_UPDATED",
        itemType: GlobalSyncItemType.Test,
        details: { id, code, name: testName },
      },
    });

    revalidatePath("/super-admin/central-library");
    revalidatePath("/super-admin/central-library/tests");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Update Central Test Error:", error);
    return { success: false, message: error?.message || "Failed to update central test." };
  }
}

// Delete Central Test
export async function deleteCentralTest(id: string) {
  try {
    const { orgId } = await requireAuth();
    requireSuperAdmin(orgId);

    const existing = await prisma.globalTest.findUnique({ where: { id } });
    if (!existing) return { success: false, message: "Central test not found." };

    await prisma.globalTest.delete({
      where: { id },
    });

    await prisma.globalSyncLog.create({
      data: {
        organizationId: SUPER_ADMIN_ORG_ID,
        action: "CENTRAL_TEST_DELETED",
        itemType: GlobalSyncItemType.Test,
        details: { id, code: existing.code, name: existing.name },
      },
    });

    revalidatePath("/super-admin/central-library");
    revalidatePath("/super-admin/central-library/tests");
    return { success: true };
  } catch (error: any) {
    console.error("Delete Central Test Error:", error);
    return { success: false, message: error?.message || "Failed to delete central test." };
  }
}

// Toggle Central Test Status (Active / Inactive)
export async function toggleCentralTestStatus(id: string, currentStatus: boolean) {
  try {
    const { orgId } = await requireAuth();
    requireSuperAdmin(orgId);

    const updated = await prisma.globalTest.update({
      where: { id },
      data: { isActive: !currentStatus },
    });

    await prisma.globalSyncLog.create({
      data: {
        organizationId: SUPER_ADMIN_ORG_ID,
        action: !currentStatus ? "CENTRAL_TEST_ACTIVATED" : "CENTRAL_TEST_DEACTIVATED",
        itemType: GlobalSyncItemType.Test,
        details: { id, isActive: !currentStatus },
      },
    });

    revalidatePath("/super-admin/central-library");
    revalidatePath("/super-admin/central-library/tests");
    return { success: true, isActive: updated.isActive };
  } catch (error: any) {
    console.error("Toggle Central Test Status Error:", error);
    return { success: false, message: error?.message || "Failed to toggle status." };
  }
}

// Fetch active user accounts with organization info for the Data Pull selector
export async function getPullableUserAccounts() {
  try {
    const { orgId } = await requireAuth();
    requireSuperAdmin(orgId);

    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        username: true,
        name: true,
        organizationId: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { username: "asc" },
    });

    return {
      success: true,
      data: users.map((u) => ({
        id: u.id,
        username: u.username,
        name: u.name,
        organizationId: u.organizationId,
        orgName: u.organization?.name || `Lab #${u.organizationId}`,
      })),
    };
  } catch (error: any) {
    console.error("Get Pullable User Accounts Error:", error);
    return { success: false, data: [] };
  }
}

// Pull Test Data from Connected Labs / Organization Masters into Central Test Library
export async function pullCentralTestsData(userId?: string | number) {
  try {
    const { orgId } = await requireAuth();
    requireSuperAdmin(orgId);

    let targetOrgId: number | null = null;
    let selectedUsername = "";

    if (userId && userId !== "ALL") {
      const selectedUser = await prisma.user.findUnique({
        where: { id: typeof userId === "string" ? parseInt(userId, 10) : userId },
        select: { organizationId: true, username: true, name: true, organization: { select: { name: true } } },
      });
      if (selectedUser) {
        targetOrgId = selectedUser.organizationId;
        selectedUsername = `${selectedUser.username} (${selectedUser.organization?.name || selectedUser.name})`;
      }
    }

    // 1. Fetch existing central tests to check codes & names
    const existingGlobalTests = await prisma.globalTest.findMany({
      select: { code: true, name: true },
    });
    const existingCodes = new Set(existingGlobalTests.map((t) => t.code.trim().toUpperCase()));
    const existingNames = new Set(existingGlobalTests.map((t) => t.name.trim().toLowerCase()));

    // 2. Fetch tests from laboratories (filtered by targetOrgId if selected)
    const sourceTests = await prisma.test.findMany({
      where: targetOrgId !== null ? { organizationId: targetOrgId } : undefined,
      include: {
        department: true,
        parameters: { orderBy: { order: "asc" } },
      },
    });

    let pulledCount = 0;
    for (const test of sourceTests) {
      const codeKey = test.code.trim().toUpperCase();
      const nameKey = test.name.trim().toLowerCase();

      // Skip if already in Central Library
      if (existingCodes.has(codeKey) || existingNames.has(nameKey)) {
        continue;
      }

      const testPayload = {
        displayName: test.displayName || test.name,
        departmentName: test.department?.name || null,
        departmentId: test.departmentId || null,
        price: test.price,
        type: test.type || "Test",
        testType: test.type || "Test",
        gender: test.gender || "Both",
        isOutsourced: test.isOutsourced === true,
        sampleVolume: test.sampleVolume || "",
        barcodeCopies: test.barcodeCopies || 1,
        instructions: test.instructions || "",
        billingOnly: test.billingOnly === true,
        printNextPage: test.printNextPage === true,
      };

      await prisma.globalTest.create({
        data: {
          code: test.code,
          name: test.name,
          category: test.department?.name || null,
          payload: testPayload,
          isActive: test.isActive,
        },
      });

      existingCodes.add(codeKey);
      existingNames.add(nameKey);
      pulledCount++;
    }

    await prisma.globalSyncLog.create({
      data: {
        organizationId: SUPER_ADMIN_ORG_ID,
        action: "CENTRAL_TESTS_DATA_PULL",
        itemType: GlobalSyncItemType.Test,
        details: { pulledCount, totalScanned: sourceTests.length, targetOrgId, userId },
      },
    });

    revalidatePath("/super-admin/central-library");
    revalidatePath("/super-admin/central-library/tests");

    const targetLabel = selectedUsername ? `user account "${selectedUsername}"` : "connected laboratories";

    if (pulledCount === 0) {
      return {
        success: true,
        count: 0,
        message: `Central Test Library is already up to date with ${targetLabel}. No new tests to pull.`,
      };
    }

    return {
      success: true,
      count: pulledCount,
      message: `Successfully pulled ${pulledCount} test${pulledCount === 1 ? "" : "s"} from ${targetLabel}!`,
    };
  } catch (error: any) {
    console.error("Pull Central Tests Data Error:", error);
    return {
      success: false,
      message: error?.message || "Failed to pull test data.",
    };
  }
}
