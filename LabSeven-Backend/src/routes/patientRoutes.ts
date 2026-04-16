// --- BLOCK LabSeven-Backend/src/routes/patientRoutes.ts OPEN ---
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const getOrgId = (req: any) => Number(req.headers['x-org-id']) || 1;

// 1. GENERATE PATIENT ID
router.get('/generate-id', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const allPatients = await prisma.patient.findMany({
            where: { organizationId: orgId },
            select: { patientId: true }
        });

        let maxNum = 0;
        allPatients.forEach(p => {
            if (p.patientId) {
                const match = p.patientId.match(/PT-(\d+)/);
                if (match && match[1]) {
                    const num = parseInt(match[1], 10);
                    if (num > maxNum) maxNum = num;
                }
            }
        });
        res.json({ success: true, data: `PT-${(maxNum + 1).toString().padStart(4, '0')}` });
    } catch (error) {
        res.json({ success: true, data: 'PT-0001' });
    }
});

// 2. GET ALL PATIENTS
router.get('/', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const data = await prisma.patient.findMany({
            where: { organizationId: orgId },
            orderBy: { updatedAt: 'desc' }
        });
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to load patients.", data: [] });
    }
});

// 3. GET PATIENT BY ID
router.get('/:id', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const data = await prisma.patient.findFirst({
            where: { id: Number(req.params.id), organizationId: orgId }
        });
        if (!data) return res.status(404).json({ success: false, message: "Patient not found" });
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch patient" });
    }
});

// 4. CREATE PATIENT
router.post('/', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const data = req.body;

        let finalCode = data.patientId;
        if (!finalCode) finalCode = `PT-${Date.now().toString().slice(-4)}`;
        
        let exists = await prisma.patient.findFirst({ where: { patientId: finalCode, organizationId: orgId } });
        while(exists) {
            const match = finalCode.match(/PT-(\d+)/);
            let num = match ? parseInt(match[1], 10) + 1 : 1;
            finalCode = `PT-${num.toString().padStart(4, '0')}`;
            exists = await prisma.patient.findFirst({ where: { patientId: finalCode, organizationId: orgId } });
        }

        const newPatient = await prisma.patient.create({
            data: {
                organizationId: orgId,
                patientId: finalCode,
                designation: data.designation,
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone || null,
                email: data.email || null,
                gender: data.gender,
                ageY: parseInt(data.ageY) || 0,
                ageM: parseInt(data.ageM) || 0,
                ageD: parseInt(data.ageD) || 0,
                address: data.address || null,
                referralType: data.referralType || null,
                refDoctor: data.refDoctor || null
            }
        });
        res.json({ success: true, data: newPatient });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || "Failed to create patient." });
    }
});

// 5. UPDATE PATIENT
router.put('/:id', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const id = Number(req.params.id);
        const data = req.body;

        const existingPatient = await prisma.patient.findFirst({ where: { id: id, organizationId: orgId } });
        if (!existingPatient) return res.status(404).json({ success: false, message: "Patient not found." });

        const updated = await prisma.patient.update({
            where: { id },
            data: {
                designation: data.designation,
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone || null,
                email: data.email || null,
                gender: data.gender,
                ageY: parseInt(data.ageY) || 0,
                ageM: parseInt(data.ageM) || 0,
                ageD: parseInt(data.ageD) || 0,
                address: data.address || null,
                referralType: data.referralType || null,
                refDoctor: data.refDoctor || null
            }
        });
        res.json({ success: true, data: updated });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || "Failed to update patient." });
    }
});

// 6. DELETE PATIENT
router.delete('/:id', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const id = Number(req.params.id);
        
        const existingPatient = await prisma.patient.findFirst({ where: { id: id, organizationId: orgId } });
        if (!existingPatient) return res.status(404).json({ success: false, message: "Patient not found." });

        await prisma.patient.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete patient. Ensure there are no billing records tied to this patient." });
    }
});

export default router;
// --- BLOCK LabSeven-Backend/src/routes/patientRoutes.ts CLOSE ---