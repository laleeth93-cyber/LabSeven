import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const getOrgId = (req: any) => Number(req.headers['x-org-id']) || 1;

// Helper to resolve the correct Prisma table dynamically
const getModelDelegate = (tab: string) => {
    switch (tab) {
        case 'specimen': return prisma.specimen as any;
        case 'vacutainer': return prisma.vacutainer as any;
        case 'method': return prisma.method as any;
        case 'uom': return (prisma as any).uOM || (prisma as any).uom; 
        case 'operator': return prisma.operator as any;
        case 'multivalue': return (prisma as any).labList; 
        default: return null;
    }
};

// 1. GENERATE CODE
router.get('/:tab/generate-code', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const tab = req.params.tab;
        const model = getModelDelegate(tab);
        if (!model) return res.status(400).json({ success: false, data: 'GEN-0000' });

        let prefix = 'GEN';
        switch (tab) {
            case 'specimen': prefix = 'SPC'; break;
            case 'vacutainer': prefix = 'VAC'; break;
            case 'method': prefix = 'MET'; break;
            case 'uom': prefix = 'UOM'; break;
            case 'operator': prefix = 'OPR'; break;
            case 'multivalue': prefix = 'LST'; break;
        }

        const allRecords = await model.findMany({ 
            where: { organizationId: orgId },
            select: { code: true } 
        });
        
        let maxNum = 0;
        const regex = new RegExp(`${prefix}-(\\d+)`);

        allRecords.forEach((r: any) => {
            const match = r.code?.match(regex);
            if (match && match[1]) {
                const num = parseInt(match[1], 10);
                if (num > maxNum) maxNum = num;
            }
        });

        res.json({ success: true, data: `${prefix}-${(maxNum + 1).toString().padStart(4, '0')}` });
    } catch (error) {
        res.json({ success: true, data: 'GEN-0000' });
    }
});

// 2. GET ALL RECORDS
router.get('/:tab', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const tab = req.params.tab;
        const model = getModelDelegate(tab);
        
        if (!model) return res.status(400).json({ success: false, data: [] });

        const data = await model.findMany({
            where: { organizationId: orgId },
            orderBy: { id: 'desc' }
        });
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, data: [] });
    }
});

// 3. CREATE OR UPDATE (SAVE)
router.post('/:tab/save', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const tab = req.params.tab;
        const data = req.body;
        const model = getModelDelegate(tab);

        if (!model) return res.status(400).json({ success: false, message: "Invalid Master Type" });
        if (!data.name) return res.status(400).json({ success: false, message: "Name is required" });

        // 🚨 FIX: Safely cast the ID to a Number to prevent Prisma crashes
        const dataId = data.id ? Number(data.id) : null;

        const duplicateCheckWhere: any = {
            organizationId: orgId,
            name: { equals: data.name, mode: 'insensitive' }
        };
        
        if (dataId) duplicateCheckWhere.id = { not: dataId };

        const existingName = await model.findFirst({ where: duplicateCheckWhere });
        if (existingName) return res.status(400).json({ success: false, message: `${tab} name already exists.` });

        let finalCode = data.code;

        const payload: any = {
            organizationId: orgId,
            name: data.name,
            isActive: data.isActive !== undefined ? Boolean(data.isActive) : true
        };

        if (tab === 'specimen') {
            payload.type = data.type || null;
            payload.container = data.container || null;
        } else if (tab === 'vacutainer') {
            payload.color = data.color || null;
        } else if (tab === 'operator') {
            payload.symbol = data.symbol || null;
        } else if (tab === 'multivalue') {
            payload.values = data.values || null;
        }

        if (dataId) {
            payload.code = finalCode; 
            await model.updateMany({
                where: { id: dataId, organizationId: orgId },
                data: payload
            });
        } else {
            if (!finalCode) finalCode = `${tab.substring(0,3).toUpperCase()}-0001`; 
            
            let existing = await model.findFirst({ where: { code: finalCode, organizationId: orgId } });
            while (existing) {
                const match = finalCode.match(/([A-Z]+)-(\d+)/);
                if (match) {
                    const prefix = match[1];
                    const num = parseInt(match[2]) + 1;
                    finalCode = `${prefix}-${num.toString().padStart(4, '0')}`;
                    existing = await model.findFirst({ where: { code: finalCode, organizationId: orgId } });
                } else {
                    break; 
                }
            }
            
            payload.code = finalCode;
            await model.create({ data: payload });
        }

        res.json({ success: true });
    } catch (error: any) {
        console.error(`Error saving ${req.params.tab}:`, error);
        res.status(500).json({ success: false, message: "Database Error" });
    }
});

// 4. TOGGLE STATUS
router.patch('/:tab/:id/status', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const { tab, id } = req.params;
        const { currentStatus } = req.body;
        const model = getModelDelegate(tab);

        if (!model) return res.status(400).json({ success: false });

        await model.updateMany({
            where: { id: Number(id), organizationId: orgId },
            data: { isActive: !currentStatus }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// 5. DELETE
router.delete('/:tab/:id', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const { tab, id } = req.params;
        const model = getModelDelegate(tab);

        if (!model) return res.status(400).json({ success: false });

        await model.deleteMany({ where: { id: Number(id), organizationId: orgId } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete." });
    }
});

export default router;