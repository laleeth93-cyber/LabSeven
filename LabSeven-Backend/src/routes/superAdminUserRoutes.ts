import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs'; // ✅ Fixed import

const router = Router();
const prisma = new PrismaClient();

// 1. CREATE SUPER ADMIN
router.post('/create', async (req, res) => {
    try {
        const data = req.body;
        
        // 1. Verify Master Org exists
        let masterOrg = await prisma.organization.findUnique({ where: { id: 1 } });
        if (!masterOrg) return res.status(400).json({ success: false, message: "Master Org not found." });

        // 2. Get the Super Admin Role
        let adminRole = await prisma.role.findFirst({
            where: { organizationId: 1, name: "Super Administrator" }
        });

        // 3. Check for duplicates
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: data.username },
                    { email: data.email }
                ]
            }
        });

        if (existingUser) {
            return res.status(400).json({ success: false, message: "Username or Email is already in use." });
        }

        // 4. Secure the password
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // 5. Create the user locked to Organization 1
        await prisma.user.create({
            data: {
                organizationId: 1,
                name: data.name,
                username: data.username,
                email: data.email,
                password: hashedPassword,
                roleId: adminRole?.id,
                isActive: true
            }
        });

        res.json({ success: true, message: "New Super Admin created successfully!" });
    } catch (error: any) {
        console.error("Create Admin Error:", error);
        res.status(500).json({ success: false, message: error.message || "Database Error" });
    }
});

// 2. TOGGLE ADMIN STATUS
router.patch('/:id/status', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { currentStatus } = req.body;
        
        const user = await prisma.user.findUnique({ where: { id } });
        
        // Prevent locking yourself out!
        if (user?.email === "admin@labseven.in") {
            return res.status(400).json({ success: false, message: "Security risk: Cannot disable the primary System Architect account." });
        }

        await prisma.user.update({
            where: { id },
            data: { isActive: !currentStatus }
        });
        
        res.json({ success: true, message: `Admin account ${!currentStatus ? 'activated' : 'disabled'}.` });
    } catch (error: any) {
        console.error("Toggle Admin Error:", error);
        res.status(500).json({ success: false, message: error.message || "Database Error" });
    }
});

export default router;