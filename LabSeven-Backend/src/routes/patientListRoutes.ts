// --- BLOCK LabSeven-Backend/src/routes/patientListRoutes.ts OPEN ---
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Helper to get orgId securely from the Next.js Frontend headers
const getOrgId = (req: any) => Number(req.headers['x-org-id']) || 1;

// 1. GET PATIENT LIST
router.get('/', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const searchQuery = req.query.searchQuery as string || '';
        const startDate = req.query.startDate as string;
        const endDate = req.query.endDate as string;

        const whereClause: any = { isDeleted: false, organizationId: orgId };
        
        if (searchQuery) {
            whereClause.OR = [
                { billNumber: { contains: searchQuery, mode: 'insensitive' } },
                { patient: { firstName: { contains: searchQuery, mode: 'insensitive' } } },
                { patient: { lastName: { contains: searchQuery, mode: 'insensitive' } } },
                { patient: { phone: { contains: searchQuery } } },
                { patient: { patientId: { contains: searchQuery, mode: 'insensitive' } } }
            ];
        }

        if (startDate || endDate) {
            whereClause.date = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0); 
                whereClause.date.gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999); 
                whereClause.date.lte = end;
            }
        }

        const bills = await prisma.bill.findMany({
            where: whereClause,
            include: {
                patient: true,
                items: {
                    where: { test: { isConfigured: true } },
                    include: { 
                        test: { 
                            select: { 
                                name: true, code: true, type: true, 
                                isOutsourced: true, isConfigured: true,
                                isCulture: true, cultureColumns: true 
                            } 
                        },
                        results: true 
                    }
                },
                payments: true
            },
            orderBy: { date: 'desc' },
            take: 200 
        });

        res.status(200).json({ success: true, data: bills });
    } catch (error: any) {
        console.error("Error fetching patient list:", error);
        res.status(500).json({ success: false, message: error.message, data: [] });
    }
});

// 2. CLEAR DUE AMOUNT
router.post('/clear-due', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const { billId, amount, paymentMode } = req.body;
        
        const bill = await prisma.bill.findUnique({ where: { id: billId, organizationId: orgId } });
        if (!bill) return res.status(404).json({ success: false, message: "Bill not found" });

        const newPaidAmount = bill.paidAmount + amount;
        const newDueAmount = bill.netAmount - newPaidAmount;

        await prisma.$transaction([
            prisma.payment.create({
                data: { organizationId: orgId, billId: billId, amount: amount, mode: paymentMode, date: new Date() }
            }),
            prisma.bill.update({
                where: { id: billId },
                data: { paidAmount: newPaidAmount, dueAmount: newDueAmount < 0 ? 0 : newDueAmount, isFullyPaid: newDueAmount <= 0 }
            })
        ]);

        res.json({ success: true, message: "Due cleared successfully!" });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 3. PROCESS REFUND
router.post('/refund', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const { billId, amount, mode, reason } = req.body;
        
        const bill = await prisma.bill.findUnique({ where: { id: billId, organizationId: orgId } });
        if (!bill) return res.status(404).json({ success: false, message: "Bill not found" });
        if (amount > bill.paidAmount) return res.status(400).json({ success: false, message: "Refund cannot exceed the paid amount." });

        const newPaidAmount = bill.paidAmount - amount;
        const refundModeString = `Refund - ${mode}`;
        const transactionNotes = reason ? `Reason: ${reason}` : null;

        await prisma.$transaction([
            prisma.payment.create({
                data: { 
                    organizationId: orgId,
                    billId: billId, 
                    amount: -amount, 
                    mode: refundModeString, 
                    transactionId: transactionNotes,
                    date: new Date() 
                }
            }),
            prisma.bill.update({
                where: { id: billId },
                data: { 
                    paidAmount: newPaidAmount, 
                    dueAmount: bill.netAmount - newPaidAmount,
                    isFullyPaid: (bill.netAmount - newPaidAmount) <= 0 
                }
            })
        ]);

        res.json({ success: true, message: "Refund processed successfully!" });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 4. DELETE BILL (Soft Delete)
router.post('/delete', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const { billId } = req.body;
        
        const bill = await prisma.bill.findUnique({ where: { id: billId, organizationId: orgId } });
        if (!bill) return res.status(404).json({ success: false, message: "Bill not found" });

        await prisma.bill.update({ 
            where: { id: billId },
            data: { isDeleted: true }
        });

        res.json({ success: true, message: "Bill deleted successfully." });
    } catch (error: any) {
        res.status(500).json({ success: false, message: `Failed to delete: ${error.message}` });
    }
});

// 5. UPDATE PATIENT DETAILS
router.put('/update-patient', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const { patientId, data } = req.body;
        
        const patient = await prisma.patient.findUnique({ where: { id: patientId, organizationId: orgId } });
        if (!patient) return res.status(404).json({ success: false, message: "Patient not found" });

        await prisma.patient.update({
            where: { id: patientId },
            data: {
                designation: data.designation,
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                email: data.email,
                gender: data.gender,
                ageY: parseInt(data.ageY) || 0,
                ageM: parseInt(data.ageM) || 0,
                ageD: parseInt(data.ageD) || 0,
                address: data.address,
                referralType: data.referralType,
                refDoctor: data.refDoctor
            }
        });
        
        res.json({ success: true, message: "Patient updated successfully!" });
    } catch (error: any) {
        res.status(500).json({ success: false, message: "Failed to update patient details." });
    }
});

// 6. SEARCH MASTER TESTS
router.get('/search-tests', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const query = req.query.q as string;
        if (!query || query.length < 2) return res.json([]);

        const tests = await prisma.test.findMany({
            where: {
                organizationId: orgId,
                OR: [ { name: { contains: query, mode: 'insensitive' } }, { code: { contains: query, mode: 'insensitive' } } ],
                isActive: true
            },
            take: 10,
            select: { id: true, name: true, code: true }
        });
        res.json(tests);
    } catch (error) {
        res.json([]);
    }
});

export default router;
// --- BLOCK LabSeven-Backend/src/routes/patientListRoutes.ts CLOSE ---