// --- BLOCK LabSeven-Backend/src/routes/authorizationRoutes.ts OPEN ---
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const getOrgId = (req: any) => Number(req.headers['x-org-id']) || 1;

// ==========================================
// USERS
// ==========================================
router.get('/users', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const data = await prisma.user.findMany({
            where: { organizationId: orgId },
            select: {
                id: true, name: true, email: true, username: true, role: true, designation: true,
                isActive: true, isBillingOnly: true, signName: true,
                signatureUrl: true, isDefaultSignature: true, createdAt: true
            },
            orderBy: { name: 'asc' }
        });
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, data: [] });
    }
});

router.post('/users', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const data = req.body;

        const existingEmail = await prisma.user.findFirst({
            where: { email: { equals: data.email, mode: 'insensitive' } }
        });
        if (existingEmail) return res.status(400).json({ success: false, message: "Email already in use." });

        const newUser = await prisma.user.create({
            data: {
                organizationId: orgId, 
                name: data.name, 
                email: data.email,
                // 🚨 FIXED: Added username (defaults to email if not provided)
                username: data.username || data.email, 
                password: data.password || 'defaultPassword123!', 
                role: data.role || 'Staff', 
                designation: data.designation || null,
                isActive: data.isActive ?? true, 
                isBillingOnly: data.isBillingOnly || false,
                signName: data.signName || null, 
                signatureUrl: data.signatureUrl || null,
                isDefaultSignature: data.isDefaultSignature || false
            }
        });
        res.json({ success: true, data: newUser });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || "Failed to create user." });
    }
});

router.put('/users/:id', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const id = Number(req.params.id);
        const data = req.body;

        const updated = await prisma.user.update({
            where: { id },
            data: {
                name: data.name, 
                email: data.email, 
                // 🚨 FIXED: Update username if provided
                username: data.username || data.email,
                role: data.role,
                designation: data.designation || null, 
                isActive: data.isActive,
                isBillingOnly: data.isBillingOnly, 
                signName: data.signName || null,
                signatureUrl: data.signatureUrl || null, 
                isDefaultSignature: data.isDefaultSignature || false
            }
        });
        res.json({ success: true, data: updated });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/users/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        await prisma.user.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete user." });
    }
});

// ==========================================
// ROLES & PERMISSIONS
// ==========================================
router.get('/roles', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        // Fallback for role fetching if you have a roles table, otherwise return static list
        const roles = await prisma.role?.findMany({ where: { organizationId: orgId } }) || [];
        res.json({ success: true, data: roles });
    } catch (error) {
        res.status(500).json({ success: false, data: [] });
    }
});

export default router;
// --- BLOCK LabSeven-Backend/src/routes/authorizationRoutes.ts CLOSE ---