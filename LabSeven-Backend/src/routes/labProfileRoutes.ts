import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET: Fetch Lab Profile
router.get('/', async (req, res) => {
    try {
        const orgId = Number(req.query.orgId);
        
        if (!orgId) {
            return res.status(400).json({ success: false, message: "Organization ID is required" });
        }

        let profile = await prisma.labProfile.findFirst({
            where: { organizationId: orgId }
        });
        
        // Auto-create if it doesn't exist
        if (!profile) { 
            profile = await prisma.labProfile.create({ 
                data: { organizationId: orgId }
            }); 
        }
        
        res.json({ success: true, data: profile });
    } catch (error: any) {
        console.error("Fetch Lab Profile Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT: Update Lab Profile
router.put('/', async (req, res) => {
    try {
        const { orgId, name, tagline, address, phone, email, website, logoUrl } = req.body;

        if (!orgId) {
            return res.status(400).json({ success: false, message: "Organization ID is required" });
        }

        const profile = await prisma.labProfile.findFirst({
            where: { organizationId: orgId }
        });

        const payload = { name, tagline, address, phone, email, website, logoUrl };

        if (profile) {
            await prisma.labProfile.update({
                where: { id: profile.id },
                data: payload
            });
        } else {
            await prisma.labProfile.create({
                data: { ...payload, organizationId: orgId }
            });
        }
        
        res.json({ success: true, message: "Lab Profile saved successfully!" });
    } catch (error: any) {
        console.error("Update Lab Profile Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;