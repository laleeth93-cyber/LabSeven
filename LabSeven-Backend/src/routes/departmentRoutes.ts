// --- BLOCK LabSeven-Backend/src/routes/departmentRoutes.ts OPEN ---
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const getOrgId = (req: any) => Number(req.headers['x-org-id']) || 1;

// 1. GET ALL DEPARTMENTS
router.get('/', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const data = await prisma.department.findMany({
            where: { organizationId: orgId },
            orderBy: { name: 'asc' }
        });
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to load departments.", data: [] });
    }
});

// 2. CREATE DEPARTMENT
router.post('/', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        // 🚨 ADDED 'code' HERE
        const { name, code, isActive } = req.body;

        const existingName = await prisma.department.findFirst({
            where: { name: { equals: name, mode: 'insensitive' }, organizationId: orgId }
        });
        
        if (existingName) {
            return res.status(400).json({ success: false, message: "Department name already exists." });
        }

        const newDept = await prisma.department.create({
            data: {
                organizationId: orgId,
                name: name,
                // 🚨 ADDED 'code' HERE (with a fallback just in case the frontend misses it)
                code: code || name.substring(0, 3).toUpperCase(), 
                isActive: isActive ?? true
            }
        });
        res.json({ success: true, data: newDept });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || "Failed to create department." });
    }
});

// 3. UPDATE DEPARTMENT
router.put('/:id', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const id = Number(req.params.id);
        // 🚨 ADDED 'code' HERE
        const { name, code, isActive } = req.body;

        const existingDept = await prisma.department.findFirst({ where: { id, organizationId: orgId } });
        if (!existingDept) return res.status(404).json({ success: false, message: "Department not found." });

        const existingName = await prisma.department.findFirst({
            where: { name: { equals: name, mode: 'insensitive' }, organizationId: orgId, id: { not: id } }
        });
        
        if (existingName) {
            return res.status(400).json({ success: false, message: "Department name already exists." });
        }

        const updated = await prisma.department.update({
            where: { id },
            // 🚨 ADDED 'code' HERE
            data: { name, code, isActive }
        });
        res.json({ success: true, data: updated });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || "Failed to update department." });
    }
});

// 4. TOGGLE STATUS
router.patch('/:id/status', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const id = Number(req.params.id);
        const { isActive } = req.body;
        
        const existingDept = await prisma.department.findFirst({ where: { id, organizationId: orgId } });
        if (!existingDept) return res.status(404).json({ success: false, message: "Department not found." });

        await prisma.department.update({ where: { id }, data: { isActive } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update status." });
    }
});

// 5. DELETE DEPARTMENT
router.delete('/:id', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const id = Number(req.params.id);
        
        const existingDept = await prisma.department.findFirst({ where: { id, organizationId: orgId } });
        if (!existingDept) return res.status(404).json({ success: false, message: "Department not found." });

        await prisma.department.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete department. It may be linked to existing tests." });
    }
});

export default router;
// --- BLOCK LabSeven-Backend/src/routes/departmentRoutes.ts CLOSE ---