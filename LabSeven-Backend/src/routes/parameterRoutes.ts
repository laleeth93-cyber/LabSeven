// --- BLOCK LabSeven-Backend/src/routes/parameterRoutes.ts OPEN ---
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Helpers
const getOrgId = (req: any) => Number(req.headers['x-org-id']) || 1;

function safeFloat(val: any): number | null {
    if (val === '' || val === null || val === undefined) return null;
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
}

function safeInt(val: any, defaultVal = 0): number {
    if (val === '' || val === null || val === undefined) return defaultVal;
    const num = parseInt(val, 10);
    return isNaN(num) ? defaultVal : num;
}

// 1. GENERATE CODE
router.get('/generate-code', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const allParams = await prisma.parameter.findMany({
            where: { organizationId: orgId },
            select: { code: true }
        });

        let maxNum = 0;
        allParams.forEach(p => {
            if (p.code) {
                const match = p.code.match(/PAR-(\d+)/);
                if (match && match[1]) {
                    const num = parseInt(match[1], 10);
                    if (num > maxNum) maxNum = num;
                }
            }
        });
        res.json({ success: true, data: `PAR-${(maxNum + 1).toString().padStart(4, '0')}` });
    } catch (error) {
        res.json({ success: true, data: 'PAR-0001' });
    }
});

// 2. GET ALL PARAMETERS
router.get('/', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const data = await prisma.parameter.findMany({
            where: { organizationId: orgId },
            orderBy: { updatedAt: 'desc' },
            include: { ranges: true }
        });
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to load parameters.", data: [] });
    }
});

// 3. GET SINGLE PARAMETER
router.get('/:id', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const data = await prisma.parameter.findFirst({
            where: { id: Number(req.params.id), organizationId: orgId },
            include: { ranges: true }
        });
        if (!data) return res.status(404).json({ success: false, message: "Parameter not found" });
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch parameter" });
    }
});

// 4. CREATE PARAMETER
router.post('/', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const data = req.body;

        const existingName = await prisma.parameter.findFirst({
            where: { name: { equals: data.name, mode: 'insensitive' }, organizationId: orgId }
        });
        if (existingName) return res.status(400).json({ success: false, message: "Parameter name already exists in your lab." });

        let finalCode = data.code;
        if (!finalCode) {
             finalCode = `PAR-${Date.now().toString().slice(-4)}`; // Fallback
        }
        
        let exists = await prisma.parameter.findFirst({ where: { code: finalCode, organizationId: orgId } });
        while(exists) {
            const match = finalCode.match(/PAR-(\d+)/);
            let num = match ? parseInt(match[1], 10) + 1 : 1;
            finalCode = `PAR-${num.toString().padStart(4, '0')}`;
            exists = await prisma.parameter.findFirst({ where: { code: finalCode, organizationId: orgId } });
        }

        const newParam = await prisma.parameter.create({
            data: {
                organizationId: orgId, name: data.name, code: finalCode, displayName: data.displayName || null,
                department: data.department || null, unit: data.unit || null, inputType: data.inputType || 'Numerical',
                price: safeFloat(data.price) || 0, isActive: data.isActive ?? true, method: data.method || null,
                decimals: safeInt(data.decimals, 2), lowMessage: data.lowMessage || null, highMessage: data.highMessage || null,
                panicMessage: data.panicMessage || null, interpretation: data.interpretation || null,
                resultAlignment: data.resultAlignment || 'Beside', isMultiValue: data.isMultiValue || false,
                options: data.options || [], reportTitle: data.reportTitle || null,
                colCaption1: data.colCaption1 || null, colCaption2: data.colCaption2 || null, colCaption3: data.colCaption3 || null,
                colCaption4: data.colCaption4 || null, colCaption5: data.colCaption5 || null,
                isFormula: data.isFormula || false, billingOnly: data.billingOnly || false,
                ranges: {
                    create: (data.ranges || []).map((r: any) => ({
                        organizationId: orgId, gender: r.gender || 'Both', minAge: safeInt(r.minAge, 0), maxAge: safeInt(r.maxAge, 100),
                        minAgeUnit: r.minAgeUnit || 'Years', maxAgeUnit: r.maxAgeUnit || 'Years', normalOperator: r.normalOperator || 'Between',
                        lowRange: safeFloat(r.lowRange), highRange: safeFloat(r.highRange), normalRange: r.normalRange || null,
                        normalValue: r.normalValue || null, abnormalValue: r.abnormalValue || null, criticalOperator: r.criticalOperator || 'Between',
                        criticalLow: safeFloat(r.criticalLow), criticalHigh: safeFloat(r.criticalHigh), criticalValue: r.criticalValue || null,
                    }))
                }
            }
        });
        res.json({ success: true, data: newParam });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || "Failed to create parameter." });
    }
});

// 5. UPDATE PARAMETER
router.put('/:id', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const id = Number(req.params.id);
        const data = req.body;

        const existingParam = await prisma.parameter.findFirst({ where: { id: id, organizationId: orgId } });
        if (!existingParam) return res.status(404).json({ success: false, message: "Parameter not found." });

        const existingName = await prisma.parameter.findFirst({
            where: { name: { equals: data.name, mode: 'insensitive' }, organizationId: orgId, id: { not: id } }
        });
        if (existingName) return res.status(400).json({ success: false, message: "Parameter name already exists in your lab." });

        const updated = await prisma.parameter.update({
            where: { id },
            data: {
                name: data.name, code: data.code, displayName: data.displayName || null, department: data.department || null,
                unit: data.unit || null, inputType: data.inputType || 'Numerical', price: safeFloat(data.price) || 0,
                isActive: data.isActive, method: data.method || null, decimals: safeInt(data.decimals, 2),
                lowMessage: data.lowMessage || null, highMessage: data.highMessage || null, panicMessage: data.panicMessage || null,
                interpretation: data.interpretation || null, resultAlignment: data.resultAlignment || 'Beside',
                isMultiValue: data.isMultiValue || false, options: data.options || [], reportTitle: data.reportTitle || null,
                colCaption1: data.colCaption1 || null, colCaption2: data.colCaption2 || null, colCaption3: data.colCaption3 || null,
                colCaption4: data.colCaption4 || null, colCaption5: data.colCaption5 || null,
                isFormula: data.isFormula || false, billingOnly: data.billingOnly || false,
                ranges: {
                    deleteMany: {}, // Deletes old ranges
                    create: (data.ranges || []).map((r: any) => ({
                        organizationId: orgId, gender: r.gender || 'Both', minAge: safeInt(r.minAge, 0), maxAge: safeInt(r.maxAge, 100),
                        minAgeUnit: r.minAgeUnit || 'Years', maxAgeUnit: r.maxAgeUnit || 'Years', normalOperator: r.normalOperator || 'Between',
                        lowRange: safeFloat(r.lowRange), highRange: safeFloat(r.highRange), normalRange: r.normalRange || null,
                        normalValue: r.normalValue || null, abnormalValue: r.abnormalValue || null, criticalOperator: r.criticalOperator || 'Between',
                        criticalLow: safeFloat(r.criticalLow), criticalHigh: safeFloat(r.criticalHigh), criticalValue: r.criticalValue || null,
                    }))
                }
            }
        });
        res.json({ success: true, data: updated });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || "Failed to update parameter." });
    }
});

// 6. TOGGLE STATUS
router.patch('/:id/status', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const id = Number(req.params.id);
        const { isActive } = req.body;
        
        const existingParam = await prisma.parameter.findFirst({ where: { id: id, organizationId: orgId } });
        if (!existingParam) return res.status(404).json({ success: false, message: "Parameter not found." });

        await prisma.parameter.update({ where: { id }, data: { isActive } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update status." });
    }
});

// 7. DELETE PARAMETER
router.delete('/:id', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const id = Number(req.params.id);
        
        const existingParam = await prisma.parameter.findFirst({ where: { id: id, organizationId: orgId } });
        if (!existingParam) return res.status(404).json({ success: false, message: "Parameter not found." });

        await prisma.parameter.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete parameter. It may be linked to existing tests." });
    }
});

export default router;
// --- BLOCK LabSeven-Backend/src/routes/parameterRoutes.ts CLOSE ---