// --- BLOCK app/actions/master-sync.ts OPEN ---
"use server";

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

const MASTER_ORG_ID = 1;

// Helper function to safely sync lookup tables (Masters) based on unique 'code'
async function syncLookupTable(modelDelegate: any, targetOrgId: number) {
    const masterItems = await modelDelegate.findMany({ where: { organizationId: MASTER_ORG_ID } });
    const targetItems = await modelDelegate.findMany({ where: { organizationId: targetOrgId } });
    
    const targetCodeMap = new Map<string, number>(
        targetItems
            .filter((i: any) => i.code !== null)
            .map((i: any) => [i.code as string, i.id])
    );
    const idMap = new Map<number, number>();

    for (const item of masterItems) {
        const { id, organizationId, createdAt, updatedAt, ...data } = item;

        if (item.code && targetCodeMap.has(item.code)) {
            const existingId = targetCodeMap.get(item.code) as number;
            idMap.set(item.id, existingId);
            
            // 🚨 FORCE UPDATE existing lookup records to ensure names/flags perfectly match Master
            await modelDelegate.update({
                where: { id: existingId },
                data: { ...data }
            });
        } else {
            const created = await modelDelegate.create({ data: { ...data, organizationId: targetOrgId } });
            idMap.set(item.id, created.id);
        }
    }
    return idMap;
}

export async function syncMasterLibraryToLab(targetOrgId: number) {
    try {
        if (targetOrgId === MASTER_ORG_ID) return { success: true, skipped: true };

        // 1. SYNC CORE MASTERS (Will create missing or update existing)
        const deptMap = await syncLookupTable(prisma.department, targetOrgId);
        const specMap = await syncLookupTable(prisma.specimen, targetOrgId);
        const methMap = await syncLookupTable(prisma.method, targetOrgId);
        const vacuMap = await syncLookupTable(prisma.vacutainer, targetOrgId);
        await syncLookupTable(prisma.uOM, targetOrgId);
        await syncLookupTable(prisma.operator, targetOrgId);
        await syncLookupTable(prisma.labList, targetOrgId);

        // 2. SYNC MICROBIOLOGY & SENSITIVITY MASTERS
        await syncLookupTable(prisma.organism, targetOrgId);
        await syncLookupTable(prisma.antibiotic, targetOrgId);
        await syncLookupTable(prisma.antibioticClass, targetOrgId);
        await syncLookupTable(prisma.antibioticInterpretation, targetOrgId);
        await syncLookupTable(prisma.susceptibilityInfo, targetOrgId);

        // 3. SYNC PARAMETERS AND RANGES
        const masterParams = await prisma.parameter.findMany({ 
            where: { organizationId: MASTER_ORG_ID },
            include: { ranges: true }
        });
        const targetParams = await prisma.parameter.findMany({ where: { organizationId: targetOrgId } });
        
        const targetParamCodeMap = new Map<string, number>(
            targetParams.filter(p => p.code !== null).map(p => [p.code as string, p.id])
        );
        const paramMap = new Map<number, number>();

        for (const mp of masterParams) {
            const { id, organizationId, createdAt, updatedAt, ranges, ...pData } = mp;

            if (mp.code && targetParamCodeMap.has(mp.code)) {
                const existingParamId = targetParamCodeMap.get(mp.code) as number;
                paramMap.set(mp.id, existingParamId);

                // 🚨 Update existing parameter fields to match Master
                await prisma.parameter.update({
                    where: { id: existingParamId },
                    data: { ...pData }
                });

                // Completely replace ranges so they match Master perfectly
                await prisma.parameterRange.deleteMany({ where: { parameterId: existingParamId } });
                if (ranges && ranges.length > 0) {
                    await prisma.parameterRange.createMany({
                        data: ranges.map(r => {
                            const { id, parameterId, organizationId, createdAt, updatedAt, ...rData } = r;
                            return { ...rData, parameterId: existingParamId, organizationId: targetOrgId };
                        })
                    });
                }
            } else {
                const newParam = await prisma.parameter.create({
                    data: {
                        ...pData,
                        organizationId: targetOrgId,
                        ranges: {
                            create: ranges.map(r => {
                                const { id, parameterId, organizationId, createdAt, updatedAt, ...rData } = r;
                                return { ...rData, organizationId: targetOrgId };
                            })
                        }
                    }
                });
                paramMap.set(mp.id, newParam.id);
            }
        }

        // 4. SYNC TESTS AND THEIR CONFIGURATIONS (FORMATS/LAYOUTS)
        const masterTests = await prisma.test.findMany({ 
            where: { organizationId: MASTER_ORG_ID },
            include: { parameters: true, packageTests: true }
        });
        const targetTests = await prisma.test.findMany({ where: { organizationId: targetOrgId } });
        
        const targetTestCodeMap = new Map<string, number>(
            targetTests.filter(t => t.code !== null).map(t => [t.code as string, t.id])
        );

        const testIdMap = new Map<number, number>();

        for (const mt of masterTests) {
            const { id, organizationId, createdAt, updatedAt, parameters, packageTests, departmentId, specimenId, methodId, vacutainerId, outsourceLabId, ...tData } = mt;
            
            let targetTestId;

            if (mt.code && targetTestCodeMap.has(mt.code)) {
                targetTestId = targetTestCodeMap.get(mt.code) as number;
                
                // 🚨 UPDATE existing Test layout/format properties (isConfigured, template, colCaptions, etc.)
                await prisma.test.update({
                    where: { id: targetTestId },
                    data: {
                        ...tData,
                        departmentId: departmentId ? deptMap.get(departmentId) : null,
                        specimenId: specimenId ? specMap.get(specimenId) : null,
                        methodId: methodId ? methMap.get(methodId) : null,
                        vacutainerId: vacutainerId ? vacuMap.get(vacutainerId) : null,
                    }
                });

                // Clear old configuration formats to make way for the Master's format
                await prisma.testParameter.deleteMany({ where: { testId: targetTestId } });

            } else {
                const newTest = await prisma.test.create({
                    data: {
                        ...tData,
                        organizationId: targetOrgId,
                        departmentId: departmentId ? deptMap.get(departmentId) : null,
                        specimenId: specimenId ? specMap.get(specimenId) : null,
                        methodId: methodId ? methMap.get(methodId) : null,
                        vacutainerId: vacutainerId ? vacuMap.get(vacutainerId) : null,
                    }
                });
                targetTestId = newTest.id;
            }

            testIdMap.set(mt.id, targetTestId);

            // 🚨 Insert the exact Master Formats/Headings/Formulas into the Test Config
            if (parameters && parameters.length > 0) {
                await prisma.testParameter.createMany({
                    data: parameters.map(tp => ({
                        organizationId: targetOrgId,
                        testId: targetTestId,
                        parameterId: tp.parameterId ? paramMap.get(tp.parameterId) : null,
                        order: tp.order,
                        isHeading: tp.isHeading,
                        headingText: tp.headingText,
                        isCultureField: tp.isCultureField,
                        isActive: tp.isActive,
                        formula: tp.formula,
                        isCountDependent: tp.isCountDependent
                    }))
                });
            }
        }

        // 5. SYNC PACKAGE CONFIGURATIONS
        for (const mt of masterTests) {
            if (mt.type === 'Package' && mt.packageTests && mt.packageTests.length > 0) {
                const targetPackageId = testIdMap.get(mt.id);
                if (!targetPackageId) continue;
                
                // Replace package links
                await prisma.packageTest.deleteMany({ where: { packageId: targetPackageId } });
                await prisma.packageTest.createMany({
                    data: mt.packageTests
                        .map(pt => ({
                            packageId: targetPackageId,
                            testId: testIdMap.get(pt.testId) as number
                        }))
                        .filter(pt => pt.testId !== undefined)
                });
            }
        }

        return { success: true };
    } catch (error) {
        console.error(`Sync Error for Org ${targetOrgId}:`, error);
        return { success: false };
    }
}

export async function pushMasterDataToAllLabs() {
    try {
        const { orgId } = await requireAuth();
        if (orgId !== MASTER_ORG_ID) return { success: false, message: "Unauthorized." };

        const allOrgs = await prisma.organization.findMany({
            where: { isActive: true, id: { not: MASTER_ORG_ID } }
        });

        let successCount = 0;
        for (const org of allOrgs) {
            const res = await syncMasterLibraryToLab(org.id);
            if (res?.success && !res?.skipped) successCount++;
        }

        return { success: true, message: `Successfully pushed formats and configs to ${successCount} active laboratories.` };
    } catch (error) {
        console.error("Global Push Error:", error);
        return { success: false, message: "An error occurred during global sync." };
    }
}
// --- BLOCK app/actions/master-sync.ts CLOSE ---