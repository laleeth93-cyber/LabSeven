// --- BLOCK LabSeven-Backend/src/routes/doctorRoutes.ts OPEN ---
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const getOrgId = (req: any) => Number(req.headers['x-org-id']) || 1;

// 1. GET ALL DOCTORS / REFERRALS
router.get('/', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const data = await prisma.doctor.findMany({
            where: { organizationId: orgId },
            orderBy: { name: 'asc' }
        });
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to load doctors.", data: [] });
    }
});

// 2. GET DOCTOR BY ID
router.get('/:id', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const data = await prisma.doctor.findFirst({
            where: { id: Number(req.params.id), organizationId: orgId }
        });
        if (!data) return res.status(404).json({ success: false, message: "Doctor not found" });
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch doctor" });
    }
});

// 3. CREATE DOCTOR
router.post('/', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const data = req.body;

        const existingName = await prisma.doctor.findFirst({
            where: { name: { equals: data.name, mode: 'insensitive' }, organizationId: orgId }
        });
        if (existingName) return res.status(400).json({ success: false, message: "Doctor name already exists." });

        const newDoctor = await prisma.doctor.create({
            data: {
                organizationId: orgId,
                name: data.name,
                type: data.type || 'External', // Usually 'Internal', 'External', 'Outsource'
                phone: data.phone || null,
                email: data.email || null,
                commission: data.commissionPercent ? parseFloat(data.commissionPercent) : 0,
                isActive: data.isActive ?? true
            }
        });
        res.json({ success: true, data: newDoctor });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || "Failed to create doctor." });
    }
});

// 4. UPDATE DOCTOR
router.put('/:id', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const id = Number(req.params.id);
        const data = req.body;

        const existingDoctor = await prisma.doctor.findFirst({ where: { id: id, organizationId: orgId } });
        if (!existingDoctor) return res.status(404).json({ success: false, message: "Doctor not found." });

        const existingName = await prisma.doctor.findFirst({
            where: { name: { equals: data.name, mode: 'insensitive' }, organizationId: orgId, id: { not: id } }
        });
        if (existingName) return res.status(400).json({ success: false, message: "Doctor name already exists." });

        const updated = await prisma.doctor.update({
            where: { id },
            data: {
                name: data.name,
                type: data.type,
                phone: data.phone || null,
                email: data.email || null,
                commission: data.commissionPercent ? parseFloat(data.commissionPercent) : 0,
                isActive: data.isActive
            }
        });
        res.json({ success: true, data: updated });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || "Failed to update doctor." });
    }
});

// 5. TOGGLE STATUS
router.patch('/:id/status', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const id = Number(req.params.id);
        const { isActive } = req.body;
        
        const existingDoctor = await prisma.doctor.findFirst({ where: { id: id, organizationId: orgId } });
        if (!existingDoctor) return res.status(404).json({ success: false, message: "Doctor not found." });

        await prisma.doctor.update({ where: { id }, data: { isActive } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update status." });
    }
});

// 6. DELETE DOCTOR
router.delete('/:id', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const id = Number(req.params.id);
        
        const existingDoctor = await prisma.doctor.findFirst({ where: { id: id, organizationId: orgId } });
        if (!existingDoctor) return res.status(404).json({ success: false, message: "Doctor not found." });

        await prisma.doctor.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete doctor. They may be linked to existing bills." });
    }
});

export default router;
// --- BLOCK LabSeven-Backend/src/routes/doctorRoutes.ts CLOSE ---