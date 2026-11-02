"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/server-auth";
import { GlobalSyncItemType, Prisma } from "@prisma/client";

const SUPER_ADMIN_ORG_ID = 1;

function requireSuperAdmin(orgId: number) {
  if (orgId !== SUPER_ADMIN_ORG_ID) {
    throw new Error("UNAUTHORIZED: Super Admin access is required.");
  }
}

// Fetch Central Tests for Central Formats Editor Panel
export async function getCentralTestsForFormats() {
  try {
    const { orgId } = await requireAuth();
    requireSuperAdmin(orgId);

    const records = await prisma.globalTest.findMany({
      orderBy: { name: "asc" },
      include: {
        parameters: {
          select: { id: true, name: true, code: true },
        },
        formats: {
          select: { id: true, name: true, version: true, isActive: true },
        },
      },
    });

    const data = records.map((t) => {
      const payload =
        t.payload && typeof t.payload === "object" && !Array.isArray(t.payload)
          ? (t.payload as Record<string, any>)
          : {};

      const formatParams = Array.isArray(payload.parameters) ? payload.parameters : [];

      const isConfigured =
        (payload.template && payload.template !== "Default") ||
        payload.printNextPage === true ||
        (payload.reportTitle && payload.reportTitle.trim() !== "") ||
        formatParams.length > 0 ||
        t.parameters.length > 0 ||
        t.formats.length > 0;

      return {
        id: t.id,
        code: t.code,
        name: t.name,
        displayName: payload.displayName || t.name,
        department: payload.departmentName || payload.department || t.category || "General",
        template: payload.template || "Default",
        reportTitle: payload.reportTitle || "",
        printNextPage: payload.printNextPage === true,
        billingOnly: payload.billingOnly === true,
        isCulture: payload.isCulture === true,
        cultureColumns: payload.cultureColumns || null,
        isConfigured,
        parametersCount: formatParams.length > 0 ? formatParams.length : t.parameters.length,
        formatsCount: t.formats.length,
        parameters: formatParams,
        formats: t.formats,
        payload,
      };
    });

    return { success: true, data };
  } catch (error: any) {
    console.error("Get Central Tests For Formats Error:", error);
    return { success: false, message: error?.message || "Failed to load tests for formats.", data: [] };
  }
}

// Fetch single Central Test full format details
export async function getCentralTestFormatDetails(testId: string) {
  try {
    const { orgId } = await requireAuth();
    requireSuperAdmin(orgId);

    const test = await prisma.globalTest.findUnique({
      where: { id: testId },
      include: {
        parameters: true,
        formats: {
          orderBy: { version: "desc" },
        },
      },
    });

    if (!test) return { success: false, message: "Central test not found." };

    const payload =
      test.payload && typeof test.payload === "object" && !Array.isArray(test.payload)
        ? (test.payload as Record<string, any>)
        : {};

    const [allParams, specimens, departments] = await Promise.all([
      prisma.globalParameter.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: {
          id: true,
          code: true,
          name: true,
          unit: true,
          inputType: true,
          globalTestId: true,
          payload: true,
        },
      }),
      prisma.specimen.findMany({
        where: { organizationId: SUPER_ADMIN_ORG_ID, isActive: true },
        orderBy: { name: "asc" },
      }),
      prisma.department.findMany({
        where: { organizationId: SUPER_ADMIN_ORG_ID, isActive: true },
        orderBy: { name: "asc" },
      }),
    ]);

    const formattedParams = allParams.map((p) => {
      const pPayload =
        p.payload && typeof p.payload === "object" && !Array.isArray(p.payload)
          ? (p.payload as Record<string, any>)
          : {};
      return {
        id: p.id,
        code: p.code || pPayload.code || "",
        name: p.name,
        displayName: pPayload.displayName || p.name,
        unit: p.unit || pPayload.unit || "",
        method: pPayload.method || "",
        inputType: p.inputType || pPayload.inputType || "Numerical",
        normalRange: pPayload.ranges?.[0]?.normalRange || "",
        ranges: pPayload.ranges || [],
      };
    });

    return {
      success: true,
      data: {
        test: {
          id: test.id,
          code: test.code,
          name: test.name,
          displayName: payload.displayName || test.name,
          department: payload.departmentName || payload.department || test.category || "",
          template: payload.template || "Default",
          reportTitle: payload.reportTitle || "",
          resultType: payload.resultType || "Parameter",
          printNextPage: payload.printNextPage === true,
          billingOnly: payload.billingOnly === true,
          isCulture: payload.isCulture === true,
          cultureColumns: payload.cultureColumns || null,
          instructions: payload.instructions || "",
          interpretation: payload.interpretation || "",
          parameters: Array.isArray(payload.parameters) ? payload.parameters : [],
          formats: test.formats,
        },
        availableParams: formattedParams,
        specimens,
        departments,
      },
    };
  } catch (error: any) {
    console.error("Get Central Test Format Details Error:", error);
    return { success: false, message: error?.message || "Failed to load format details." };
  }
}

// Save Central Test Format Configuration
export async function saveCentralTestFormat(testId: string, formatData: any) {
  try {
    const { orgId } = await requireAuth();
    requireSuperAdmin(orgId);

    const existing = await prisma.globalTest.findUnique({ where: { id: testId } });
    if (!existing) return { success: false, message: "Central test not found." };

    const existingPayload =
      existing.payload && typeof existing.payload === "object" && !Array.isArray(existing.payload)
        ? (existing.payload as Record<string, any>)
        : {};

    const updatedPayload = {
      ...existingPayload,
      resultType: formatData.resultType || existingPayload.resultType || "Parameter",
      template: formatData.template || "Default",
      reportTitle: formatData.reportTitle || "",
      printNextPage: formatData.printNextPage === true,
      billingOnly: formatData.billingOnly === true,
      isCulture: formatData.isCulture === true,
      cultureColumns: formatData.cultureColumns || null,
      instructions: formatData.instructions || existingPayload.instructions || "",
      interpretation: formatData.interpretation || existingPayload.interpretation || "",
      showTestNameOnReport: formatData.showTestNameOnReport === true,
      parameters: Array.isArray(formatData.parameters) ? formatData.parameters : [],
    };

    const updatedTest = await prisma.globalTest.update({
      where: { id: testId },
      data: {
        payload: updatedPayload,
      },
    });

    // Also update or create the Default format in GlobalFormat
    const defaultFormat = await prisma.globalFormat.findFirst({
      where: { globalTestId: testId, name: "Default Format" },
    });

    if (defaultFormat) {
      await prisma.globalFormat.update({
        where: { id: defaultFormat.id },
        data: {
          payload: {
            template: updatedPayload.template,
            reportTitle: updatedPayload.reportTitle,
            parameters: updatedPayload.parameters,
            resultType: updatedPayload.resultType,
            printNextPage: updatedPayload.printNextPage,
            billingOnly: updatedPayload.billingOnly,
            isCulture: updatedPayload.isCulture,
            cultureColumns: updatedPayload.cultureColumns,
          },
        },
      });
    } else {
      await prisma.globalFormat.create({
        data: {
          name: "Default Format",
          globalTestId: testId,
          version: 1,
          payload: {
            template: updatedPayload.template,
            reportTitle: updatedPayload.reportTitle,
            parameters: updatedPayload.parameters,
            resultType: updatedPayload.resultType,
            printNextPage: updatedPayload.printNextPage,
            billingOnly: updatedPayload.billingOnly,
            isCulture: updatedPayload.isCulture,
            cultureColumns: updatedPayload.cultureColumns,
          },
        },
      });
    }

    await prisma.globalSyncLog.create({
      data: {
        organizationId: SUPER_ADMIN_ORG_ID,
        action: "CENTRAL_FORMAT_UPDATED",
        itemType: GlobalSyncItemType.Format,
        details: { id: testId, name: existing.name, code: existing.code },
      },
    });

    revalidatePath("/super-admin/central-library");
    revalidatePath("/super-admin/central-library/formats");
    return { success: true, data: updatedTest };
  } catch (error: any) {
    console.error("Save Central Test Format Error:", error);
    return { success: false, message: error?.message || "Failed to save central test format." };
  }
}

// Create Central Format Version (Save as Library Format)
export async function createCentralFormatVersion(testId: string, name: string, data: any) {
  try {
    const { orgId } = await requireAuth();
    requireSuperAdmin(orgId);

    const formatName = (name || "").trim();
    if (!testId || !formatName) {
      return { success: false, message: "Valid central test and format name are required." };
    }

    const test = await prisma.globalTest.findUnique({ where: { id: testId } });
    if (!test) return { success: false, message: "Central test not found." };

    const previous = await prisma.globalFormat.findFirst({
      where: { globalTestId: testId, name: formatName },
      orderBy: { version: "desc" },
      select: { version: true },
    });

    const nextVersion = (previous?.version ?? 0) + 1;

    const newFormat = await prisma.globalFormat.create({
      data: {
        name: formatName,
        globalTestId: testId,
        version: nextVersion,
        payload: JSON.parse(JSON.stringify(data)) as Prisma.InputJsonValue,
        isActive: true,
      },
    });

    await prisma.globalSyncLog.create({
      data: {
        organizationId: SUPER_ADMIN_ORG_ID,
        action: "CENTRAL_FORMAT_VERSION_CREATED",
        itemType: GlobalSyncItemType.Format,
        details: { id: newFormat.id, name: formatName, version: nextVersion, testId },
      },
    });

    revalidatePath("/super-admin/central-library");
    revalidatePath("/super-admin/central-library/formats");
    return { success: true, data: newFormat };
  } catch (error: any) {
    console.error("Create Central Format Version Error:", error);
    return { success: false, message: error?.message || "Failed to create format version." };
  }
}

// Get single Central Format by ID
export async function getCentralFormatById(id: string) {
  try {
    const { orgId } = await requireAuth();
    requireSuperAdmin(orgId);

    const record = await prisma.globalFormat.findUnique({
      where: { id },
      include: {
        globalTest: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    if (!record) return { success: false, message: "Central format not found." };
    return { success: true, data: record };
  } catch (error: any) {
    console.error("Get Central Format By ID Error:", error);
    return { success: false, message: error?.message || "Failed to load format." };
  }
}

// Delete Central Format
export async function deleteCentralFormat(id: string) {
  try {
    const { orgId } = await requireAuth();
    requireSuperAdmin(orgId);

    const existing = await prisma.globalFormat.findUnique({ where: { id } });
    if (!existing) return { success: false, message: "Central format not found." };

    await prisma.globalFormat.delete({ where: { id } });

    await prisma.globalSyncLog.create({
      data: {
        organizationId: SUPER_ADMIN_ORG_ID,
        action: "CENTRAL_FORMAT_DELETED",
        itemType: GlobalSyncItemType.Format,
        details: { id, name: existing.name },
      },
    });

    revalidatePath("/super-admin/central-library");
    revalidatePath("/super-admin/central-library/formats");
    return { success: true };
  } catch (error: any) {
    console.error("Delete Central Format Error:", error);
    return { success: false, message: error?.message || "Failed to delete central format." };
  }
}

// Pull Format Data from Connected Labs / Organization Masters into Central Format Library
export async function pullCentralFormatsData(userId?: string | number) {
  try {
    const { orgId } = await requireAuth();
    requireSuperAdmin(orgId);

    // 1. Fetch source tests that have format configuration
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

    // 1. Fetch source tests that have format configuration (filtered by targetOrgId if selected)
    const sourceTests = await prisma.test.findMany({
      where: {
        ...(targetOrgId !== null ? { organizationId: targetOrgId } : {}),
        OR: [
          { template: { not: "Default" } },
          { printNextPage: true },
          { reportTitle: { not: null } },
          { parameters: { some: {} } },
        ],
      },
      include: {
        parameters: {
          include: {
            parameter: true,
          },
          orderBy: { order: "asc" },
        },
      },
    });

    let pulledCount = 0;

    for (const sourceTest of sourceTests) {
      // Find matching GlobalTest by code or name
      const matchingGlobalTest = await prisma.globalTest.findFirst({
        where: {
          OR: [
            { code: sourceTest.code },
            { name: sourceTest.name },
          ],
        },
      });

      if (!matchingGlobalTest) continue;

      const currentPayload =
        matchingGlobalTest.payload &&
        typeof matchingGlobalTest.payload === "object" &&
        !Array.isArray(matchingGlobalTest.payload)
          ? (matchingGlobalTest.payload as Record<string, any>)
          : {};

      // If format is already configured on this GlobalTest, skip to avoid overwriting super admin customizations
      const existingParams = Array.isArray(currentPayload.parameters) ? currentPayload.parameters : [];
      if (existingParams.length > 0 && currentPayload.template && currentPayload.template !== "Default") {
        continue;
      }

      const formatParams = sourceTest.parameters.map((tp, idx) => ({
        id: tp.parameter?.id?.toString() || `param-${idx + 1}`,
        name: tp.isHeading ? tp.headingText || "Heading" : tp.parameter?.name || "Parameter",
        code: tp.parameter?.code || "",
        unit: tp.parameter?.unit || "",
        order: tp.order || idx + 1,
        isHeading: tp.isHeading === true,
        headingText: tp.headingText || "",
        isCultureField: tp.isCultureField === true,
        isActive: tp.isActive !== false,
        formula: tp.formula || null,
        isCountDependent: tp.isCountDependent === true,
      }));

      const updatedPayload = {
        ...currentPayload,
        resultType: sourceTest.resultType || "Parameter",
        template: sourceTest.template || "Default",
        printNextPage: sourceTest.printNextPage === true,
        billingOnly: sourceTest.billingOnly === true,
        reportTitle: sourceTest.reportTitle || "",
        colCaption1: sourceTest.colCaption1 || "Test Parameter",
        colCaption2: sourceTest.colCaption2 || "Value",
        colCaption3: sourceTest.colCaption3 || "Unit",
        colCaption4: sourceTest.colCaption4 || "Reference Interval",
        colCaption5: sourceTest.colCaption5 || "",
        labEquiName: sourceTest.labEquiName || "",
        isFormulaNeeded: sourceTest.isFormulaNeeded === true,
        isCountNeeded: sourceTest.isCountNeeded === true,
        targetCount: sourceTest.targetCount || 0,
        isInterpretationNeeded: sourceTest.isInterpretationNeeded === true,
        interpretation: sourceTest.interpretation || "",
        cultureColumns: sourceTest.cultureColumns || null,
        parameters: formatParams,
      };

      await prisma.globalTest.update({
        where: { id: matchingGlobalTest.id },
        data: { payload: updatedPayload },
      });

      // Upsert default GlobalFormat
      const formatName = sourceTest.template || `${matchingGlobalTest.name} Format`;
      const existingFormat = await prisma.globalFormat.findFirst({
        where: { globalTestId: matchingGlobalTest.id, name: formatName, version: 1 },
      });

      if (!existingFormat) {
        await prisma.globalFormat.create({
          data: {
            name: formatName,
            globalTestId: matchingGlobalTest.id,
            version: 1,
            payload: updatedPayload,
            isActive: true,
          },
        });
      }

      pulledCount++;
    }

    await prisma.globalSyncLog.create({
      data: {
        organizationId: SUPER_ADMIN_ORG_ID,
        action: "CENTRAL_FORMATS_DATA_PULL",
        itemType: GlobalSyncItemType.Format,
        details: { pulledCount, totalScanned: sourceTests.length, targetOrgId, userId },
      },
    });

    revalidatePath("/super-admin/central-library");
    revalidatePath("/super-admin/central-library/formats");

    const targetLabel = selectedUsername ? `user account "${selectedUsername}"` : "connected laboratories";

    if (pulledCount === 0) {
      return {
        success: true,
        count: 0,
        message: `Central Formats Library is already up to date with ${targetLabel}. No new formats to pull.`,
      };
    }

    return {
      success: true,
      count: pulledCount,
      message: `Successfully pulled ${pulledCount} format configuration${pulledCount === 1 ? "" : "s"} from ${targetLabel}!`,
    };
  } catch (error: any) {
    console.error("Pull Central Formats Data Error:", error);
    return {
      success: false,
      message: error?.message || "Failed to pull format data.",
    };
  }
}

