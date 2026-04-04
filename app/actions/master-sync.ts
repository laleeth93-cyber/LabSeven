// --- BLOCK app/actions/master-sync.ts OPEN ---
"use server";

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

const MASTER_ORG_ID = 1;

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
        if (item.code && targetCodeMap.has(item.code)) {
            idMap.set(item.id, targetCodeMap.get(item.code) as number);
        } else {
            const { id, organizationId, createdAt, updatedAt, ...data } = item;
            const created = await modelDelegate.create({ data: { ...data, organizationId: targetOrgId } });
            idMap.set(item.id, created.id);
        }
    }
    return idMap;
}

export async function syncMasterLibraryToLab(targetOrgId: number) {
    try {
        if (targetOrgId === MASTER_ORG_ID) return { success: true, skipped: true };

        const deptMap = await syncLookupTable(prisma.department, targetOrgId);
        const specMap = await syncLookupTable(prisma.specimen, targetOrgId);
        const methMap = await syncLookupTable(prisma.method, targetOrgId);
        const vacuMap = await syncLookupTable(prisma.vacutainer, targetOrgId);

        const masterParams = await prisma.parameter.findMany({ 
            where: { organizationId: MASTER_ORG_ID },
            include: { ranges: true }
        });
        const targetParams = await prisma.parameter.findMany({ where: { organizationId: targetOrgId } });
        
        // 🚨 FIX: Filter out null codes and cast to string explicitly
        const targetParamCodeMap = new Map<string, number>(
            targetParams
                .filter(p => p.code !== null)
                .map(p => [p.code as string, p.id])
        );
        const paramMap = new Map<number, number>();

        for (const mp of masterParams) {
            if (mp.code && targetParamCodeMap.has(mp.code)) {
                paramMap.set(mp.id, targetParamCodeMap.get(mp.code) as number);
            } else {
                const { id, organizationId, createdAt, updatedAt, ranges, ...pData } = mp;
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

        const masterTests = await prisma.test.findMany({ 
            where: { organizationId: MASTER_ORG_ID },
            include: { parameters: true }
        });
        const targetTests = await prisma.test.findMany({ where: { organizationId: targetOrgId } });
        
        const targetTestCodeMap = new Map<string, number>(
            targetTests
                .filter(t => t.code !== null)
                .map(t => [t.code as string, t.id])
        );

        for (const mt of masterTests) {
            if (!targetTestCodeMap.has(mt.code)) {
                const { id, organizationId, createdAt, updatedAt, parameters, departmentId, specimenId, methodId, vacutainerId, outsourceLabId, ...tData } = mt;
                
                await prisma.test.create({
                    data: {
                        ...tData,
                        organizationId: targetOrgId,
                        departmentId: departmentId ? deptMap.get(departmentId) : null,
                        specimenId: specimenId ? specMap.get(specimenId) : null,
                        methodId: methodId ? methMap.get(methodId) : null,
                        vacutainerId: vacutainerId ? vacuMap.get(vacutainerId) : null,
                        parameters: {
                            create: parameters.map(tp => {
                                return {
                                    organizationId: targetOrgId,
                                    parameterId: tp.parameterId ? paramMap.get(tp.parameterId) : null,
                                    order: tp.order,
                                    isHeading: tp.isHeading,
                                    headingText: tp.headingText,
                                    isCultureField: tp.isCultureField,
                                    isActive: tp.isActive,
                                    formula: tp.formula,
                                    isCountDependent: tp.isCountDependent
                                };
                            })
                        }
                    }
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

        return { success: true, message: `Successfully pushed library updates to ${successCount} laboratories.` };
    } catch (error) {
        console.error("Global Push Error:", error);
        return { success: false, message: "An error occurred during global sync." };
    }
}
// --- BLOCK app/actions/master-sync.ts CLOSE ---