// --- BLOCK LabSeven-Backend/src/routes/userRoutes.ts OPEN ---
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const getOrgId = (req: any) => Number(req.headers['x-org-id']) || 1;

// 1. GET ALL USERS
router.get('/', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const data = await prisma.user.findMany({
            where: { organizationId: orgId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                designation: true,
                isActive: true,
                isBillingOnly: true,
                signName: true,
                signatureUrl: true,
                isDefaultSignature: true,
                createdAt: true
            },
            orderBy: { name: 'asc' }
        });
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to load users.", data: [] });
    }
});

// 2. GET SINGLE USER
router.get('/:id', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const data = await prisma.user.findFirst({
            where: { id: Number(req.params.id), organizationId: orgId },
            select: {
                id: true, name: true, email: true, role: true, designation: true,
                isActive: true, isBillingOnly: true, signName: true,
                signatureUrl: true, isDefaultSignature: true
            }
        });
        if (!data) return res.status(404).json({ success: false, message: "User not found" });
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch user" });
    }
});

// 3. CREATE USER
router.post('/', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const data = req.body;

        const existingEmail = await prisma.user.findFirst({
            where: { email: { equals: data.email, mode: 'insensitive' } }
        });
        if (existingEmail) return res.status(400).json({ success: false, message: "Email already in use." });

        // Note: Password hashing should ideally happen here using bcrypt if you aren't using NextAuth's built-in adapters.
        // For this migration, we mirror your existing data structure.
        const newUser = await prisma.user.create({
            data: {
                organizationId: orgId,
                name: data.name,
                email: data.email,
                password: data.password || 'defaultPassword123!', // Ensure frontend sends hashed or backend hashes it
                role: data.role || 'Staff',
                designation: data.designation || null,
                isActive: data.isActive ?? true,
                isBillingOnly: data.isBillingOnly || false,
                signName: data.signName || null,
                signatureUrl: data.signatureUrl || null,
                isDefaultSignature: data.isDefaultSignature || false
            }
        });
        
        // Remove password from response
        const { password, ...userWithoutPassword } = newUser;
        res.json({ success: true, data: userWithoutPassword });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || "Failed to create user." });
    }
});

// 4. UPDATE USER
router.put('/:id', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const id = Number(req.params.id);
        const data = req.body;

        const existingUser = await prisma.user.findFirst({ where: { id, organizationId: orgId } });
        if (!existingUser) return res.status(404).json({ success: false, message: "User not found." });

        const existingEmail = await prisma.user.findFirst({
            where: { email: { equals: data.email, mode: 'insensitive' }, id: { not: id } }
        });
        if (existingEmail) return res.status(400).json({ success: false, message: "Email already in use." });

        const updated = await prisma.user.update({
            where: { id },
            data: {
                name: data.name,
                email: data.email,
                role: data.role,
                designation: data.designation || null,
                isActive: data.isActive,
                isBillingOnly: data.isBillingOnly,
                signName: data.signName || null,
                signatureUrl: data.signatureUrl || null,
                isDefaultSignature: data.isDefaultSignature || false
            }
        });
        
        const { password, ...userWithoutPassword } = updated;
        res.json({ success: true, data: userWithoutPassword });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || "Failed to update user." });
    }
});

// 5. TOGGLE STATUS
router.patch('/:id/status', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const id = Number(req.params.id);
        const { isActive } = req.body;
        
        const existingUser = await prisma.user.findFirst({ where: { id, organizationId: orgId } });
        if (!existingUser) return res.status(404).json({ success: false, message: "User not found." });

        await prisma.user.update({ where: { id }, data: { isActive } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update status." });
    }
});

// 6. DELETE USER
router.delete('/:id', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const id = Number(req.params.id);
        
        const existingUser = await prisma.user.findFirst({ where: { id, organizationId: orgId } });
        if (!existingUser) return res.status(404).json({ success: false, message: "User not found." });

        await prisma.user.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete user. Ensure they aren't linked to existing approvals." });
    }
});

export default router;
// --- BLOCK LabSeven-Backend/src/routes/userRoutes.ts CLOSE ---