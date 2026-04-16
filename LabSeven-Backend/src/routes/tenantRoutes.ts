import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/features', async (req, res) => {
    try {
        const orgId = Number(req.query.orgId);
        if (!orgId) return res.status(400).json({ success: false, message: "Organization ID is required" });

        // Master HQ always sees everything and never expires
        if (orgId === 1) {
            return res.json({ 
                success: true, 
                hasSensitivity: true,
                plan: "Master",
                subscriptionEndsAt: null,
                createdAt: new Date()
            }); 
        }
        
        const org = await prisma.organization.findUnique({
            where: { id: orgId },
            select: { 
                hasSensitivity: true,
                plan: true,
                subscriptionEndsAt: true,
                createdAt: true
            }
        });

        if (!org) {
            return res.status(404).json({ success: false, message: "Organization not found" });
        }
        
        res.json({ 
            success: true, 
            hasSensitivity: org.hasSensitivity,
            plan: org.plan,
            subscriptionEndsAt: org.subscriptionEndsAt,
            createdAt: org.createdAt
        });

    } catch (error: any) {
        console.error("Fetch Tenant Features Error:", error);
        res.status(500).json({ success: false, hasSensitivity: false });
    }
});

export default router;