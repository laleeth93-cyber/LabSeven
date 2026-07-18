// --- BLOCK app/actions/test-config.ts OPEN ---
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateTestConfiguration(id: number, data: any) {
    try {
        // 1. Update the main Test record with all the format settings
        await prisma.test.update({
            where: { id },
            data: {
                resultType: data.resultType,
                template: data.template,
                printNextPage: data.printNextPage,
                billingOnly: data.billingOnly,
                reportTitle: data.reportTitle,
                // Ensure specimenId is saved as an integer if it exists
                specimenId: data.specimenId ? parseInt(data.specimenId) : null,
                colCaption1: data.colCaption1,
                colCaption2: data.colCaption2,
                colCaption3: data.colCaption3,
                colCaption4: data.colCaption4,
                colCaption5: data.colCaption5,
                labEquiName: data.labEquiName,
                isFormulaNeeded: data.isFormulaNeeded,
                isCountNeeded: data.isCountNeeded,
                targetCount: data.targetCount,
                isInterpretationNeeded: data.isInterpretationNeeded,
                interpretation: data.interpretation,
                cultureColumns: data.cultureColumns,
            }
        });

        // 2. Handle the nested Parameters 
        // The safest/cleanest way to update a list in Prisma is to delete the old ones and create the new ones in a single transaction
        if (data.parameters && Array.isArray(data.parameters)) {
            await prisma.$transaction([
                prisma.testParameter.deleteMany({
                    where: { testId: id }
                }),
                prisma.testParameter.createMany({
                    data: data.parameters.map((p: any) => ({
                        testId: id,
                        parameterId: p.parameterId,
                        order: p.order,
                        isHeading: p.isHeading,
                        headingText: p.headingText,
                        isActive: p.isActive,
                        formula: p.formula,
                        isCountDependent: p.isCountDependent,
                        isCultureField: p.isCultureField
                    }))
                })
            ]);
        }

        // 3. THE MAGIC FIX: Tell Next.js to purge the cache and refresh the data on the frontend!
        revalidatePath('/tests');
        revalidatePath('/tests/formats');
        
        // If you are fetching this data on the result entry screen too, clear that cache as well
        revalidatePath('/results/entry');

        return { success: true, message: "Configuration saved successfully!" };

    } catch (error: any) {
        console.error("Failed to update test configuration:", error);
        return { success: false, message: error.message || "Failed to update configuration" };
    }
}
// --- BLOCK app/actions/test-config.ts CLOSE ---