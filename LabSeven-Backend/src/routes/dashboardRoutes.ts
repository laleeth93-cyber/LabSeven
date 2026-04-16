// --- BLOCK LabSeven-Backend/src/routes/dashboardRoutes.ts OPEN ---
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const getOrgId = (req: any) => Number(req.headers['x-org-id']) || 1;

// 1. GET MAIN DASHBOARD STATS
router.get('/stats', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        
        // Get today's date boundaries
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // 1. Today's Patient Count
        const todaysPatients = await prisma.bill.count({
            where: {
                organizationId: orgId,
                date: { gte: today, lt: tomorrow }
            }
        });

        // 2. Today's Revenue (Sum of paid amounts)
        const todaysRevenueData = await prisma.payment.aggregate({
            _sum: { amount: true },
            where: {
                organizationId: orgId,
                date: { gte: today, lt: tomorrow }
            }
        });
        const todaysRevenue = todaysRevenueData._sum.amount || 0;

        // 3. Pending Results Count
        const pendingResults = await prisma.billItem.count({
            where: {
                bill: { organizationId: orgId },
                status: { notIn: ['Printed', 'Approved'] }
            }
        });

        // 4. Total Dues (Outstanding balances)
        const totalDuesData = await prisma.bill.aggregate({
            _sum: { dueAmount: true },
            where: {
                organizationId: orgId,
                // 🚨 FIXED: Changed { >: 0 } to { gt: 0 }
                dueAmount: { gt: 0 } 
            }
        });
        const totalDues = totalDuesData._sum.dueAmount || 0;

        res.json({
            success: true,
            data: {
                todaysPatients,
                todaysRevenue,
                pendingResults,
                totalDues
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to load dashboard stats." });
    }
});

// 2. GET RECENT BILLS (For the activity feed)
router.get('/recent-activity', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const data = await prisma.bill.findMany({
            where: { organizationId: orgId },
            orderBy: { date: 'desc' },
            take: 5,
            include: {
                patient: { select: { firstName: true, lastName: true, patientId: true } }
            }
        });
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, data: [] });
    }
});

export default router;
// --- BLOCK LabSeven-Backend/src/routes/dashboardRoutes.ts CLOSE ---