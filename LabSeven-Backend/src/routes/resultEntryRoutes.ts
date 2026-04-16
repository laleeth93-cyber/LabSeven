// --- BLOCK LabSeven-Backend/src/routes/resultEntryRoutes.ts OPEN ---
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Helper to get orgId securely from the Next.js Frontend headers
const getOrgId = (req: any) => Number(req.headers['x-org-id']) || 1;

// 1. GET SIGNATURE USERS
router.get('/signatures', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const users = await prisma.user.findMany({
            where: { organizationId: orgId, isActive: true, signatureUrl: { not: null }, isBillingOnly: false },
            select: { id: true, name: true, signName: true, designation: true, isDefaultSignature: true }
        });
        res.json({ success: true, data: users });
    } catch (error: any) {
        res.status(500).json({ success: false, data: [] });
    }
});

// 2. GET PENDING WORKLIST
router.get('/worklist', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const search = req.query.search as string;

        const where: any = {
            organizationId: orgId,
            items: { some: { status: { not: "Printed" } } }
        };

        if (search) {
            where.OR = [
                { billNumber: { contains: search, mode: 'insensitive' } },
                { patient: { firstName: { contains: search, mode: 'insensitive' } } },
                { patient: { phone: { contains: search } } }
            ];
        }

        const bills = await prisma.bill.findMany({
            where,
            include: {
                patient: true,
                items: { where: { status: { not: "Printed" } }, include: { test: true } }
            },
            orderBy: { date: 'desc' },
            take: 50
        });

        res.json({ success: true, data: bills });
    } catch (error) {
        console.error("CRITICAL: Error fetching worklist.", error);
        res.status(500).json({ success: false, data: [] });
    }
});

// 3. GET RESULT ENTRY DATA
router.get('/entry-data/:billId', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const billId = Number(req.params.billId);

        const bill = await prisma.bill.findUnique({
            where: { id: billId, organizationId: orgId },
            include: {
                patient: true, doctor: true, approvedBy1: true, approvedBy2: true,
                items: {
                    include: {
                        test: {
                            include: {
                                department: true,
                                parameters: { include: { parameter: { include: { ranges: true } } }, orderBy: { order: 'asc' } },
                                packageTests: {
                                    include: {
                                        test: {
                                            include: {
                                                department: true,
                                                parameters: { include: { parameter: { include: { ranges: true } } }, orderBy: { order: 'asc' } }
                                            }
                                        }
                                    },
                                    orderBy: { id: 'asc' }
                                }
                            }
                        },
                        results: true
                    }
                }
            }
        });

        if (!bill) return res.status(404).json({ success: false, error: "Bill not found" });
        res.json({ success: true, data: bill });
    } catch (error) {
        console.error("CRITICAL: Error loading bill data.", error);
        res.status(500).json({ success: false, error: "Failed to load bill" });
    }
});

// 4. SAVE TEST RESULTS
router.post('/save', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const { billId, results, status, sig1Id, sig2Id } = req.body;

        const billItemIds = Array.from(new Set(results.map((r: any) => r.billItemId))) as number[];
        const existingResults = await prisma.testResult.findMany({
            where: { organizationId: orgId, billItemId: { in: billItemIds } }
        });

        const existingMap = new Map();
        existingResults.forEach(r => {
            const paramKey = r.parameterId === null ? 'null' : r.parameterId;
            existingMap.set(`${r.billItemId}_${paramKey}`, r);
        });

        const transactions = [];

        for (const res of results) {
            const paramIdToUse = res.parameterId === undefined ? null : res.parameterId;
            const key = `${res.billItemId}_${paramIdToUse === null ? 'null' : paramIdToUse}`;
            const existing = existingMap.get(key);

            if (existing) {
                transactions.push(prisma.testResult.update({
                    where: { id: existing.id },
                    data: { resultValue: res.value, flag: res.flag, updatedAt: new Date() }
                }));
            } else {
                transactions.push(prisma.testResult.create({
                    data: {
                        organizationId: orgId, billItemId: res.billItemId,
                        parameterId: paramIdToUse, resultValue: res.value, flag: res.flag
                    }
                }));
            }
        }

        for (const itemId of billItemIds) {
            transactions.push(prisma.billItem.update({
                where: { id: itemId },
                data: { status: status }
            }));
        }

        transactions.push(prisma.bill.update({
            where: { id: billId },
            data: { approvedBy1Id: sig1Id, approvedBy2Id: sig2Id }
        }));

        await prisma.$transaction(transactions);
        res.json({ success: true, message: `Results saved as ${status}` });
    } catch (error: any) {
        console.error("CRITICAL: Error saving results:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 5. SAVE TEST NOTE
router.post('/note', async (req, res) => {
    try {
        const { billItemId, note } = req.body;
        await prisma.billItem.update({ where: { id: billItemId }, data: { notes: note } });
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 6. CHECK HISTORY AVAILABILITY
router.post('/history-check', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const { patientId, parameterIds, excludeBillId } = req.body;

        const whereClause: any = {
            organizationId: orgId, parameterId: { in: parameterIds },
            billItem: { bill: { patientId: patientId } }
        };

        if (excludeBillId) whereClause.billItem.bill.id = { not: excludeBillId };

        const results = await prisma.testResult.groupBy({
            by: ['parameterId'], where: whereClause, _count: { id: true }
        });

        res.json({ success: true, data: results.map((r: any) => r.parameterId) });
    } catch (error) {
        res.status(500).json({ success: false, data: [] });
    }
});

// 7. GET PARAMETER HISTORY
router.get('/history/:patientId/:parameterId', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const patientId = Number(req.params.patientId);
        const parameterId = Number(req.params.parameterId);

        const history = await prisma.testResult.findMany({
            where: {
                organizationId: orgId, parameterId: parameterId,
                billItem: { bill: { patientId: patientId } }
            },
            include: { billItem: { include: { bill: true } } },
            orderBy: { billItem: { bill: { date: 'desc' } } },
            take: 10
        });

        const formattedHistory = history.map((h: any) => ({
            date: h.billItem.bill.date.toISOString().split('T')[0],
            value: h.resultValue, flag: h.flag, billNumber: h.billItem.bill.billNumber
        }));

        const graphData = [...formattedHistory].reverse();
        res.json({ success: true, tableData: formattedHistory, graphData: graphData });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// 8. DELTA CHECK DATA
router.get('/delta-check/:billId/:patientId', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        const billId = Number(req.params.billId);
        const patientId = Number(req.params.patientId);

        const currentResults = await prisma.testResult.findMany({
            where: { organizationId: orgId, billItem: { billId: billId } },
            include: { parameter: true, billItem: { include: { bill: true, test: true } } }
        });

        if (!currentResults.length) return res.json({ success: true, data: [] });

        const currentBillDate = currentResults[0].billItem.bill.date;
        const parameterIds = currentResults.map((r: any) => r.parameterId);

        const previousResults = await prisma.testResult.findMany({
            where: {
                organizationId: orgId, parameterId: { in: parameterIds },
                billItem: { bill: { patientId: patientId, id: { not: billId }, date: { lt: currentBillDate } } }
            },
            include: { billItem: { include: { bill: true } } },
            orderBy: { billItem: { bill: { date: 'desc' } } }
        });

        const deltaData = currentResults.map((curr: any) => {
            const history = previousResults.filter((p: any) => p.parameterId === curr.parameterId);
            const prev = history.length > 0 ? history[0] : null;

            let deltaPercent = null;
            let trend = 'flat';
            let isClinicallySignificant = false;

            if (prev && curr.resultValue && prev.resultValue) {
                const cVal = parseFloat(curr.resultValue);
                const pVal = parseFloat(prev.resultValue);
                if (!isNaN(cVal) && !isNaN(pVal) && pVal !== 0) {
                    deltaPercent = ((cVal - pVal) / pVal) * 100;
                    if (deltaPercent > 0) trend = 'up';
                    else if (deltaPercent < 0) trend = 'down';
                    if (Math.abs(deltaPercent) > 15) isClinicallySignificant = true;
                }
            }

            return {
                parameterId: curr.parameterId, parameterName: curr.parameter?.name || 'Unknown',
                unit: curr.parameter?.unit || '', testName: curr.billItem?.test?.name || 'Unknown',
                currentValue: curr.resultValue, currentDate: curr.billItem.bill.date, currentFlag: curr.flag,
                previousValue: prev ? prev.resultValue : null, previousDate: prev ? prev.billItem.bill.date : null, previousFlag: prev ? prev.flag : null,
                history: history.map((h: any) => ({ value: h.resultValue, date: h.billItem.bill.date, flag: h.flag })),
                deltaPercent: deltaPercent !== null ? deltaPercent.toFixed(1) : null, trend: trend, isClinicallySignificant: isClinicallySignificant
            };
        });

        res.json({ success: true, data: deltaData });
    } catch (error) {
        res.status(500).json({ success: false, data: [] });
    }
});

// 9. CLEAR ALL ENTRY DATA (DANGEROUS)
router.post('/clear-all', async (req, res) => {
    try {
        const orgId = getOrgId(req);
        await prisma.$transaction([
            prisma.testResult.deleteMany({ where: { organizationId: orgId } }),
            prisma.payment.deleteMany({ where: { organizationId: orgId } }),
            prisma.billItem.deleteMany({ where: { bill: { organizationId: orgId } } }),
            prisma.bill.deleteMany({ where: { organizationId: orgId } })
        ]);
        res.json({ success: true, message: "All bills and results deleted permanently for your lab." });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
// --- BLOCK LabSeven-Backend/src/routes/resultEntryRoutes.ts CLOSE ---