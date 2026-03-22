// --- BLOCK app/actions/test-config.ts OPEN ---
"use server";

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateTestConfiguration(testId: number, data: any) {
  try {
    if (!testId) {
        return { success: false, message: "Invalid Test ID" };
    }

    const payload: any = {};

    if (data.method !== undefined) payload.methodId = data.method ? parseInt(data.method) : null;
    if (data.specimen !== undefined) payload.specimenId = data.specimen ? parseInt(data.specimen) : null;
    if (data.vacutainer !== undefined) payload.vacutainerId = data.vacutainer ? parseInt(data.vacutainer) : null;
    if (data.sampleVolume !== undefined) payload.sampleVolume = data.sampleVolume;
    if (data.barcodeCopies !== undefined) payload.barcodeCopies = parseInt(data.barcodeCopies) || 1;

    if (data.minDays !== undefined) payload.minDays = parseInt(data.minDays) || 0;
    if (data.minHours !== undefined) payload.minHours = parseInt(data.minHours) || 0;
    if (data.minMinutes !== undefined) payload.minMinutes = parseInt(data.minMinutes) || 0;
    if (data.maxDays !== undefined) payload.maxDays = parseInt(data.maxDays) || 0;
    if (data.maxHours !== undefined) payload.maxHours = parseInt(data.maxHours) || 0;
    if (data.maxMinutes !== undefined) payload.maxMinutes = parseInt(data.maxMinutes) || 0;

    if (data.resultType !== undefined) payload.resultType = data.resultType;
    if (data.template !== undefined) payload.template = data.template;
    if (data.printNextPage !== undefined) payload.printNextPage = data.printNextPage;
    if (data.billingOnly !== undefined) payload.billingOnly = data.billingOnly;
    
    if (data.reportTitle !== undefined) payload.reportTitle = data.reportTitle;
    if (data.colCaption1 !== undefined) payload.colCaption1 = data.colCaption1;
    if (data.colCaption2 !== undefined) payload.colCaption2 = data.colCaption2;
    if (data.colCaption3 !== undefined) payload.colCaption3 = data.colCaption3;
    if (data.colCaption4 !== undefined) payload.colCaption4 = data.colCaption4;
    if (data.colCaption5 !== undefined) payload.colCaption5 = data.colCaption5;
    if (data.labEquiName !== undefined) payload.labEquiName = data.labEquiName;
    
    if (data.isFormulaNeeded !== undefined) payload.isFormulaNeeded = data.isFormulaNeeded;
    if (data.isCountNeeded !== undefined) payload.isCountNeeded = data.isCountNeeded;
    if (data.targetCount !== undefined) payload.targetCount = data.targetCount ? parseInt(data.targetCount) : null;
    
    if (data.isInterpretationNeeded !== undefined) payload.isInterpretationNeeded = data.isInterpretationNeeded;
    if (data.interpretation !== undefined) payload.interpretation = data.interpretation || ''; 

    // NEW CULUTURE COLUMNS DATA
    if (data.cultureColumns !== undefined) payload.cultureColumns = data.cultureColumns;

    payload.isConfigured = true;

    await prisma.$transaction(async (tx) => {
        await tx.test.update({
            where: { id: testId },
            data: payload
        });

        if (data.parameters && Array.isArray(data.parameters)) {
            await tx.testParameter.deleteMany({ where: { testId } });

            if (data.parameters.length > 0) {
                const paramsToInsert = data.parameters.map((p: any, index: number) => {
                    let pId: number | null = p.parameterId ? parseInt(p.parameterId) : null;
                    if (pId !== null && (isNaN(pId) || pId <= 0)) pId = null;

                    return {
                        testId: testId,
                        parameterId: pId, 
                        order: parseInt(p.order) || (index + 1),
                        isHeading: Boolean(p.isHeading),
                        headingText: p.headingText || '',
                        isCultureField: Boolean(p.isCultureField), 
                        isActive: p.isActive !== undefined ? Boolean(p.isActive) : true,
                        formula: p.formula || '',
                        isCountDependent: p.isCountDependent !== undefined ? Boolean(p.isCountDependent) : false
                    };
                });

                await tx.testParameter.createMany({
                    data: paramsToInsert
                });
            }
        }
    });
    
    revalidatePath('/tests/configuration');
    revalidatePath('/tests/formats');
    return { success: true, message: "Configuration updated successfully" };

  } catch (error: any) {
    console.error("[UpdateConfig] FATAL ERROR:", error);
    return { success: false, message: error.message || 'Database error occurred' };
  }
}
// --- BLOCK app/actions/test-config.ts CLOSE ---