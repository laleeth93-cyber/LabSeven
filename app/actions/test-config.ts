"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server-auth";

export async function createLocalFormatVersion(testId: number, name: string, data: any) {
  try {
    const { orgId } = await requireAuth();
    const id = Number(testId);
    const formatName = name.trim();
    if (!Number.isInteger(id) || id < 1 || !formatName) {
      return { success: false, message: "A valid test and format name are required." };
    }
    if (!Array.isArray(data.parameters)) {
      return { success: false, message: "Format parameters must be provided as a list." };
    }
    const parameterIds = data.parameters
      .map((parameter: any) => Number(parameter.parameterId))
      .filter((parameterId: number) => Number.isInteger(parameterId) && parameterId > 0);
    const ownedParameters = await prisma.parameter.findMany({
      where: { organizationId: orgId, id: { in: parameterIds } },
      select: { id: true, globalParameterId: true },
    });
    if (ownedParameters.length !== new Set(parameterIds).size) {
      return { success: false, message: "One or more parameters do not belong to your laboratory." };
    }
    const test = await prisma.test.findFirst({
      where: { id, organizationId: orgId },
      select: { id: true },
    });
    if (!test) return { success: false, message: "Test not found in your laboratory." };

    const globalIds = new Map(ownedParameters.map((parameter) => [parameter.id, parameter.globalParameterId]));
    const parameters = data.parameters.map((parameter: any) => ({
      ...parameter,
      parameterGlobalId: parameter.parameterId
        ? globalIds.get(Number(parameter.parameterId)) ?? null
        : null,
    }));
    const result = await prisma.$transaction(async (tx) => {
      const previous = await tx.labFormat.findFirst({
        where: { organizationId: orgId, testId: id, name: formatName },
        orderBy: { version: "desc" },
        select: { version: true },
      });
      return tx.labFormat.create({
        data: {
          organizationId: orgId,
          testId: id,
          name: formatName,
          version: (previous?.version ?? 0) + 1,
          payload: JSON.parse(JSON.stringify({ ...data, parameters })) as Prisma.InputJsonValue,
        },
      });
    });
    revalidatePath("/tests/formats");
    revalidatePath("/super-admin/central-library");
    return { success: true, data: result };
  } catch (error) {
    console.error("Create Local Format Error:", error);
    return { success: false, message: error instanceof Error ? error.message : "Could not save format to the library." };
  }
}

export async function updateTestConfiguration(testId: number, data: any) {
  try {
    const { orgId } = await requireAuth();
    const id = Number(testId);
    if (!Number.isInteger(id) || id < 1) return { success: false, message: "Invalid test." };

    const existingTest = await prisma.test.findFirst({
      where: { id, organizationId: orgId },
      select: { id: true, createdAt: true },
    });
    if (!existingTest) return { success: false, message: "Test not found in your laboratory." };

    if (!Array.isArray(data.parameters)) {
      return { success: false, message: "Test parameters must be provided as a list." };
    }

    const invalidParameterRows = data.parameters.some((parameter: any) =>
      !parameter.isHeading &&
      !parameter.isCultureField &&
      (!Number.isInteger(Number(parameter.parameterId)) || Number(parameter.parameterId) < 1)
    );
    if (invalidParameterRows) {
      return { success: false, message: "Each report row must reference a valid laboratory parameter." };
    }
    const parameterIds = data.parameters
      .map((parameter: any) => Number(parameter.parameterId))
      .filter((parameterId: number) => Number.isInteger(parameterId) && parameterId > 0);
    const ownedParameters = await prisma.parameter.count({
      where: { organizationId: orgId, id: { in: parameterIds } },
    });
    if (ownedParameters !== new Set(parameterIds).size) {
      return { success: false, message: "One or more parameters do not belong to your laboratory." };
    }

    const specimenId = data.specimenId ? Number(data.specimenId) : null;
    if (specimenId) {
      const specimen = await prisma.specimen.findFirst({
        where: { id: specimenId, organizationId: orgId },
        select: { id: true },
      });
      if (!specimen) return { success: false, message: "Specimen not found in your laboratory." };
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedTest = await tx.test.update({
        where: { id },
        data: {
          resultType: data.resultType,
          template: data.template,
          printNextPage: Boolean(data.printNextPage),
          billingOnly: Boolean(data.billingOnly),
          reportTitle: data.reportTitle,
          specimenId,
          colCaption1: data.colCaption1,
          colCaption2: data.colCaption2,
          colCaption3: data.colCaption3,
          colCaption4: data.colCaption4,
          colCaption5: data.colCaption5,
          labEquiName: data.labEquiName,
          isFormulaNeeded: Boolean(data.isFormulaNeeded),
          isCountNeeded: Boolean(data.isCountNeeded),
          targetCount: data.targetCount ? Number(data.targetCount) : null,
          isInterpretationNeeded: Boolean(data.isInterpretationNeeded),
          interpretation: data.interpretation,
          cultureColumns: data.cultureColumns,
          isConfigured: true,
          parameters: {
            deleteMany: { organizationId: orgId },
            create: data.parameters.map((parameter: any) => ({
              organizationId: orgId,
              parameterId: parameter.parameterId ? Number(parameter.parameterId) : null,
              order: Number(parameter.order),
              isHeading: Boolean(parameter.isHeading),
              headingText: parameter.headingText || null,
              isActive: Boolean(parameter.isActive),
              formula: parameter.formula || null,
              isCountDependent: Boolean(parameter.isCountDependent),
              isCultureField: Boolean(parameter.isCultureField),
            })),
          },
        },
      });

      const config = await tx.globalSyncConfig.findUnique({ where: { id: 1 } });
      if (config && existingTest.createdAt >= config.newRecordsSince) {
        const alreadyTracked = await tx.labFormat.findFirst({
          where: { organizationId: orgId, testId: id },
          select: { id: true },
        });
        if (!alreadyTracked) {
          const { parameters, ...formatFields } = data;
          const localParameters = await tx.parameter.findMany({
            where: { organizationId: orgId, id: { in: parameterIds } },
            select: { id: true, globalParameterId: true },
          });
          const globalParameterIds = new Map(localParameters.map((parameter) => [parameter.id, parameter.globalParameterId]));
          const formatRows = parameters.map((parameter: any) => ({
            ...parameter,
            parameterGlobalId: parameter.parameterId
              ? globalParameterIds.get(Number(parameter.parameterId)) ?? null
              : null,
          }));
          await tx.labFormat.create({
            data: {
              organizationId: orgId,
              testId: id,
              name: typeof data.template === "string" && data.template.trim()
                ? data.template.trim()
                : "Default",
              payload: JSON.parse(JSON.stringify({
                ...formatFields,
                parameters: formatRows,
              })) as Prisma.InputJsonValue,
            },
          });
        }
      }
      return updatedTest;
    });

    revalidatePath("/tests/formats");
    revalidatePath("/super-admin/central-library");
    return { success: true, data: result };
  } catch (error) {
    console.error("Update Test Configuration Error:", error);
    return { success: false, message: error instanceof Error ? error.message : "Failed to update format." };
  }
}
