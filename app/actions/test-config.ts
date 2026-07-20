"use server";

// Assuming you have a Prisma client instance exported from a lib folder.
// If your prisma client is somewhere else, adjust this import!
import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient(); 

export async function updateTestConfiguration(testId: number, data: any) {
    try {
        // 1. Ensure testId is a Number
        const id = Number(testId);

        // 2. Fetch the existing test to get the organizationId
        const existingTest = await prisma.test.findUnique({
            where: { id: id },
            select: { organizationId: true }
        });

        if (!existingTest) {
            return { success: false, message: "Test not found." };
        }

        // 3. Force cast fields to Numbers for Prisma
        const specimenId = data.specimenId ? Number(data.specimenId) : null;
        const targetCount = data.targetCount ? Number(data.targetCount) : null;

        // 4. Update the test and its nested parameters
        const updatedTest = await prisma.test.update({
            where: { id: id },
            data: {
                // Scalar fields
                resultType: data.resultType,
                template: data.template,
                printNextPage: Boolean(data.printNextPage),
                billingOnly: Boolean(data.billingOnly),
                reportTitle: data.reportTitle,
                specimenId: specimenId, 
                colCaption1: data.colCaption1,
                colCaption2: data.colCaption2,
                colCaption3: data.colCaption3,
                colCaption4: data.colCaption4,
                colCaption5: data.colCaption5,
                labEquiName: data.labEquiName,
                isFormulaNeeded: Boolean(data.isFormulaNeeded),
                isCountNeeded: Boolean(data.isCountNeeded),
                targetCount: targetCount, 
                isInterpretationNeeded: Boolean(data.isInterpretationNeeded),
                interpretation: data.interpretation,
                cultureColumns: data.cultureColumns, // This is already a JSON string from the frontend
                isConfigured: true, 
                
                // Relational update for Parameters
                parameters: {
                    deleteMany: {}, // Clear the existing parameters for this test
                    create: data.parameters.map((p: any) => ({
                        organizationId: existingTest.organizationId, 
                        parameterId: p.parameterId ? Number(p.parameterId) : null,
                        order: Number(p.order),
                        isHeading: Boolean(p.isHeading),
                        headingText: p.headingText || null,
                        isActive: Boolean(p.isActive),
                        formula: p.formula || null,
                        isCountDependent: Boolean(p.isCountDependent),
                        isCultureField: Boolean(p.isCultureField)
                    }))
                }
            }
        });

        // 5. Refresh the page data on the frontend
        revalidatePath('/tests/formats');
        
        return { success: true, data: updatedTest };
        
    } catch (error: any) {
        console.error("Prisma update error:", error);
        return { success: false, message: error.message || "Failed to update format" };
    }
}