// --- BLOCK LabSeven-Backend/src/routes/billingRoutes.ts OPEN ---
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Helper to get orgId securely from the Next.js Frontend headers
const getOrgId = (req: any) => Number(req.headers['x-org-id']) || 1;

// 1. SEARCH TESTS
router.get('/search', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const query = req.query.q as string;

        if (!query || query.length < 2) {
            return res.json([]);
        }

        const tests = await prisma.test.findMany({
            where: {
                organizationId: orgId, 
                OR: [
                    { name: { contains: query, mode: 'insensitive' } }, 
                    { code: { contains: query, mode: 'insensitive' } }  
                ],
                isActive: true
            },
            include: {
                outsourceLab: true 
            },
            take: 10, 
        });

        res.json(tests);
    } catch (error) {
        console.error("Search Error:", error);
        res.status(500).json([]);
    }
});

// 2. CREATE BILL
router.post('/create', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const data = req.body;
        const billNumber = data.billNumber || `INV-${Date.now()}`;
        
        // Resolve Patient ID
        let patientDbId = Number(data.patientId); 
        
        if (isNaN(patientDbId)) {
            const pt = await prisma.patient.findUnique({
               where: { organizationId_patientId: { organizationId: orgId, patientId: data.patientId } }
            });
            if (!pt) return res.status(404).json({ success: false, message: "Patient not found in this laboratory." });
            patientDbId = pt.id;
        }

        let finalItemsToSave: { organizationId: number, testId: number, price: number, isUrgent: boolean }[] = [];
        
        const itemIds = data.items.map((i: any) => i.testId);
        const dbTests = await prisma.test.findMany({
            where: { id: { in: itemIds }, organizationId: orgId }, 
            include: { packageTests: true } 
        });

        // Unfold Packages
        for (const submittedItem of data.items) {
            const dbTest = dbTests.find(t => t.id === submittedItem.testId);
            
            if (dbTest && dbTest.type === 'Package') {
                 if (dbTest.packageTests && dbTest.packageTests.length > 0) {
                     dbTest.packageTests.forEach((pkgTest, index) => {
                         finalItemsToSave.push({
                             organizationId: orgId, 
                             testId: pkgTest.testId,
                             price: index === 0 ? submittedItem.price : 0, 
                             isUrgent: false
                         });
                     });
                 } else {
                     finalItemsToSave.push({ organizationId: orgId, testId: submittedItem.testId, price: submittedItem.price, isUrgent: false });
                 }
            } else {
                 finalItemsToSave.push({ organizationId: orgId, testId: submittedItem.testId, price: submittedItem.price, isUrgent: false });
            }
        }

        // Smart Doctor Linking 
        let doctorId: number | undefined = undefined;
        if (data.referredBy && data.referredBy !== 'Self') {
            const doc = await prisma.doctor.findFirst({
                where: { name: data.referredBy, organizationId: orgId } 
            });
            if (doc) doctorId = doc.id;
        }

        const newBill = await prisma.bill.create({
            data: {
                organizationId: orgId, 
                billNumber: billNumber,
                patientId: patientDbId, 
                doctorId: doctorId || null, 
                date: new Date(data.date),
                subTotal: data.subTotal,
                discountPercent: data.discountPercent,
                discountAmount: data.discountAmount,
                discountReason: data.discountReason || null,
                netAmount: data.netAmount,
                paidAmount: data.paidAmount,
                dueAmount: data.dueAmount,
                isFullyPaid: data.dueAmount <= 0,
                
                items: {
                    create: finalItemsToSave 
                },
                
                // Only create a payment record if they actually paid something
                ...(data.paidAmount > 0 && {
                    payments: {
                        create: {
                            organizationId: orgId,
                            amount: data.paidAmount,
                            mode: data.paymentMode || 'Cash',
                            date: new Date()
                        }
                    }
                })
            }
        });

        res.json({ success: true, billNumber: newBill.billNumber });
    } catch (error: any) {
        console.error("Create Bill Error:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to save bill" });
    }
});

export default router;
// --- BLOCK LabSeven-Backend/src/routes/billingRoutes.ts CLOSE ---