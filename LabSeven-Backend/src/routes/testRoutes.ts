// --- BLOCK LabSeven-Backend/src/routes/testRoutes.ts OPEN ---
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Helper to get orgId securely from the Next.js Frontend headers
const getOrgId = (req: any) => Number(req.headers['x-org-id']) || 1;

// 1. GENERATE TEST CODE
router.get('/generate-code', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const type = req.query.type as string || 'Test';
        const prefix = type === 'Package' ? 'PKG' : 'TST';
        
        const allTests = await prisma.test.findMany({ 
            where: { organizationId: orgId }, 
            select: { code: true } 
        });
        
        let maxNum = 0;
        const regex = new RegExp(`^${prefix}-(\\d+)$`);
        
        allTests.forEach(t => {
            const match = t.code.match(regex);
            if (match && match[1]) {
                const num = parseInt(match[1], 10);
                if (num > maxNum) maxNum = num;
            }
        });
        res.json({ success: true, data: `${prefix}-${(maxNum + 1).toString().padStart(4, '0')}` });
    } catch (error) {
        const prefix = req.query.type === 'Package' ? 'PKG' : 'TST';
        res.json({ success: true, data: `${prefix}-0001` });
    }
});

// 2. GET OUTSOURCE LABS
router.get('/outsource-labs', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const data = await prisma.doctor.findMany({ 
            where: { type: 'Outsource', isActive: true, organizationId: orgId } 
        });
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, data: [] });
    }
});

// 3. GET TESTS FOR FORMATS (Lightweight)
router.get('/formats', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const data = await prisma.test.findMany({
            where: { organizationId: orgId }, 
            select: {
                id: true, name: true, code: true, template: true, printNextPage: true, reportTitle: true,
                department: { select: { name: true } },
                _count: { select: { parameters: true } }
            },
            orderBy: { name: 'asc' }
        });
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to load tests.", data: [] });
    }
});

// 4. GET ALL TESTS
router.get('/', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const data = await prisma.test.findMany({
            where: { organizationId: orgId }, 
            orderBy: { updatedAt: 'desc' },
            include: {
                department: true, method: true, specimen: true, vacutainer: true, outsourceLab: true,
                parameters: { include: { parameter: true } }
            }
        });
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to load tests.", data: [] });
    }
});

// 5. GET TEST BY ID
router.get('/:id', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const data = await prisma.test.findFirst({
            where: { id: Number(req.params.id), organizationId: orgId }, 
            include: {
                department: true, method: true, specimen: true, vacutainer: true, outsourceLab: true,
                parameters: { include: { parameter: true }, orderBy: { order: 'asc' } }
            }
        });
        if (!data) return res.status(404).json({ success: false, message: "Test not found" });
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: "Test not found" });
    }
});

// 6. CREATE TEST
router.post('/', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const data = req.body;
        const actualType = data.testType || data.type || 'Test';
        const prefix = actualType === 'Package' ? 'PKG' : 'TST';

        let code = data.code;
        if (!code) {
             // Fallback code generator if the frontend didn't supply one
             code = `${prefix}-${Date.now().toString().slice(-4)}`;
        }
        
        let exists = await prisma.test.findUnique({ where: { organizationId_code: { organizationId: orgId, code: code } } });
        const regex = new RegExp(`^${prefix}-(\\d+)$`);
        
        while(exists) {
            const match = code.match(regex);
            let num = match ? parseInt(match[1], 10) + 1 : 1;
            code = `${prefix}-${num.toString().padStart(4, '0')}`;
            exists = await prisma.test.findUnique({ where: { organizationId_code: { organizationId: orgId, code: code } } });
        }

        const newTest = await prisma.test.create({
            data: {
                organizationId: orgId, 
                name: data.name || data.testName, displayName: data.displayName || data.displayTestName || null,
                code: code, type: actualType, price: parseFloat(data.price) || 0,
                departmentId: data.departmentId ? parseInt(data.departmentId) : null,
                methodId: data.methodId ? parseInt(data.methodId) : null,
                specimenId: data.specimenId ? parseInt(data.specimenId) : null,
                vacutainerId: data.vacutainerId ? parseInt(data.vacutainerId) : null,
                sampleVolume: data.sampleVolume || null, barcodeCopies: data.barcodeCopies ? parseInt(data.barcodeCopies) : 1,
                isConfigured: true, 
                minDays: parseInt(data.minDays) || 0, minHours: parseInt(data.minHours) || 0, minMinutes: parseInt(data.minMinutes) || 0,
                maxDays: parseInt(data.maxDays) || 0, maxHours: parseInt(data.maxHours) || 0, maxMinutes: parseInt(data.maxMinutes) || 0,
                instructions: data.instructions || data.guidelines || '',
                lmpRequired: data.lmpRequired || false, idRequired: data.idRequired || false, consentRequired: data.consentRequired || false,
                billingOnly: data.billingOnly || false, isCulture: data.isCulture || false, cultureColumns: data.cultureColumns || null,
                isOutsourced: data.isOutsourced || false, outsourceLabId: data.outsourceLabId ? parseInt(data.outsourceLabId) : null,
                isActive: data.isActive ?? true,
                parameters: {
                    create: (data.parameters || []).map((p: any, index: number) => ({
                        organizationId: orgId, parameterId: parseInt(p.parameterId), order: index + 1
                    }))
                }
            }
        });
        res.json({ success: true, data: newTest });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || "Failed to create test." });
    }
});

// 7. UPDATE TEST
router.put('/:id', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const id = Number(req.params.id);
        const data = req.body;
        
        const existing = await prisma.test.findFirst({ where: { id: id, organizationId: orgId } });
        if (!existing) return res.status(404).json({ success: false, message: "Test not found." });

        const updated = await prisma.test.update({
            where: { id },
            data: {
                name: data.name || data.testName, displayName: data.displayName || data.displayTestName || null,
                code: data.code, type: data.testType || 'Test', price: parseFloat(data.price) || 0,
                departmentId: data.departmentId ? parseInt(data.departmentId) : null,
                methodId: data.methodId ? parseInt(data.methodId) : null,
                specimenId: data.specimenId ? parseInt(data.specimenId) : null,
                vacutainerId: data.vacutainerId ? parseInt(data.vacutainerId) : null,
                sampleVolume: data.sampleVolume || null, barcodeCopies: data.barcodeCopies ? parseInt(data.barcodeCopies) : 1,
                isConfigured: true, 
                minDays: parseInt(data.minDays) || 0, minHours: parseInt(data.minHours) || 0, minMinutes: parseInt(data.minMinutes) || 0,
                maxDays: parseInt(data.maxDays) || 0, maxHours: parseInt(data.maxHours) || 0, maxMinutes: parseInt(data.maxMinutes) || 0,
                instructions: data.instructions || data.guidelines || '',
                lmpRequired: data.lmpRequired, idRequired: data.idRequired, consentRequired: data.consentRequired,
                billingOnly: data.billingOnly, isCulture: data.isCulture, cultureColumns: data.cultureColumns,
                isOutsourced: data.isOutsourced, outsourceLabId: data.outsourceLabId ? parseInt(data.outsourceLabId) : null,
                isActive: data.isActive
            }
        });

        if (data.parameters) {
            await prisma.testParameter.deleteMany({ where: { testId: id } });
            if (data.parameters.length > 0) {
                await prisma.testParameter.createMany({
                    data: data.parameters.map((p: any, index: number) => ({
                        organizationId: orgId, testId: id, parameterId: parseInt(p.parameterId), order: index + 1
                    }))
                });
            }
        }
        res.json({ success: true, data: updated });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || "Failed to update test." });
    }
});

// 8. DELETE TEST
router.delete('/:id', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const id = Number(req.params.id);
        const existing = await prisma.test.findFirst({ where: { id: id, organizationId: orgId } });
        if (!existing) return res.status(404).json({ success: false, message: "Test not found." });

        await prisma.test.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete test." });
    }
});

// 9. TOGGLE STATUS
router.patch('/:id/toggle', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const id = Number(req.params.id);
        const { currentStatus } = req.body;
        
        const existing = await prisma.test.findFirst({ where: { id: id, organizationId: orgId } });
        if (!existing) return res.status(404).json({ success: false, message: "Test not found." });

        await prisma.test.update({ where: { id }, data: { isActive: !currentStatus } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to toggle status." });
    }
});

export default router;
// --- BLOCK LabSeven-Backend/src/routes/testRoutes.ts CLOSE ---