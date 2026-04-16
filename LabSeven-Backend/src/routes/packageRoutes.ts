// --- BLOCK LabSeven-Backend/src/routes/packageRoutes.ts OPEN ---
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const getOrgId = (req: any) => Number(req.headers['x-org-id']) || 1;

function safeFloat(val: any): number | null {
    if (val === '' || val === null || val === undefined) return null;
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
}

// 1. GENERATE CODE
router.get('/generate-code', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const allParams = await prisma.test.findMany({
            where: { organizationId: orgId, type: 'Package' },
            select: { code: true }
        });

        let maxNum = 0;
        allParams.forEach(p => {
            if (p.code) {
                const match = p.code.match(/PKG-(\d+)/);
                if (match && match[1]) {
                    const num = parseInt(match[1], 10);
                    if (num > maxNum) maxNum = num;
                }
            }
        });
        res.json({ success: true, data: `PKG-${(maxNum + 1).toString().padStart(4, '0')}` });
    } catch (error) {
        res.json({ success: true, data: 'PKG-0001' });
    }
});

// 2. GET ALL PACKAGES
router.get('/', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const data = await prisma.test.findMany({
            where: { organizationId: orgId, type: 'Package' },
            orderBy: { updatedAt: 'desc' },
            include: { department: true }
        });
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to load packages.", data: [] });
    }
});

// 3. GET SINGLE PACKAGE
router.get('/:id', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const data = await prisma.test.findFirst({
            where: { id: Number(req.params.id), organizationId: orgId, type: 'Package' },
            include: { packageTests: { include: { test: true } } }
        });
        if (!data) return res.status(404).json({ success: false, message: "Package not found" });
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch package" });
    }
});

// 4. CREATE PACKAGE
router.post('/', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const data = req.body;

        const existingName = await prisma.test.findFirst({
            where: { name: { equals: data.name, mode: 'insensitive' }, type: 'Package', organizationId: orgId }
        });
        if (existingName) return res.status(400).json({ success: false, message: "Package name already exists in your lab." });

        let finalCode = data.code || `PKG-${Date.now().toString().slice(-4)}`;
        
        let exists = await prisma.test.findFirst({ where: { code: finalCode, organizationId: orgId } });
        while(exists) {
            const match = finalCode.match(/PKG-(\d+)/);
            let num = match ? parseInt(match[1], 10) + 1 : 1;
            finalCode = `PKG-${num.toString().padStart(4, '0')}`;
            exists = await prisma.test.findFirst({ where: { code: finalCode, organizationId: orgId } });
        }

        const newPkg = await prisma.test.create({
            data: {
                organizationId: orgId, name: data.name, code: finalCode, type: 'Package',
                price: safeFloat(data.price) || 0, departmentId: data.departmentId ? parseInt(data.departmentId) : null,
                isActive: data.isActive ?? true, isConfigured: true, billingOnly: data.billingOnly || false,
                packageTests: {
                    create: (data.packageTests || []).map((pt: any) => ({
                        organizationId: orgId, testId: pt.testId
                    }))
                }
            }
        });
        res.json({ success: true, data: newPkg });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || "Failed to create package." });
    }
});

// 5. UPDATE PACKAGE
router.put('/:id', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const id = Number(req.params.id);
        const data = req.body;

        const existingPkg = await prisma.test.findFirst({ where: { id: id, organizationId: orgId, type: 'Package' } });
        if (!existingPkg) return res.status(404).json({ success: false, message: "Package not found." });

        const existingName = await prisma.test.findFirst({
            where: { name: { equals: data.name, mode: 'insensitive' }, type: 'Package', organizationId: orgId, id: { not: id } }
        });
        if (existingName) return res.status(400).json({ success: false, message: "Package name already exists in your lab." });

        const updated = await prisma.test.update({
            where: { id },
            data: {
                name: data.name, code: data.code, price: safeFloat(data.price) || 0,
                departmentId: data.departmentId ? parseInt(data.departmentId) : null,
                isActive: data.isActive, billingOnly: data.billingOnly || false,
                packageTests: {
                    deleteMany: {}, // Delete old relations
                    create: (data.packageTests || []).map((pt: any) => ({
                        organizationId: orgId, testId: pt.testId
                    }))
                }
            }
        });
        res.json({ success: true, data: updated });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || "Failed to update package." });
    }
});

// 6. TOGGLE STATUS
router.patch('/:id/status', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const id = Number(req.params.id);
        const { isActive } = req.body;
        
        const existingPkg = await prisma.test.findFirst({ where: { id: id, organizationId: orgId, type: 'Package' } });
        if (!existingPkg) return res.status(404).json({ success: false, message: "Package not found." });

        await prisma.test.update({ where: { id }, data: { isActive } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update status." });
    }
});

// 7. DELETE PACKAGE
router.delete('/:id', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const id = Number(req.params.id);
        
        const existingPkg = await prisma.test.findFirst({ where: { id: id, organizationId: orgId, type: 'Package' } });
        if (!existingPkg) return res.status(404).json({ success: false, message: "Package not found." });

        await prisma.test.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete package." });
    }
});

export default router;
// --- BLOCK LabSeven-Backend/src/routes/packageRoutes.ts CLOSE ---