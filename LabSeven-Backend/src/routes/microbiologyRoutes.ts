import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

type MicroType = 'organism' | 'antibiotic' | 'antibioticClass' | 'interpretation' | 'susceptibilityInfo';

// Helper to dynamically select the correct Prisma model
const getModel = (type: MicroType): any => {
    switch(type) {
        case 'organism': return prisma.organism;
        case 'antibiotic': return prisma.antibiotic;
        case 'antibioticClass': return prisma.antibioticClass;
        case 'interpretation': return prisma.antibioticInterpretation;
        case 'susceptibilityInfo': return prisma.susceptibilityInfo;
        default: throw new Error("Invalid microbiology type");
    }
};

// 1. GET: Paginated Results
router.get('/paginated/:type', async (req, res) => {
    try {
        const { type } = req.params as { type: MicroType };
        const orgId = Number(req.query.orgId);
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const search = (req.query.search as string) || '';

        if (!orgId) return res.status(400).json({ success: false, message: "orgId required" });

        const skip = (page - 1) * limit;
        const where: any = { organizationId: orgId };
        
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } }
            ];
            // Antibiotics also search by group
            if (type === 'antibiotic') {
                where.OR.push({ group: { contains: search, mode: 'insensitive' } });
            }
        }

        const model = getModel(type);
        const queryOptions: any = { where, skip, take: limit, orderBy: { name: 'asc' } };
        
        if (type === 'organism') {
            queryOptions.include = { antibiotics: { select: { id: true } } };
        }

        const [data, total] = await Promise.all([
            model.findMany(queryOptions),
            model.count({ where })
        ]);

        res.json({ success: true, data, total, totalPages: Math.ceil(total / limit) });
    } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

// 2. GET: Full Master Data (No Pagination)
router.get('/master/:type', async (req, res) => {
    try {
        const { type } = req.params as { type: MicroType };
        const orgId = Number(req.query.orgId);
        if (!orgId) return res.status(400).json({ success: false, message: "orgId required" });

        const model = getModel(type);
        const queryOptions: any = { where: { organizationId: orgId }, orderBy: { name: 'asc' } };
        
        if (type === 'organism') queryOptions.include = { antibiotics: { select: { id: true } } };

        const data = await model.findMany(queryOptions);
        res.json({ success: true, data });
    } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

// 3. POST: Save or Update Master
router.post('/master/:type', async (req, res) => {
    try {
        const { type } = req.params as { type: MicroType };
        const { orgId, data } = req.body;
        if (!orgId) return res.status(400).json({ success: false, message: "orgId required" });

        const model = getModel(type);
        let payload: any = { code: data.code, name: data.name, isActive: data.isActive };
        
        // Handle specialized fields
        if (type === 'antibiotic') payload.group = data.group;
        if (type === 'susceptibilityInfo') payload.details = data.details;

        if (data.id) {
            await model.updateMany({ where: { id: data.id, organizationId: orgId }, data: payload });
        } else {
            await model.create({ data: { ...payload, organizationId: orgId } });
        }
        res.json({ success: true, message: `Saved successfully!` });
    } catch (error: any) {
        if (error.code === 'P2002') return res.status(400).json({ success: false, message: 'Code already exists. Please use a unique Code.' });
        res.status(500).json({ success: false, message: error.message });
    }
});

// 4. POST: Map Organism Antibiotics
router.post('/organism/map-antibiotics', async (req, res) => {
    try {
        const { orgId, organismId, antibioticIds } = req.body;
        if (!orgId) return res.status(400).json({ success: false, message: "orgId required" });

        const organism = await (prisma.organism as any).findFirst({
            where: { id: organismId, organizationId: orgId }
        });
        if (!organism) return res.status(404).json({ success: false, message: "Organism not found." });

        await (prisma.organism as any).update({
            where: { id: organismId },
            data: { antibiotics: { set: antibioticIds.map((id: number) => ({ id })) } }
        });
        res.json({ success: true, message: 'Antibiotic panel updated successfully!' });
    } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

// 5. POST: Bulk Import
router.post('/master/:type/import', async (req, res) => {
    try {
        const { type } = req.params as { type: MicroType };
        const { orgId, dataArray } = req.body;
        if (!orgId) return res.status(400).json({ success: false, message: "orgId required" });
        if (!dataArray || dataArray.length === 0) return res.status(400).json({ success: false, message: "No data found to import." });

        const model = getModel(type);
        const mappedData = dataArray.map((d: any) => {
            let payload: any = { organizationId: orgId, code: d.code, name: d.name, isActive: true };
            if (type === 'antibiotic') payload.group = d.group || null;
            if (type === 'susceptibilityInfo') payload.details = d.details;
            return payload;
        });

        await model.createMany({ data: mappedData, skipDuplicates: true });
        res.json({ success: true, message: `Successfully imported ${dataArray.length} records!` });
    } catch (error: any) { res.status(500).json({ success: false, message: "Bulk import failed: " + error.message }); }
});

// 6. DELETE: Delete All Masters
router.delete('/master/:type/all', async (req, res) => {
    try {
        const { type } = req.params as { type: MicroType };
        const orgId = Number(req.query.orgId);
        if (!orgId) return res.status(400).json({ success: false, message: "orgId required" });

        await getModel(type).deleteMany({ where: { organizationId: orgId } });
        res.json({ success: true, message: 'All records deleted successfully!' });
    } catch (error: any) { res.status(500).json({ success: false, message: 'Cannot delete all items. Linked records exist.' }); }
});

// 7. DELETE: Single Master
router.delete('/master/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params as { type: MicroType, id: string };
        const orgId = Number(req.query.orgId);
        if (!orgId) return res.status(400).json({ success: false, message: "orgId required" });

        await getModel(type).deleteMany({ where: { id: Number(id), organizationId: orgId } });
        res.json({ success: true });
    } catch (error: any) { res.status(500).json({ success: false, message: 'Cannot delete item, linked records exist.' }); }
});

export default router;