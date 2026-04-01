// --- BLOCK app/actions/saas-onboarding.ts OPEN ---
"use server";

import { prisma } from '@/lib/prisma';

// The ID of your Super Admin / Master Template Lab
const TEMPLATE_ORG_ID = 1; 

export async function registerNewSaaSLab(data: {
    labName: string;
    email: string;
    phone: string;
    address: string;
    adminName: string;
    adminUsername: string;
    adminPassword: string; 
}) {
    try {
        console.log(`🚀 Starting SaaS Onboarding for: ${data.labName}`);

        // ==========================================
        // 1. CREATE THE NEW ORGANIZATION & ADMIN USER
        // ==========================================
        
        // Check if username already exists globally
        const existingUser = await prisma.user.findUnique({ where: { username: data.adminUsername } });
        if (existingUser) return { success: false, message: "Username already taken." };

        const newOrg = await prisma.organization.create({
            data: {
                name: data.labName,
                email: data.email,
                phone: data.phone,
                address: data.address,
                plan: "Free", // Default SaaS Plan
                isActive: true,
                
                // Create Default Lab Profile
                labProfiles: {
                    create: { name: data.labName, email: data.email, phone: data.phone, address: data.address }
                },
                
                // Create Default Report Settings
                reportSettings: {
                    create: { doc1Name: data.adminName, doc1Designation: "Lab Director" }
                },

                // Create Default Admin Role
                roles: {
                    create: { name: "Administrator", description: "Full Access" }
                }
            },
            include: { roles: true }
        });

        const newOrgId = newOrg.id;
        const adminRoleId = newOrg.roles[0].id;

        // Create the Admin User
        await prisma.user.create({
            data: {
                organizationId: newOrgId,
                name: data.adminName,
                username: data.adminUsername,
                password: data.adminPassword, // Note: In production, wrap this in bcrypt.hash()
                email: data.email,
                phone: data.phone,
                roleId: adminRoleId,
                isActive: true
            }
        });

        console.log(`✅ Created Org #${newOrgId} and Admin User.`);

        // ==========================================
        // 2. DICTIONARIES FOR RELATIONAL MAPPING
        // ==========================================
        // When we copy a Department from ID 5, it might become ID 102 in the new Org.
        // We must remember this mapping so when we copy Tests, they attach to Dept 102, not 5!
        
        const deptMap = new Map<number, number>();
        const methodMap = new Map<number, number>();
        const specimenMap = new Map<number, number>();
        const vacuMap = new Map<number, number>();
        const paramMap = new Map<number, number>();
        const testMap = new Map<number, number>();

        // ==========================================
        // 3. COPY SIMPLE MASTERS
        // ==========================================
        
        // Departments
        const templateDepts = await prisma.department.findMany({ where: { organizationId: TEMPLATE_ORG_ID } });
        for (const t of templateDepts) {
            const created = await prisma.department.create({
                data: { organizationId: newOrgId, name: t.name, code: t.code, description: t.description, isActive: t.isActive }
            });
            deptMap.set(t.id, created.id);
        }

        // Methods
        const templateMethods = await prisma.method.findMany({ where: { organizationId: TEMPLATE_ORG_ID } });
        for (const t of templateMethods) {
            const created = await prisma.method.create({
                data: { organizationId: newOrgId, name: t.name, code: t.code, isActive: t.isActive }
            });
            methodMap.set(t.id, created.id);
        }

        // Specimens
        const templateSpecimens = await prisma.specimen.findMany({ where: { organizationId: TEMPLATE_ORG_ID } });
        for (const t of templateSpecimens) {
            const created = await prisma.specimen.create({
                data: { organizationId: newOrgId, name: t.name, code: t.code, type: t.type, container: t.container, isActive: t.isActive }
            });
            specimenMap.set(t.id, created.id);
        }

        // Vacutainers
        const templateVacus = await prisma.vacutainer.findMany({ where: { organizationId: TEMPLATE_ORG_ID } });
        for (const t of templateVacus) {
            const created = await prisma.vacutainer.create({
                data: { organizationId: newOrgId, name: t.name, code: t.code, color: t.color, isActive: t.isActive }
            });
            vacuMap.set(t.id, created.id);
        }

        console.log(`✅ Copied Simple Masters.`);

        // ==========================================
        // 4. COPY PARAMETERS & RANGES
        // ==========================================
        const templateParams = await prisma.parameter.findMany({ 
            where: { organizationId: TEMPLATE_ORG_ID },
            include: { ranges: true }
        });

        for (const p of templateParams) {
            const createdParam = await prisma.parameter.create({
                data: {
                    organizationId: newOrgId,
                    name: p.name, code: p.code, displayName: p.displayName, department: p.department, unit: p.unit, method: p.method,
                    inputType: p.inputType, decimals: p.decimals, price: p.price, isActive: p.isActive, options: p.options,
                    resultAlignment: p.resultAlignment, isMultiValue: p.isMultiValue,
                    reportTitle: p.reportTitle, colCaption1: p.colCaption1, colCaption2: p.colCaption2, colCaption3: p.colCaption3, colCaption4: p.colCaption4, colCaption5: p.colCaption5,
                    isFormula: p.isFormula, billingOnly: p.billingOnly, interpretation: p.interpretation,
                    
                    // Copy ranges directly inside the create call
                    ranges: {
                        create: p.ranges.map(r => ({
                            organizationId: newOrgId,
                            gender: r.gender, minAge: r.minAge, maxAge: r.maxAge, minAgeUnit: r.minAgeUnit, maxAgeUnit: r.maxAgeUnit,
                            normalOperator: r.normalOperator, lowRange: r.lowRange, highRange: r.highRange, normalRange: r.normalRange,
                            normalValue: r.normalValue, abnormalValue: r.abnormalValue,
                            criticalOperator: r.criticalOperator, criticalLow: r.criticalLow, criticalHigh: r.criticalHigh, criticalValue: r.criticalValue
                        }))
                    }
                }
            });
            paramMap.set(p.id, createdParam.id);
        }
        console.log(`✅ Copied ${templateParams.length} Parameters with ranges.`);

        // ==========================================
        // 5. COPY TESTS & TEST CONFIGURATIONS
        // ==========================================
        const templateTests = await prisma.test.findMany({
            where: { organizationId: TEMPLATE_ORG_ID },
            include: { parameters: true }
        });

        for (const t of templateTests) {
            // Re-map the relational IDs to the newly created masters
            const newDeptId = t.departmentId ? deptMap.get(t.departmentId) : null;
            const newMethodId = t.methodId ? methodMap.get(t.methodId) : null;
            const newSpecimenId = t.specimenId ? specimenMap.get(t.specimenId) : null;
            const newVacuId = t.vacutainerId ? vacuMap.get(t.vacutainerId) : null;

            const createdTest = await prisma.test.create({
                data: {
                    organizationId: newOrgId,
                    name: t.name, code: t.code, displayName: t.displayName, price: t.price, type: t.type, description: t.description,
                    departmentId: newDeptId || null, methodId: newMethodId || null, specimenId: newSpecimenId || null, vacutainerId: newVacuId || null,
                    sampleVolume: t.sampleVolume, barcodeCopies: t.barcodeCopies,
                    minDays: t.minDays, minHours: t.minHours, minMinutes: t.minMinutes, maxDays: t.maxDays, maxHours: t.maxHours, maxMinutes: t.maxMinutes,
                    resultType: t.resultType, template: t.template, instructions: t.instructions,
                    isInterpretationNeeded: t.isInterpretationNeeded, interpretation: t.interpretation,
                    reportTitle: t.reportTitle, colCaption1: t.colCaption1, colCaption2: t.colCaption2, colCaption3: t.colCaption3, colCaption4: t.colCaption4, colCaption5: t.colCaption5, labEquiName: t.labEquiName,
                    isFormulaNeeded: t.isFormulaNeeded, isCountNeeded: t.isCountNeeded, targetCount: t.targetCount,
                    lmpRequired: t.lmpRequired, idRequired: t.idRequired, consentRequired: t.consentRequired, printNextPage: t.printNextPage, billingOnly: t.billingOnly,
                    isCulture: t.isCulture, cultureColumns: t.cultureColumns,
                    isConfigured: t.isConfigured, isActive: t.isActive,

                    // Re-map Test-Parameter links
                    parameters: {
                        create: t.parameters.map(tp => ({
                            organizationId: newOrgId,
                            parameterId: tp.parameterId ? paramMap.get(tp.parameterId) || null : null,
                            order: tp.order, isHeading: tp.isHeading, headingText: tp.headingText,
                            isCultureField: tp.isCultureField, isActive: tp.isActive, formula: tp.formula, isCountDependent: tp.isCountDependent
                        }))
                    }
                }
            });
            testMap.set(t.id, createdTest.id);
        }
        console.log(`✅ Copied ${templateTests.length} Tests and Configurations.`);

        // ==========================================
        // 6. COPY PACKAGE LINKS (TEST BUNDLES)
        // ==========================================
        const templatePackageLinks = await prisma.packageTest.findMany({
            where: { package: { organizationId: TEMPLATE_ORG_ID } }
        });

        if (templatePackageLinks.length > 0) {
            const mappedPackageLinks = templatePackageLinks.map(pt => ({
                packageId: testMap.get(pt.packageId)!,
                testId: testMap.get(pt.testId)!
            })).filter(pt => pt.packageId && pt.testId);

            await prisma.packageTest.createMany({ data: mappedPackageLinks });
        }

        console.log(`🎉 Onboarding Complete! Organization ${newOrgId} is fully populated and ready.`);
        return { success: true, message: "Laboratory registered and populated successfully!", organizationId: newOrgId };

    } catch (error: any) {
        console.error("❌ SAAS ONBOARDING FAILED:", error);
        return { success: false, message: "Onboarding failed: " + error.message };
    }
}
// --- BLOCK app/actions/saas-onboarding.ts CLOSE ---