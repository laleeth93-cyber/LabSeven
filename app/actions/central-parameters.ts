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

function safeFloat(val: any): number | null {
  if (val === "" || val === null || val === undefined) return null;
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
}

function safeInt(val: any, defaultVal = 0): number {
  if (val === "" || val === null || val === undefined) return defaultVal;
  const num = parseInt(val, 10);
  return isNaN(num) ? defaultVal : num;
}

// Generate code for Central Parameters (PAR-0001, PAR-0002, etc.)
export async function generateCentralParameterCode() {
  try {
    const { orgId } = await requireAuth();
    requireSuperAdmin(orgId);

    const allParams = await prisma.globalParameter.findMany({
      select: { code: true },
    });

    let maxNum = 0;
    allParams.forEach((p) => {
      if (p.code) {
        const match = p.code.match(/PAR-(\d+)/);
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      }
    });

    return `PAR-${(maxNum + 1).toString().padStart(4, "0")}`;
  } catch (error) {
    return "PAR-0001";
  }
}

// Fetch all Central Parameters
export async function getCentralParameters() {
  try {
    const { orgId } = await requireAuth();
    requireSuperAdmin(orgId);

    const records = await prisma.globalParameter.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        globalTest: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    const data = records.map((p) => {
      const payload =
        p.payload && typeof p.payload === "object" && !Array.isArray(p.payload)
          ? (p.payload as Record<string, any>)
          : {};

      return {
        id: p.id,
        code: p.code || payload.code || "",
        name: p.name,
        displayName: payload.displayName || p.name,
        unit: p.unit || payload.unit || "",
        inputType: p.inputType || payload.inputType || "Numerical",
        globalTestId: p.globalTestId,
        globalTestName: p.globalTest?.name || null,
        globalTestCode: p.globalTest?.code || null,
        department: payload.department || null,
        method: payload.method || null,
        price: typeof payload.price === "number" ? payload.price : parseFloat(payload.price || "0") || 0,
        decimals: payload.decimals !== undefined ? payload.decimals : 2,
        resultAlignment: payload.resultAlignment || "Beside",
        isMultiValue: payload.isMultiValue === true,
        options: Array.isArray(payload.options) ? payload.options : [],
        lowMessage: payload.lowMessage || "",
        highMessage: payload.highMessage || "",
        panicMessage: payload.panicMessage || "",
        interpretation: payload.interpretation || "",
        reportTitle: payload.reportTitle || "",
        colCaption1: payload.colCaption1 || "",
        colCaption2: payload.colCaption2 || "",
        colCaption3: payload.colCaption3 || "",
        colCaption4: payload.colCaption4 || "",
        colCaption5: payload.colCaption5 || "",
        isFormula: payload.isFormula === true,
        billingOnly: payload.billingOnly === true,
        ranges: Array.isArray(payload.ranges) ? payload.ranges : [],
        isActive: p.isActive,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });

    return { success: true, data };
  } catch (error: any) {
    console.error("Get Central Parameters Error:", error);
    return { success: false, message: error?.message || "Failed to load central parameters.", data: [] };
  }
}

// Fetch single Central Parameter by ID
export async function getCentralParameterById(id: string) {
  try {
    const { orgId } = await requireAuth();
    requireSuperAdmin(orgId);

    const record = await prisma.globalParameter.findUnique({
      where: { id },
      include: {
        globalTest: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    if (!record) return { success: false, message: "Central parameter not found." };

    const payload =
      record.payload && typeof record.payload === "object" && !Array.isArray(record.payload)
        ? (record.payload as Record<string, any>)
        : {};

    const data = {
      id: record.id,
      code: record.code || payload.code || "",
      name: record.name,
      displayName: payload.displayName || record.name,
      unit: record.unit || payload.unit || "",
      inputType: record.inputType || payload.inputType || "Numerical",
      globalTestId: record.globalTestId || "",
      globalTestName: record.globalTest?.name || null,
      globalTestCode: record.globalTest?.code || null,
      department: payload.department || "HEMATOLOGY",
      method: payload.method || "",
      price: payload.price !== undefined ? String(payload.price) : "",
      decimals: payload.decimals !== undefined ? String(payload.decimals) : "2",
      resultAlignment: payload.resultAlignment || "Beside",
      isMultiValue: payload.isMultiValue === true,
      options: Array.isArray(payload.options) ? payload.options : [],
      lowMessage: payload.lowMessage || "",
      highMessage: payload.highMessage || "",
      panicMessage: payload.panicMessage || "",
      interpretation: payload.interpretation || "",
      reportTitle: payload.reportTitle || "",
      colCaption1: payload.colCaption1 || "",
      colCaption2: payload.colCaption2 || "",
      colCaption3: payload.colCaption3 || "",
      colCaption4: payload.colCaption4 || "",
      colCaption5: payload.colCaption5 || "",
      isFormula: payload.isFormula === true,
      billingOnly: payload.billingOnly === true,
      ranges: Array.isArray(payload.ranges) ? payload.ranges : [],
      isActive: record.isActive,
    };

    return { success: true, data };
  } catch (error: any) {
    console.error("Get Central Parameter By ID Error:", error);
    return { success: false, message: error?.message || "Failed to load parameter details." };
  }
}

// Create Central Parameter
export async function createCentralParameter(data: any) {
  try {
    const { orgId } = await requireAuth();
    requireSuperAdmin(orgId);

    const name = (data.name || "").trim();
    if (!name) return { success: false, message: "Parameter name is required." };

    let code = (data.code || "").trim();
    if (!code) code = await generateCentralParameterCode();

    const globalTestId = data.globalTestId && data.globalTestId !== "" ? data.globalTestId : null;

    // Check duplicate name within same test or globally
    const existing = await prisma.globalParameter.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        globalTestId: globalTestId,
      },
    });
    if (existing) {
      return { success: false, message: "A central parameter with this name already exists for this test." };
    }

    const cleanedRanges = (data.ranges || []).map((r: any) => ({
      gender: r.gender || "Both",
      minAge: safeInt(r.minAge, 0),
      maxAge: safeInt(r.maxAge, 100),
      minAgeUnit: r.minAgeUnit || "Years",
      maxAgeUnit: r.maxAgeUnit || "Years",
      normalOperator: r.normalOperator || "Between",
      lowRange: safeFloat(r.lowRange),
      highRange: safeFloat(r.highRange),
      normalRange: r.normalRange || null,
      normalValue: Array.isArray(r.normalValue) ? r.normalValue.join(",") : r.normalValue || null,
      abnormalValue: Array.isArray(r.abnormalValue) ? r.abnormalValue.join(",") : r.abnormalValue || null,
      criticalOperator: r.criticalOperator || "Between",
      criticalLow: safeFloat(r.criticalLow),
      criticalHigh: safeFloat(r.criticalHigh),
      criticalValue: Array.isArray(r.criticalValue) ? r.criticalValue.join(",") : r.criticalValue || null,
    }));

    const payload = {
      code,
      name,
      displayName: data.displayName || null,
      department: data.department || null,
      unit: data.unit || null,
      inputType: data.inputType || "Numerical",
      method: data.method || null,
      decimals: safeInt(data.decimals, 2),
      price: safeFloat(data.price) || 0,
      resultAlignment: data.resultAlignment || "Beside",
      isMultiValue: data.isMultiValue === true,
      options: Array.isArray(data.options) ? data.options : [],
      lowMessage: data.lowMessage || null,
      highMessage: data.highMessage || null,
      panicMessage: data.panicMessage || null,
      interpretation: data.interpretation || null,
      reportTitle: data.reportTitle || null,
      colCaption1: data.colCaption1 || null,
      colCaption2: data.colCaption2 || null,
      colCaption3: data.colCaption3 || null,
      colCaption4: data.colCaption4 || null,
      colCaption5: data.colCaption5 || null,
      isFormula: data.isFormula === true,
      billingOnly: data.billingOnly === true,
      ranges: cleanedRanges,
      isActive: data.isActive !== false,
    };

    const newParam = await prisma.globalParameter.create({
      data: {
        code,
        name,
        unit: data.unit || null,
        inputType: data.inputType || "Numerical",
        globalTestId,
        payload,
        isActive: data.isActive !== false,
      },
    });

    await prisma.globalSyncLog.create({
      data: {
        organizationId: SUPER_ADMIN_ORG_ID,
        action: "CENTRAL_PARAMETER_CREATED",
        itemType: GlobalSyncItemType.Parameter,
        details: { id: newParam.id, code, name },
      },
    });

    revalidatePath("/super-admin/central-library");
    revalidatePath("/super-admin/central-library/parameters");
    return { success: true, data: newParam };
  } catch (error: any) {
    console.error("Create Central Parameter Error:", error);
    return { success: false, message: error?.message || "Failed to create central parameter." };
  }
}

// Update Central Parameter
export async function updateCentralParameter(id: string, data: any) {
  try {
    const { orgId } = await requireAuth();
    requireSuperAdmin(orgId);

    const existing = await prisma.globalParameter.findUnique({ where: { id } });
    if (!existing) return { success: false, message: "Central parameter not found." };

    const name = (data.name || "").trim();
    if (!name) return { success: false, message: "Parameter name is required." };

    const globalTestId = data.globalTestId && data.globalTestId !== "" ? data.globalTestId : null;

    // Check duplicate name
    const duplicate = await prisma.globalParameter.findFirst({
      where: {
        id: { not: id },
        name: { equals: name, mode: "insensitive" },
        globalTestId,
      },
    });
    if (duplicate) {
      return { success: false, message: "Another central parameter with this name exists for this test." };
    }

    const cleanedRanges = (data.ranges || []).map((r: any) => ({
      gender: r.gender || "Both",
      minAge: safeInt(r.minAge, 0),
      maxAge: safeInt(r.maxAge, 100),
      minAgeUnit: r.minAgeUnit || "Years",
      maxAgeUnit: r.maxAgeUnit || "Years",
      normalOperator: r.normalOperator || "Between",
      lowRange: safeFloat(r.lowRange),
      highRange: safeFloat(r.highRange),
      normalRange: r.normalRange || null,
      normalValue: Array.isArray(r.normalValue) ? r.normalValue.join(",") : r.normalValue || null,
      abnormalValue: Array.isArray(r.abnormalValue) ? r.abnormalValue.join(",") : r.abnormalValue || null,
      criticalOperator: r.criticalOperator || "Between",
      criticalLow: safeFloat(r.criticalLow),
      criticalHigh: safeFloat(r.criticalHigh),
      criticalValue: Array.isArray(r.criticalValue) ? r.criticalValue.join(",") : r.criticalValue || null,
    }));

    const code = (data.code || existing.code || "").trim();

    const payload = {
      code,
      name,
      displayName: data.displayName || null,
      department: data.department || null,
      unit: data.unit || null,
      inputType: data.inputType || "Numerical",
      method: data.method || null,
      decimals: safeInt(data.decimals, 2),
      price: safeFloat(data.price) || 0,
      resultAlignment: data.resultAlignment || "Beside",
      isMultiValue: data.isMultiValue === true,
      options: Array.isArray(data.options) ? data.options : [],
      lowMessage: data.lowMessage || null,
      highMessage: data.highMessage || null,
      panicMessage: data.panicMessage || null,
      interpretation: data.interpretation || null,
      reportTitle: data.reportTitle || null,
      colCaption1: data.colCaption1 || null,
      colCaption2: data.colCaption2 || null,
      colCaption3: data.colCaption3 || null,
      colCaption4: data.colCaption4 || null,
      colCaption5: data.colCaption5 || null,
      isFormula: data.isFormula === true,
      billingOnly: data.billingOnly === true,
      ranges: cleanedRanges,
      isActive: data.isActive !== false,
    };

    const updated = await prisma.globalParameter.update({
      where: { id },
      data: {
        code,
        name,
        unit: data.unit || null,
        inputType: data.inputType || "Numerical",
        globalTestId,
        payload,
        isActive: data.isActive !== false,
      },
    });

    await prisma.globalSyncLog.create({
      data: {
        organizationId: SUPER_ADMIN_ORG_ID,
        action: "CENTRAL_PARAMETER_UPDATED",
        itemType: GlobalSyncItemType.Parameter,
        details: { id, code, name },
      },
    });

    revalidatePath("/super-admin/central-library");
    revalidatePath("/super-admin/central-library/parameters");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Update Central Parameter Error:", error);
    return { success: false, message: error?.message || "Failed to update central parameter." };
  }
}

// Delete Central Parameter
export async function deleteCentralParameter(id: string) {
  try {
    const { orgId } = await requireAuth();
    requireSuperAdmin(orgId);

    const existing = await prisma.globalParameter.findUnique({ where: { id } });
    if (!existing) return { success: false, message: "Central parameter not found." };

    await prisma.globalParameter.delete({ where: { id } });

    await prisma.globalSyncLog.create({
      data: {
        organizationId: SUPER_ADMIN_ORG_ID,
        action: "CENTRAL_PARAMETER_DELETED",
        itemType: GlobalSyncItemType.Parameter,
        details: { id, name: existing.name },
      },
    });

    revalidatePath("/super-admin/central-library");
    revalidatePath("/super-admin/central-library/parameters");
    return { success: true };
  } catch (error: any) {
    console.error("Delete Central Parameter Error:", error);
    return { success: false, message: error?.message || "Failed to delete central parameter." };
  }
}

// Toggle Central Parameter Status
export async function toggleCentralParameterStatus(id: string, currentStatus: boolean) {
  try {
    const { orgId } = await requireAuth();
    requireSuperAdmin(orgId);

    const updated = await prisma.globalParameter.update({
      where: { id },
      data: { isActive: !currentStatus },
    });

    await prisma.globalSyncLog.create({
      data: {
        organizationId: SUPER_ADMIN_ORG_ID,
        action: !currentStatus ? "CENTRAL_PARAMETER_ACTIVATED" : "CENTRAL_PARAMETER_DEACTIVATED",
        itemType: GlobalSyncItemType.Parameter,
        details: { id, isActive: !currentStatus },
      },
    });

    revalidatePath("/super-admin/central-library");
    revalidatePath("/super-admin/central-library/parameters");
    return { success: true, isActive: updated.isActive };
  } catch (error: any) {
    console.error("Toggle Central Parameter Status Error:", error);
    return { success: false, message: error?.message || "Failed to toggle status." };
  }
}

// Pull Parameter Data from Connected Labs / Organization Masters into Central Parameter Library
export async function pullCentralParametersData(userId?: string | number) {
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

    // 1. Existing central parameters to prevent duplicates
    const existingGlobalParams = await prisma.globalParameter.findMany({
      select: { code: true, name: true },
    });
    const existingCodes = new Set(
      existingGlobalParams.map((p) => (p.code || "").trim().toUpperCase()).filter(Boolean)
    );
    const existingNames = new Set(
      existingGlobalParams.map((p) => p.name.trim().toLowerCase())
    );

    // 2. Fetch parameters from local/tenant labs including ranges (filtered by targetOrgId if selected)
    const sourceParams = await prisma.parameter.findMany({
      where: targetOrgId !== null ? { organizationId: targetOrgId } : undefined,
      include: {
        ranges: true,
      },
    });

    let pulledCount = 0;
    for (const param of sourceParams) {
      const codeKey = (param.code || "").trim().toUpperCase();
      const nameKey = param.name.trim().toLowerCase();

      if ((codeKey && existingCodes.has(codeKey)) || existingNames.has(nameKey)) {
        continue;
      }

      const paramCode = param.code || (await generateCentralParameterCode());

      const payload = {
        code: paramCode,
        displayName: param.displayName || param.name,
        unit: param.unit || "",
        inputType: param.inputType || "Numerical",
        department: param.department || "HEMATOLOGY",
        method: param.method || null,
        price: param.price || 0,
        decimals: param.decimals ?? 2,
        resultAlignment: param.resultAlignment || "Beside",
        isMultiValue: param.isMultiValue === true,
        options: param.options || [],
        lowMessage: param.lowMessage || "",
        highMessage: param.highMessage || "",
        panicMessage: param.panicMessage || "",
        interpretation: param.interpretation || "",
        reportTitle: param.reportTitle || "",
        colCaption1: param.colCaption1 || "",
        colCaption2: param.colCaption2 || "",
        colCaption3: param.colCaption3 || "",
        colCaption4: param.colCaption4 || "",
        colCaption5: param.colCaption5 || "",
        ranges: param.ranges.map((r) => ({
          gender: r.gender || "Both",
          minAge: r.minAge ?? 0,
          maxAge: r.maxAge ?? 100,
          minAgeUnit: r.minAgeUnit || "Years",
          maxAgeUnit: r.maxAgeUnit || "Years",
          normalOperator: r.normalOperator || "Between",
          lowRange: r.lowRange,
          highRange: r.highRange,
          normalRange: r.normalRange || "",
          normalValue: r.normalValue || "",
          abnormalValue: r.abnormalValue || "",
        })),
      };

      await prisma.globalParameter.create({
        data: {
          code: paramCode,
          name: param.name,
          unit: param.unit || null,
          inputType: param.inputType || "Numerical",
          payload,
          isActive: param.isActive,
        },
      });

      if (paramCode) existingCodes.add(paramCode.toUpperCase());
      existingNames.add(nameKey);
      pulledCount++;
    }

    await prisma.globalSyncLog.create({
      data: {
        organizationId: SUPER_ADMIN_ORG_ID,
        action: "CENTRAL_PARAMETERS_DATA_PULL",
        itemType: GlobalSyncItemType.Parameter,
        details: { pulledCount, totalScanned: sourceParams.length, targetOrgId, userId },
      },
    });

    revalidatePath("/super-admin/central-library");
    revalidatePath("/super-admin/central-library/parameters");

    const targetLabel = selectedUsername ? `user account "${selectedUsername}"` : "connected laboratories";

    if (pulledCount === 0) {
      return {
        success: true,
        count: 0,
        message: `Central Parameter Library is already up to date with ${targetLabel}. No new parameters to pull.`,
      };
    }

    return {
      success: true,
      count: pulledCount,
      message: `Successfully pulled ${pulledCount} parameter${pulledCount === 1 ? "" : "s"} from ${targetLabel}!`,
    };
  } catch (error: any) {
    console.error("Pull Central Parameters Data Error:", error);
    return {
      success: false,
      message: error?.message || "Failed to pull parameter data.",
    };
  }
}

