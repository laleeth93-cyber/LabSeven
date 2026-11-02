"use server";

import { GlobalSyncItemType, GlobalSyncStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server-auth";

const SUPER_ADMIN_ORG_ID = 1;
type ItemType = GlobalSyncItemType;
type JsonRecord = Record<string, unknown>;

function asRecord(value: Prisma.JsonValue): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as JsonRecord
    : {};
}

function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function getText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function requireSuperAdmin(orgId: number) {
  if (orgId !== SUPER_ADMIN_ORG_ID) {
    throw new Error("UNAUTHORIZED: Super Admin access is required.");
  }
}

async function writeAudit(
  tx: Prisma.TransactionClient,
  action: string,
  itemType?: ItemType,
  submissionId?: string,
  details?: unknown
) {
  await tx.globalSyncLog.create({
    data: {
      organizationId: SUPER_ADMIN_ORG_ID,
      action,
      itemType,
      submissionId,
      details: details === undefined ? undefined : asJson(details),
    },
  });
}

function testSnapshot(test: {
  code: string; name: string; displayName: string | null; type: string; gender: string | null;
  description: string | null; sampleVolume: string | null; barcodeCopies: number | null;
  minDays: number | null; minHours: number | null; minMinutes: number | null;
  maxDays: number | null; maxHours: number | null; maxMinutes: number | null;
  resultType: string | null; template: string | null; instructions: string | null;
  isInterpretationNeeded: boolean; interpretation: string | null; reportTitle: string | null;
  colCaption1: string | null; colCaption2: string | null; colCaption3: string | null;
  colCaption4: string | null; colCaption5: string | null; labEquiName: string | null;
  isFormulaNeeded: boolean; isCountNeeded: boolean; targetCount: number | null;
  lmpRequired: boolean; idRequired: boolean; consentRequired: boolean;
  printNextPage: boolean; billingOnly: boolean; isCulture: boolean; cultureColumns: string | null;
  isConfigured: boolean; isActive: boolean; normalRange: string | null; units: string | null;
  showTestNameOnReport: boolean;
}) {
  return {
    code: test.code,
    name: test.name,
    displayName: test.displayName,
    type: test.type,
    gender: test.gender,
    description: test.description,
    sampleVolume: test.sampleVolume,
    barcodeCopies: test.barcodeCopies,
    minDays: test.minDays,
    minHours: test.minHours,
    minMinutes: test.minMinutes,
    maxDays: test.maxDays,
    maxHours: test.maxHours,
    maxMinutes: test.maxMinutes,
    resultType: test.resultType,
    template: test.template,
    instructions: test.instructions,
    isInterpretationNeeded: test.isInterpretationNeeded,
    interpretation: test.interpretation,
    reportTitle: test.reportTitle,
    colCaption1: test.colCaption1,
    colCaption2: test.colCaption2,
    colCaption3: test.colCaption3,
    colCaption4: test.colCaption4,
    colCaption5: test.colCaption5,
    labEquiName: test.labEquiName,
    isFormulaNeeded: test.isFormulaNeeded,
    isCountNeeded: test.isCountNeeded,
    targetCount: test.targetCount,
    lmpRequired: test.lmpRequired,
    idRequired: test.idRequired,
    consentRequired: test.consentRequired,
    printNextPage: test.printNextPage,
    billingOnly: test.billingOnly,
    isCulture: test.isCulture,
    cultureColumns: test.cultureColumns,
    isConfigured: test.isConfigured,
    isActive: test.isActive,
    normalRange: test.normalRange,
    units: test.units,
    showTestNameOnReport: test.showTestNameOnReport,
  };
}

async function duplicateWarning(
  itemType: ItemType,
  name: string,
  code: string | null,
  sourceOrganizationId: number,
  sourceRecordId: number
) {
  const matches: string[] = [];
  if (itemType === GlobalSyncItemType.Test) {
    const match = await prisma.globalTest.findFirst({
      where: {
        OR: [
          ...(code ? [{ code }] : []),
          { name: { equals: name, mode: "insensitive" } },
        ],
      },
      select: { id: true },
    });
    if (match) matches.push("A central test has a matching code or name.");
  } else if (itemType === GlobalSyncItemType.Parameter) {
    const match = await prisma.globalParameter.findFirst({
      where: {
        OR: [
          ...(code ? [{ code }] : []),
          { name: { equals: name, mode: "insensitive" } },
        ],
      },
      select: { id: true },
    });
    if (match) matches.push("A central parameter has a matching code or name.");
  } else {
    const match = await prisma.globalFormat.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
      select: { id: true },
    });
    if (match) matches.push("A central format has a matching name.");
  }
  const otherSubmissions = await prisma.globalSyncSubmission.findMany({
    where: {
      itemType,
      status: { in: [GlobalSyncStatus.PendingReview, GlobalSyncStatus.Approved, GlobalSyncStatus.Published] },
      NOT: { sourceOrganizationId, sourceRecordId },
    },
    select: { name: true, payload: true },
    take: 500,
  });
  const queueDuplicate = otherSubmissions.some((item) => {
    const queuedCode = getText(asRecord(item.payload).code);
    return item.name.toLocaleLowerCase() === name.toLocaleLowerCase() || Boolean(code && queuedCode === code);
  });
  if (queueDuplicate) matches.push("A matching item is already present in the review queue.");
  return matches.length ? matches.join(" ") : null;
}

async function queueNewSubmission(input: {
  sourceOrganizationId: number;
  itemType: ItemType;
  sourceRecordId: number;
  sourceParentTestId?: number | null;
  targetGlobalTestId?: string | null;
  name: string;
  code?: string | null;
  payload: unknown;
  sourceCreatedAt: Date;
}) {
  const existing = await prisma.globalSyncSubmission.findUnique({
    where: {
      sourceOrganizationId_itemType_sourceRecordId: {
        sourceOrganizationId: input.sourceOrganizationId,
        itemType: input.itemType,
        sourceRecordId: input.sourceRecordId,
      },
    },
    select: { id: true, status: true },
  });
  if (existing && existing.status !== GlobalSyncStatus.PendingReview) return false;

  const warning = await duplicateWarning(
    input.itemType,
    input.name,
    input.code ?? null,
    input.sourceOrganizationId,
    input.sourceRecordId
  );
  if (existing) {
    await prisma.globalSyncSubmission.update({
      where: { id: existing.id },
      data: {
        sourceParentTestId: input.sourceParentTestId,
        targetGlobalTestId: input.targetGlobalTestId,
        name: input.name,
        payload: asJson(input.payload),
        duplicateWarning: warning,
        sourceCreatedAt: input.sourceCreatedAt,
      },
    });
  } else {
    await prisma.globalSyncSubmission.create({
      data: {
        sourceOrganizationId: input.sourceOrganizationId,
        itemType: input.itemType,
        sourceRecordId: input.sourceRecordId,
        sourceParentTestId: input.sourceParentTestId,
        targetGlobalTestId: input.targetGlobalTestId,
        name: input.name,
        payload: asJson(input.payload),
        duplicateWarning: warning,
        sourceCreatedAt: input.sourceCreatedAt,
      },
    });
  }
  return true;
}

export async function pullGlobalLibrary() {
  try {
    const { orgId } = await requireAuth();
    requireSuperAdmin(orgId);
    const config = await prisma.globalSyncConfig.findUnique({ where: { id: 1 } });
    if (!config) throw new Error("Global Sync is not initialized. Apply the central library migration first.");

    const labs = await prisma.organization.findMany({
      where: { id: { not: SUPER_ADMIN_ORG_ID } },
      select: { id: true },
    });
    let collected = 0;
    for (const lab of labs) {
      const tests = await prisma.test.findMany({
        where: {
          organizationId: lab.id,
          globalTestId: null,
          createdAt: { gte: config.newRecordsSince },
        },
        include: {
          parameters: { orderBy: { order: "asc" } },
          packageTests: true,
        },
      });
      for (const test of tests) {
        const payload = {
          ...testSnapshot(test),
          linkedSourceParameterIds: test.parameters
            .map((entry) => entry.parameterId)
            .filter((id): id is number => id !== null),
          packageSourceTestIds: test.packageTests.map((entry) => entry.testId),
        };
        if (await queueNewSubmission({
          sourceOrganizationId: lab.id,
          itemType: GlobalSyncItemType.Test,
          sourceRecordId: test.id,
          name: test.name,
          code: test.code,
          payload,
          sourceCreatedAt: test.createdAt,
        })) collected++;
      }

      const parameters = await prisma.parameter.findMany({
        where: {
          organizationId: lab.id,
          globalParameterId: null,
          createdAt: { gte: config.newRecordsSince },
        },
        include: { ranges: true },
      });
      for (const parameter of parameters) {
        const parent = await prisma.testParameter.findFirst({
          where: { parameterId: parameter.id, organizationId: lab.id },
          select: {
            testId: true,
            order: true,
            isHeading: true,
            headingText: true,
            isCultureField: true,
            isActive: true,
            formula: true,
            isCountDependent: true,
          },
          orderBy: { testId: "asc" },
        });
        const parentTest = parent ? await prisma.test.findFirst({
          where: { id: parent.testId, organizationId: lab.id },
          select: { globalTestId: true },
        }) : null;
        const { id, organizationId, globalParameterId, createdAt, updatedAt, ranges, ...fields } = parameter;
        if (await queueNewSubmission({
          sourceOrganizationId: lab.id,
          itemType: GlobalSyncItemType.Parameter,
          sourceRecordId: parameter.id,
          sourceParentTestId: parent?.testId,
          targetGlobalTestId: parentTest?.globalTestId,
          name: parameter.name,
          code: parameter.code,
          payload: { ...fields, ranges, parentRelation: parent ? {
            order: parent.order,
            isHeading: parent.isHeading,
            headingText: parent.headingText,
            isCultureField: parent.isCultureField,
            isActive: parent.isActive,
            formula: parent.formula,
            isCountDependent: parent.isCountDependent,
          } : null },
          sourceCreatedAt: parameter.createdAt,
        })) collected++;
      }

      const formats = await prisma.labFormat.findMany({
        where: { organizationId: lab.id, createdAt: { gte: config.newRecordsSince } },
        include: { test: { select: { globalTestId: true } } },
      });
      for (const format of formats) {
        if (await queueNewSubmission({
          sourceOrganizationId: lab.id,
          itemType: GlobalSyncItemType.Format,
          sourceRecordId: format.id,
          sourceParentTestId: format.testId,
          targetGlobalTestId: format.test?.globalTestId,
          name: format.name,
          payload: { name: format.name, version: format.version, payload: format.payload },
          sourceCreatedAt: format.createdAt,
        })) collected++;
      }
    }

    await prisma.globalSyncLog.create({
      data: {
        organizationId: SUPER_ADMIN_ORG_ID,
        action: "GLOBAL_PULL",
        details: { collected, laboratoryCount: labs.length },
      },
    });
    revalidatePath("/super-admin/central-library");
    return { success: true, message: `Collected ${collected} new item(s) for review.` };
  } catch (error) {
    console.error("Global Pull Error:", error);
    return { success: false, message: error instanceof Error ? error.message : "Global Pull failed." };
  }
}

export async function queueLegacyMasterLibrary() {
  try {
    const { orgId } = await requireAuth();
    requireSuperAdmin(orgId);
    const config = await prisma.globalSyncConfig.findUnique({ where: { id: 1 } });
    if (!config) throw new Error("Global Sync is not initialized. Apply the central library migration first.");
    if (config.legacyBootstrapDone) return { success: true, message: "Legacy Master HQ data was already queued." };

    let collected = 0;
    const tests = await prisma.test.findMany({
      where: { organizationId: SUPER_ADMIN_ORG_ID },
      include: { parameters: { orderBy: { order: "asc" } } },
    });
    for (const test of tests) {
      if (await queueNewSubmission({
        sourceOrganizationId: SUPER_ADMIN_ORG_ID,
        itemType: GlobalSyncItemType.Test,
        sourceRecordId: test.id,
        name: test.name,
        code: test.code,
        payload: {
          ...testSnapshot(test),
          linkedSourceParameterIds: test.parameters
            .map((entry) => entry.parameterId)
            .filter((id): id is number => id !== null),
        },
        sourceCreatedAt: test.createdAt,
      })) collected++;

      const formatPayload = {
        resultType: test.resultType,
        template: test.template,
        printNextPage: test.printNextPage,
        billingOnly: test.billingOnly,
        reportTitle: test.reportTitle,
        colCaption1: test.colCaption1,
        colCaption2: test.colCaption2,
        colCaption3: test.colCaption3,
        colCaption4: test.colCaption4,
        colCaption5: test.colCaption5,
        labEquiName: test.labEquiName,
        isFormulaNeeded: test.isFormulaNeeded,
        isCountNeeded: test.isCountNeeded,
        targetCount: test.targetCount,
        isInterpretationNeeded: test.isInterpretationNeeded,
        interpretation: test.interpretation,
        cultureColumns: test.cultureColumns,
        parameters: test.parameters,
      };
      if (test.isConfigured && await queueNewSubmission({
        sourceOrganizationId: SUPER_ADMIN_ORG_ID,
        itemType: GlobalSyncItemType.Format,
        sourceRecordId: test.id,
        sourceParentTestId: test.id,
        name: test.template || `${test.name} Format`,
        payload: { name: test.template || `${test.name} Format`, version: 1, payload: formatPayload },
        sourceCreatedAt: test.createdAt,
      })) collected++;
    }

    const parameters = await prisma.parameter.findMany({
      where: { organizationId: SUPER_ADMIN_ORG_ID },
      include: { ranges: true },
    });
    for (const parameter of parameters) {
      const parent = await prisma.testParameter.findFirst({
        where: { parameterId: parameter.id, organizationId: SUPER_ADMIN_ORG_ID },
        select: {
          testId: true,
          order: true,
          isHeading: true,
          headingText: true,
          isCultureField: true,
          isActive: true,
          formula: true,
          isCountDependent: true,
        },
        orderBy: { testId: "asc" },
      });
      const { id, organizationId, globalParameterId, createdAt, updatedAt, ranges, ...fields } = parameter;
      if (await queueNewSubmission({
        sourceOrganizationId: SUPER_ADMIN_ORG_ID,
        itemType: GlobalSyncItemType.Parameter,
        sourceRecordId: parameter.id,
        sourceParentTestId: parent?.testId,
        name: parameter.name,
        code: parameter.code,
        payload: { ...fields, ranges, parentRelation: parent ? {
          order: parent.order,
          isHeading: parent.isHeading,
          headingText: parent.headingText,
          isCultureField: parent.isCultureField,
          isActive: parent.isActive,
          formula: parent.formula,
          isCountDependent: parent.isCountDependent,
        } : null },
        sourceCreatedAt: parameter.createdAt,
      })) collected++;
    }

    await prisma.$transaction([
      prisma.globalSyncConfig.update({
        where: { id: 1 },
        data: { legacyBootstrapDone: true },
      }),
      prisma.globalSyncLog.create({
        data: {
          organizationId: SUPER_ADMIN_ORG_ID,
          action: "LEGACY_MASTER_QUEUED",
          details: { collected },
        },
      }),
    ]);
    revalidatePath("/super-admin/central-library");
    return { success: true, message: `Queued ${collected} legacy Master HQ item(s) for review.` };
  } catch (error) {
    console.error("Legacy Master Queue Error:", error);
    return { success: false, message: error instanceof Error ? error.message : "Could not queue legacy Master HQ data." };
  }
}

export async function reviewGlobalSubmission(id: string, decision: "approve" | "reject" | "remove") {
  try {
    const { orgId } = await requireAuth();
    requireSuperAdmin(orgId);
    const nextStatus = decision === "approve"
      ? GlobalSyncStatus.Approved
      : decision === "reject"
        ? GlobalSyncStatus.Rejected
        : GlobalSyncStatus.Removed;
    const result = await prisma.$transaction(async (tx) => {
      const submission = await tx.globalSyncSubmission.findUnique({ where: { id } });
      if (!submission) throw new Error("Submission not found.");
      if (submission.status === GlobalSyncStatus.Published) throw new Error("Published submissions cannot be changed.");
      const updated = await tx.globalSyncSubmission.update({
        where: { id },
        data: { status: nextStatus, reviewedAt: new Date() },
      });
      await writeAudit(tx, `SUBMISSION_${decision.toUpperCase()}`, submission.itemType, id, {
        sourceOrganizationId: submission.sourceOrganizationId,
        sourceRecordId: submission.sourceRecordId,
      });
      return updated;
    });
    revalidatePath("/super-admin/central-library");
    return { success: true, data: result };
  } catch (error) {
    console.error("Review Submission Error:", error);
    return { success: false, message: error instanceof Error ? error.message : "Could not update submission." };
  }
}

function localTestData(payload: JsonRecord, organizationId: number, code: string) {
  return {
    organizationId,
    code,
    name: getText(payload.name, code),
    displayName: getText(payload.displayName) || null,
    type: getText(payload.type, "Test"),
    gender: getText(payload.gender, "Both"),
    description: getText(payload.description) || null,
    sampleVolume: getText(payload.sampleVolume) || null,
    barcodeCopies: typeof payload.barcodeCopies === "number" ? payload.barcodeCopies : 1,
    minDays: typeof payload.minDays === "number" ? payload.minDays : 0,
    minHours: typeof payload.minHours === "number" ? payload.minHours : 0,
    minMinutes: typeof payload.minMinutes === "number" ? payload.minMinutes : 0,
    maxDays: typeof payload.maxDays === "number" ? payload.maxDays : 0,
    maxHours: typeof payload.maxHours === "number" ? payload.maxHours : 0,
    maxMinutes: typeof payload.maxMinutes === "number" ? payload.maxMinutes : 0,
    resultType: getText(payload.resultType, "Parameter"),
    template: getText(payload.template, "Default"),
    instructions: getText(payload.instructions) || null,
    isInterpretationNeeded: payload.isInterpretationNeeded === true,
    interpretation: getText(payload.interpretation) || null,
    reportTitle: getText(payload.reportTitle) || null,
    colCaption1: getText(payload.colCaption1) || null,
    colCaption2: getText(payload.colCaption2) || null,
    colCaption3: getText(payload.colCaption3) || null,
    colCaption4: getText(payload.colCaption4) || null,
    colCaption5: getText(payload.colCaption5) || null,
    labEquiName: getText(payload.labEquiName) || null,
    isFormulaNeeded: payload.isFormulaNeeded === true,
    isCountNeeded: payload.isCountNeeded === true,
    targetCount: typeof payload.targetCount === "number" ? payload.targetCount : null,
    lmpRequired: payload.lmpRequired === true,
    idRequired: payload.idRequired === true,
    consentRequired: payload.consentRequired === true,
    printNextPage: payload.printNextPage === true,
    billingOnly: payload.billingOnly === true,
    isCulture: payload.isCulture === true,
    cultureColumns: getText(payload.cultureColumns) || null,
    isConfigured: payload.isConfigured === true,
    isActive: payload.isActive !== false,
    normalRange: getText(payload.normalRange) || null,
    units: getText(payload.units) || null,
    showTestNameOnReport: payload.showTestNameOnReport === true,
  };
}

async function importGlobalTest(
  tx: Prisma.TransactionClient,
  globalTestId: string,
  payload: JsonRecord,
  organizationId: number
): Promise<{ id: number; created: boolean }> {
  const existing = await tx.test.findUnique({
    where: { organizationId_globalTestId: { organizationId, globalTestId } },
    select: { id: true },
  });
  if (existing) return { id: existing.id, created: false };
  const baseCode = getText(payload.code, "GLOBAL");
  let code = baseCode;
  let suffix = 0;
  while (await tx.test.findUnique({
    where: { organizationId_code: { organizationId, code } },
    select: { id: true },
  })) {
    code = `GLB-${globalTestId}${suffix ? `-${suffix}` : ""}`;
    suffix++;
  }
  const created = await tx.test.create({
    data: { ...localTestData(payload, organizationId, code), globalTestId, price: 0 },
    select: { id: true },
  });
  return { id: created.id, created: true };
}

async function importGlobalParameter(
  tx: Prisma.TransactionClient,
  globalParameterId: string,
  payload: JsonRecord,
  organizationId: number
): Promise<{ id: number; created: boolean }> {
  const existing = await tx.parameter.findUnique({
    where: { organizationId_globalParameterId: { organizationId, globalParameterId } },
    select: { id: true },
  });
  if (existing) return { id: existing.id, created: false };
  const ranges = Array.isArray(payload.ranges) ? payload.ranges : [];
  const fields = { ...payload };
  delete fields.ranges;
  delete fields.organizationId;
  delete fields.createdAt;
  delete fields.updatedAt;
  delete fields.globalParameterId;
  delete fields.parentRelation;
  const code = getText(fields.code) || null;
  const conflictingCode = code ? await tx.parameter.findFirst({
    where: { organizationId, code },
    select: { id: true },
  }) : null;
  const created = await tx.parameter.create({
    data: {
      ...(fields as Prisma.ParameterUncheckedCreateInput),
      organizationId,
      code: conflictingCode ? null : code,
      globalParameterId,
      price: 0,
      ranges: {
        create: ranges.map((range) => {
          const item = asRecord(range as Prisma.JsonValue);
          return {
            organizationId,
            gender: getText(item.gender, "Both"),
            minAge: typeof item.minAge === "number" ? item.minAge : 0,
            maxAge: typeof item.maxAge === "number" ? item.maxAge : 100,
            minAgeUnit: getText(item.minAgeUnit, "Years"),
            maxAgeUnit: getText(item.maxAgeUnit, "Years"),
            normalOperator: getText(item.normalOperator, "Between"),
            lowRange: typeof item.lowRange === "number" ? item.lowRange : null,
            highRange: typeof item.highRange === "number" ? item.highRange : null,
            normalRange: getText(item.normalRange) || null,
            normalValue: getText(item.normalValue) || null,
            abnormalValue: getText(item.abnormalValue) || null,
            criticalOperator: getText(item.criticalOperator, "Between"),
            criticalLow: typeof item.criticalLow === "number" ? item.criticalLow : null,
            criticalHigh: typeof item.criticalHigh === "number" ? item.criticalHigh : null,
            criticalValue: getText(item.criticalValue) || null,
          };
        }),
      },
    },
    select: { id: true },
  });
  return { id: created.id, created: true };
}

export async function runGlobalSync() {
  try {
    const { orgId } = await requireAuth();
    requireSuperAdmin(orgId);
    const approved = await prisma.globalSyncSubmission.findMany({
      where: { status: GlobalSyncStatus.Approved },
      orderBy: [{ sourceCreatedAt: "asc" }],
    });
    const syncOrder = (type: ItemType) => type === GlobalSyncItemType.Test ? 0 : type === GlobalSyncItemType.Parameter ? 1 : 2;
    approved.sort((left, right) => syncOrder(left.itemType) - syncOrder(right.itemType));
    let published = 0;
    let imported = 0;
    for (const submission of approved) {
      if (
        submission.sourceParentTestId &&
        !submission.targetGlobalTestId &&
        (submission.itemType === GlobalSyncItemType.Parameter || submission.itemType === GlobalSyncItemType.Format)
      ) {
        const parentSubmission = await prisma.globalSyncSubmission.findUnique({
          where: {
            sourceOrganizationId_itemType_sourceRecordId: {
              sourceOrganizationId: submission.sourceOrganizationId,
              itemType: GlobalSyncItemType.Test,
              sourceRecordId: submission.sourceParentTestId,
            },
          },
          select: { status: true },
        });
        if (parentSubmission && parentSubmission.status !== GlobalSyncStatus.Published) continue;
      }
      const result = await prisma.$transaction(async (tx) => {
        let globalTestId = submission.targetGlobalTestId;
        let globalParameterId: string | null = null;
        let globalFormatId: string | null = null;
        let publishedFormatPayload: JsonRecord | null = null;
        if (submission.itemType === GlobalSyncItemType.Test) {
          const existing = await tx.globalTest.findFirst({
            where: {
              OR: [
                { code: getText(asRecord(submission.payload).code) },
                { name: { equals: submission.name, mode: "insensitive" } },
              ],
            },
            select: { id: true },
          });
          if (!existing) {
            const payload = asRecord(submission.payload);
            const test = await tx.globalTest.create({
              data: {
                code: getText(payload.code),
                name: submission.name,
                category: getText(payload.type) || null,
                payload: asJson(submission.payload),
                isActive: payload.isActive !== false,
              },
            });
            globalTestId = test.id;
          } else {
            globalTestId = existing.id;
          }
          await tx.test.updateMany({
            where: {
              id: submission.sourceRecordId,
              organizationId: submission.sourceOrganizationId,
              globalTestId: null,
            },
            data: { globalTestId },
          });
        } else if (submission.itemType === GlobalSyncItemType.Parameter) {
          if (!globalTestId && submission.sourceParentTestId) {
            const parentSubmission = await tx.globalSyncSubmission.findUnique({
              where: {
                sourceOrganizationId_itemType_sourceRecordId: {
                  sourceOrganizationId: submission.sourceOrganizationId,
                  itemType: GlobalSyncItemType.Test,
                  sourceRecordId: submission.sourceParentTestId,
                },
              },
              select: { targetGlobalTestId: true, status: true },
            });
            globalTestId = parentSubmission?.targetGlobalTestId ?? null;
          }
          const payload = asRecord(submission.payload);
          const code = getText(payload.code) || null;
          const existing = await tx.globalParameter.findFirst({
            where: {
              OR: [
                ...(code ? [{ code }] : []),
                { name: { equals: submission.name, mode: "insensitive" } },
              ],
            },
            select: { id: true },
          });
          if (!existing) {
            const { ranges, ...parameterFields } = payload;
            const globalParameter = await tx.globalParameter.create({
              data: {
                code,
                name: submission.name,
                unit: getText(parameterFields.unit) || null,
                inputType: getText(parameterFields.inputType, "Numerical"),
                globalTestId,
                payload: asJson(submission.payload),
                isActive: parameterFields.isActive !== false,
              },
            });
            globalParameterId = globalParameter.id;
          } else {
            globalParameterId = existing.id;
          }
          await tx.parameter.updateMany({
            where: {
              id: submission.sourceRecordId,
              organizationId: submission.sourceOrganizationId,
              globalParameterId: null,
            },
            data: { globalParameterId },
          });
          await tx.globalSyncSubmission.update({
            where: { id: submission.id },
            data: { targetGlobalParameterId: globalParameterId },
          });
        } else {
          const payload = asRecord(submission.payload);
          const formatPayload = asRecord(payload.payload as Prisma.JsonValue);
          const sharedFormatFields = { ...formatPayload };
          delete sharedFormatFields.specimenId;
          const sourceParameters = Array.isArray(formatPayload.parameters) ? formatPayload.parameters : [];
          const mappedParameters = [];
          for (const sourceParameter of sourceParameters) {
            const row = asRecord(sourceParameter as Prisma.JsonValue);
            const sourceParameterId = typeof row.parameterId === "number" ? row.parameterId : null;
            let parameterGlobalId = getText(row.parameterGlobalId) || null;
            if (sourceParameterId) {
              const sourceSubmission = await tx.globalSyncSubmission.findUnique({
                where: {
                  sourceOrganizationId_itemType_sourceRecordId: {
                    sourceOrganizationId: submission.sourceOrganizationId,
                    itemType: GlobalSyncItemType.Parameter,
                    sourceRecordId: sourceParameterId,
                  },
                },
                select: { targetGlobalParameterId: true, status: true },
              });
              parameterGlobalId = sourceSubmission?.targetGlobalParameterId ?? parameterGlobalId;
              if (!parameterGlobalId) {
                const sourceParameter = await tx.parameter.findFirst({
                  where: { id: sourceParameterId, organizationId: submission.sourceOrganizationId },
                  select: { globalParameterId: true },
                });
                parameterGlobalId = sourceParameter?.globalParameterId ?? null;
              }
            }
            mappedParameters.push({
              ...row,
              sourceParameterId,
              parameterGlobalId,
              parameterId: null,
            });
          }
          publishedFormatPayload = { ...sharedFormatFields, parameters: mappedParameters };
          const name = getText(payload.name, submission.name);
          if (!globalTestId && submission.sourceParentTestId) {
            const parentSubmission = await tx.globalSyncSubmission.findUnique({
              where: {
                sourceOrganizationId_itemType_sourceRecordId: {
                  sourceOrganizationId: submission.sourceOrganizationId,
                  itemType: GlobalSyncItemType.Test,
                  sourceRecordId: submission.sourceParentTestId,
                },
              },
              select: { targetGlobalTestId: true },
            });
            globalTestId = parentSubmission?.targetGlobalTestId ?? null;
          }
          const globalTestIdForFormat = globalTestId;
          const existing = await tx.globalFormat.findFirst({
            where: {
              globalTestId: globalTestIdForFormat,
              name,
              version: typeof payload.version === "number" ? payload.version : 1,
            },
            select: { id: true },
          });
          if (!existing) {
            const created = await tx.globalFormat.create({
              data: {
                name,
                globalTestId: globalTestIdForFormat,
                version: typeof payload.version === "number" ? payload.version : 1,
                payload: asJson(publishedFormatPayload),
              },
              select: { id: true },
            });
            globalFormatId = created.id;
          } else {
            globalFormatId = existing.id;
          }
        }

        if (submission.itemType === GlobalSyncItemType.Test && globalTestId) {
          const organizations = await tx.organization.findMany({
            where: { isActive: true, id: { not: SUPER_ADMIN_ORG_ID } },
            select: { id: true },
          });
          for (const organization of organizations) {
            const localTest = await importGlobalTest(
              tx,
              globalTestId,
              asRecord(submission.payload),
              organization.id
            );
            if (localTest.created) imported++;
            await writeAudit(tx, "GLOBAL_IMPORT_TEST", submission.itemType, submission.id, {
              targetOrganizationId: organization.id,
              globalTestId,
              created: localTest.created,
            });

            const linkedParameters = await tx.globalSyncSubmission.findMany({
              where: {
                sourceOrganizationId: submission.sourceOrganizationId,
                itemType: GlobalSyncItemType.Parameter,
                sourceParentTestId: submission.sourceRecordId,
                status: GlobalSyncStatus.Approved,
              },
            });
            for (const parameterSubmission of linkedParameters) {
              const globalParameter = await tx.globalParameter.findFirst({
                where: {
                  name: parameterSubmission.name,
                  globalTestId,
                },
                select: { id: true },
              });
              if (!globalParameter) continue;
              const localParameterId = await importGlobalParameter(
                tx,
                globalParameter.id,
                asRecord(parameterSubmission.payload),
                organization.id
              );
              if (localParameterId.created) imported++;
              await writeAudit(tx, "GLOBAL_IMPORT_PARAMETER", GlobalSyncItemType.Parameter, parameterSubmission.id, {
                targetOrganizationId: organization.id,
                globalParameterId: globalParameter.id,
                created: localParameterId.created,
              });
              const linked = await tx.testParameter.findFirst({
                where: { organizationId: organization.id, testId: localTest.id, parameterId: localParameterId.id },
                select: { id: true },
              });
              if (!linked) {
                await tx.testParameter.create({
                  data: {
                    organizationId: organization.id,
                    testId: localTest.id,
                    parameterId: localParameterId.id,
                  },
                });
              }
            }
          }
        } else if (submission.itemType === GlobalSyncItemType.Parameter) {
          const payload = asRecord(submission.payload);
          const globalParameter = await tx.globalParameter.findFirst({
            where: { id: globalParameterId ?? undefined },
            select: { id: true },
          });
          if (globalParameter) {
            const organizations = await tx.organization.findMany({
              where: { isActive: true, id: { not: SUPER_ADMIN_ORG_ID } },
              select: { id: true },
            });
            for (const organization of organizations) {
              const localParameter = await importGlobalParameter(
                tx,
                globalParameter.id,
                payload,
                organization.id
              );
              if (localParameter.created) imported++;
              await writeAudit(tx, "GLOBAL_IMPORT_PARAMETER", submission.itemType, submission.id, {
                targetOrganizationId: organization.id,
                globalParameterId: globalParameter.id,
                created: localParameter.created,
              });
              const localGlobalTestId = submission.targetGlobalTestId ?? globalTestId;
              const parentRelation = asRecord(payload.parentRelation as Prisma.JsonValue);
              if (localGlobalTestId) {
                const localTest = await tx.test.findUnique({
                  where: {
                    organizationId_globalTestId: {
                      organizationId: organization.id,
                      globalTestId: localGlobalTestId,
                    },
                  },
                  select: { id: true },
                });
                if (localTest) {
                  const link = await tx.testParameter.findFirst({
                    where: {
                      organizationId: organization.id,
                      testId: localTest.id,
                      parameterId: localParameter.id,
                    },
                    select: { id: true },
                  });
                  if (!link) {
                    await tx.testParameter.create({
                      data: {
                        organizationId: organization.id,
                        testId: localTest.id,
                        parameterId: localParameter.id,
                        order: typeof parentRelation.order === "number" ? parentRelation.order : 0,
                        isHeading: parentRelation.isHeading === true,
                        headingText: getText(parentRelation.headingText) || null,
                        isCultureField: parentRelation.isCultureField === true,
                        isActive: parentRelation.isActive !== false,
                        formula: getText(parentRelation.formula) || null,
                        isCountDependent: parentRelation.isCountDependent === true,
                      },
                    });
                  }
                }
              }
            }
          }
        }

        if (submission.itemType === GlobalSyncItemType.Format && globalFormatId) {
          const payload = asRecord(submission.payload);
          const name = getText(payload.name, submission.name);
          const version = typeof payload.version === "number" ? payload.version : 1;
          const labs = await tx.organization.findMany({
            where: { isActive: true, id: { not: SUPER_ADMIN_ORG_ID } },
            select: { id: true },
          });
          for (const organization of labs) {
            const localTest = globalTestId
              ? await tx.test.findUnique({
                  where: {
                    organizationId_globalTestId: {
                      organizationId: organization.id,
                      globalTestId,
                    },
                  },
                  select: { id: true },
                })
              : null;
            const exists = await tx.labFormat.findUnique({
              where: { organizationId_globalFormatId: { organizationId: organization.id, globalFormatId } },
              select: { id: true },
            });
            if (exists) continue;
            let localName = name;
            if (await tx.labFormat.findFirst({
              where: { organizationId: organization.id, testId: localTest?.id ?? null, name: localName, version },
              select: { id: true },
            })) localName = `${name} (Global)`;
            await tx.labFormat.create({
              data: {
                organizationId: organization.id,
                testId: localTest?.id,
                globalFormatId,
                name: localName,
                version,
                payload: asJson(publishedFormatPayload ?? asRecord(payload.payload as Prisma.JsonValue)),
              },
            });
            imported++;
            await writeAudit(tx, "GLOBAL_IMPORT_FORMAT", submission.itemType, submission.id, {
              targetOrganizationId: organization.id,
              globalFormatId,
              created: true,
            });
          }
        }

        await tx.globalSyncSubmission.update({
          where: { id: submission.id },
          data: {
            status: GlobalSyncStatus.Published,
            targetGlobalTestId: globalTestId,
            targetGlobalParameterId: globalParameterId,
            publishedAt: new Date(),
          },
        });
        await writeAudit(tx, "GLOBAL_SYNC_PUBLISHED", submission.itemType, submission.id, {
          sourceOrganizationId: submission.sourceOrganizationId,
          sourceRecordId: submission.sourceRecordId,
          globalTestId,
        });
        return true;
      }, { timeout: 60_000 });
      if (result) published++;
    }
    const catalogImports = await prisma.$transaction(async (tx) => {
      const labs = await tx.organization.findMany({
        where: { isActive: true, id: { not: SUPER_ADMIN_ORG_ID } },
        select: { id: true },
      });
      const centralTests = await tx.globalTest.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      });
      const centralParameters = await tx.globalParameter.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      });
      const centralFormats = await tx.globalFormat.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      });
      let createdCount = 0;
      for (const lab of labs) {
        for (const centralTest of centralTests) {
          const localTest = await importGlobalTest(
            tx,
            centralTest.id,
            asRecord(centralTest.payload),
            lab.id
          );
          if (!localTest.created) continue;
          createdCount++;
          await writeAudit(tx, "GLOBAL_CATALOG_IMPORT_TEST", GlobalSyncItemType.Test, undefined, {
            targetOrganizationId: lab.id,
            globalTestId: centralTest.id,
          });
        }
        for (const centralParameter of centralParameters) {
          const localParameter = await importGlobalParameter(
            tx,
            centralParameter.id,
            asRecord(centralParameter.payload),
            lab.id
          );
          if (localParameter.created) {
            createdCount++;
            await writeAudit(tx, "GLOBAL_CATALOG_IMPORT_PARAMETER", GlobalSyncItemType.Parameter, undefined, {
              targetOrganizationId: lab.id,
              globalParameterId: centralParameter.id,
            });
          }
          if (centralParameter.globalTestId) {
            const localTest = await tx.test.findUnique({
              where: {
                organizationId_globalTestId: {
                  organizationId: lab.id,
                  globalTestId: centralParameter.globalTestId,
                },
              },
              select: { id: true },
            });
            if (localTest && !(await tx.testParameter.findFirst({
              where: {
                organizationId: lab.id,
                testId: localTest.id,
                parameterId: localParameter.id,
              },
              select: { id: true },
            }))) {
              const relation = asRecord(asRecord(centralParameter.payload).parentRelation as Prisma.JsonValue);
              await tx.testParameter.create({
                data: {
                  organizationId: lab.id,
                  testId: localTest.id,
                  parameterId: localParameter.id,
                  order: typeof relation.order === "number" ? relation.order : 0,
                  isActive: relation.isActive !== false,
                  formula: getText(relation.formula) || null,
                  isCountDependent: relation.isCountDependent === true,
                },
              });
            }
          }
        }
        for (const centralFormat of centralFormats) {
          if (await tx.labFormat.findUnique({
            where: { organizationId_globalFormatId: { organizationId: lab.id, globalFormatId: centralFormat.id } },
            select: { id: true },
          })) continue;
          const localTest = centralFormat.globalTestId
            ? await tx.test.findUnique({
                where: {
                  organizationId_globalTestId: {
                    organizationId: lab.id,
                    globalTestId: centralFormat.globalTestId,
                  },
                },
                select: { id: true },
              })
            : null;
          let name = centralFormat.name;
          if (await tx.labFormat.findFirst({
            where: { organizationId: lab.id, testId: localTest?.id ?? null, name, version: centralFormat.version },
            select: { id: true },
          })) name = `${name} (Global)`;
          await tx.labFormat.create({
            data: {
              organizationId: lab.id,
              testId: localTest?.id,
              globalFormatId: centralFormat.id,
              name,
              version: centralFormat.version,
              payload: asJson(centralFormat.payload),
            },
          });
          createdCount++;
          await writeAudit(tx, "GLOBAL_CATALOG_IMPORT_FORMAT", GlobalSyncItemType.Format, undefined, {
            targetOrganizationId: lab.id,
            globalFormatId: centralFormat.id,
          });
        }
      }
      return createdCount;
    }, { timeout: 60_000 });
    imported += catalogImports;
    await prisma.globalSyncLog.create({
      data: {
        organizationId: SUPER_ADMIN_ORG_ID,
        action: "GLOBAL_SYNC",
        details: { published, imported },
      },
    });
    revalidatePath("/super-admin/central-library");
    revalidatePath("/tests");
    revalidatePath("/parameters");
    return { success: true, message: `Published ${published} approved item(s); imported ${imported} item(s).` };
  } catch (error) {
    console.error("Global Sync Error:", error);
    return { success: false, message: error instanceof Error ? error.message : "Global Sync failed." };
  }
}

export async function getCentralLibraryData() {
  const { orgId } = await requireAuth();
  requireSuperAdmin(orgId);
  const [tests, parameters, formats, submissions] = await Promise.all([
    prisma.globalTest.findMany({ include: { parameters: true, formats: true }, orderBy: { name: "asc" } }),
    prisma.globalParameter.findMany({ include: { globalTest: true }, orderBy: { name: "asc" } }),
    prisma.globalFormat.findMany({ include: { globalTest: true }, orderBy: [{ name: "asc" }, { version: "desc" }] }),
    prisma.globalSyncSubmission.findMany({
      include: { organization: { select: { name: true } } },
      orderBy: [{ status: "asc" }, { sourceCreatedAt: "desc" }],
    }),
  ]);
  const parentIds = Array.from(new Set(submissions
    .map((submission) => submission.sourceParentTestId)
    .filter((id): id is number => id !== null)));
  const parentOrganizations = Array.from(new Set(submissions.map((submission) => submission.sourceOrganizationId)));
  const parentTests = parentIds.length
    ? await prisma.test.findMany({
        where: { id: { in: parentIds }, organizationId: { in: parentOrganizations } },
        select: { id: true, organizationId: true, name: true },
      })
    : [];
  const parentNames = new Map(parentTests.map((test) => [`${test.organizationId}:${test.id}`, test.name]));
  return {
    tests,
    parameters,
    formats,
    submissions: submissions.map((submission) => ({
      ...submission,
      sourceParentTestName: submission.sourceParentTestId
        ? parentNames.get(`${submission.sourceOrganizationId}:${submission.sourceParentTestId}`) ?? null
        : null,
    })),
  };
}

export async function saveCentralDefinition(
  type: ItemType,
  id: string | null,
  input: { name: string; code?: string; category?: string; unit?: string; testId?: string; payload: JsonRecord; isActive: boolean; version?: number }
) {
  try {
    const { orgId } = await requireAuth();
    requireSuperAdmin(orgId);
    if (!input.name.trim()) throw new Error("Name is required.");
    if (type === GlobalSyncItemType.Test && !input.code?.trim()) throw new Error("A central test code is required.");
    if (type === GlobalSyncItemType.Format && (!Number.isInteger(input.version) || (input.version ?? 0) < 1)) {
      throw new Error("Format version must be a positive whole number.");
    }
    const payload = asJson(input.payload);
    if (type === GlobalSyncItemType.Test) {
      const data = {
        code: input.code?.trim() || "",
        name: input.name.trim(),
        category: input.category || null,
        payload,
        isActive: input.isActive,
      };
      const record = id
        ? await prisma.globalTest.update({ where: { id }, data })
        : await prisma.globalTest.create({ data });
      await prisma.globalSyncLog.create({
        data: { organizationId: SUPER_ADMIN_ORG_ID, action: id ? "CENTRAL_TEST_UPDATED" : "CENTRAL_TEST_CREATED", itemType: type, details: { id: record.id } },
      });
    } else if (type === GlobalSyncItemType.Parameter) {
      const data = {
        code: input.code?.trim() || null,
        name: input.name.trim(),
        unit: input.unit || null,
        inputType: getText(input.payload.inputType, "Numerical"),
        globalTestId: input.testId || null,
        payload,
        isActive: input.isActive,
      };
      const record = id
        ? await prisma.globalParameter.update({ where: { id }, data })
        : await prisma.globalParameter.create({ data });
      await prisma.globalSyncLog.create({
        data: { organizationId: SUPER_ADMIN_ORG_ID, action: id ? "CENTRAL_PARAMETER_UPDATED" : "CENTRAL_PARAMETER_CREATED", itemType: type, details: { id: record.id } },
      });
    } else {
      const data = {
        name: input.name.trim(),
        globalTestId: input.testId || null,
        version: input.version || 1,
        payload,
        isActive: input.isActive,
      };
      const record = id
        ? await prisma.globalFormat.update({ where: { id }, data })
        : await prisma.globalFormat.create({ data });
      await prisma.globalSyncLog.create({
        data: { organizationId: SUPER_ADMIN_ORG_ID, action: id ? "CENTRAL_FORMAT_UPDATED" : "CENTRAL_FORMAT_CREATED", itemType: type, details: { id: record.id } },
      });
    }
    revalidatePath("/super-admin/central-library");
    return { success: true };
  } catch (error) {
    console.error("Central Definition Save Error:", error);
    return { success: false, message: error instanceof Error ? error.message : "Could not save central definition." };
  }
}
