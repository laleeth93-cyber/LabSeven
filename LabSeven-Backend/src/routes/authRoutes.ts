import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt'; 

const router = express.Router();
const prisma = new PrismaClient();

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, message: "Missing credentials" });
        }

        const cleanUsername = username.trim().toLowerCase();

        // 1. Find User by Email OR Username
        const user = await prisma.user.findFirst({
            where: { 
                isActive: true,
                OR: [
                    { email: cleanUsername },
                    { username: cleanUsername }
                ]
            },
            include: { organization: true } 
        });

        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid email or password." });
        }

        // ==========================================
        // ✨ SMART SUBSCRIPTION BLOCKER ✨
        // ==========================================
        if (user.organizationId !== 1) { 
            if (!user.organization.isActive) {
                return res.status(403).json({ success: false, message: "Account suspended. Please contact support." });
            }

            if (user.organization.subscriptionEndsAt) {
                const now = new Date();
                const expDate = new Date(user.organization.subscriptionEndsAt);
                if (expDate < now) {
                    return res.status(403).json({ success: false, message: "Subscription expired. Please renew to access your laboratory." });
                }
            }
        }

        // 2. Verify Password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ success: false, message: "Invalid email or password." });
        }

        // 3. Return secure user payload
        res.json({ 
            success: true, 
            data: { 
                id: user.id.toString(), 
                name: user.name, 
                email: user.email, 
                orgId: user.organizationId 
            } 
        });

    } catch (error: any) {
        console.error("Login Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

export default router;