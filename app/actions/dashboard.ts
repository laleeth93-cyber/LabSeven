// --- BLOCK app/actions/dashboard.ts OPEN ---
"use server";

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth'; // 🚨 IMPORTING OUR NEW GATEKEEPER

// Helper to reliably calculate precise date ranges
const getRange = (from?: string, to?: string) => {
    let startDate = new Date();
    let endDate = new Date();
    if (from) { startDate = new Date(from); startDate.setHours(0, 0, 0, 0); } 
    else { startDate.setDate(endDate.getDate() - 30); startDate.setHours(0, 0, 0, 0); }
    if (to) { endDate = new Date(to); endDate.setHours(23, 59, 59, 999); } 
    else { endDate.setHours(23, 59, 59, 999); }
    return { startDate, endDate };
};

export async function getKPIs(from?: string, to?: string) {
    const { orgId } = await requireAuth(); // 🚨 GATEKEEPER
    const { startDate, endDate } = getRange(from, to);
    
    const bills = await prisma.bill.findMany({
        where: { organizationId: orgId, date: { gte: startDate, lte: endDate } }, // 🚨 FILTER BY ORG
        include: { items: { include: { test: true } } }
    });
    
    let totalBills = bills.length; 
    let totalRevenue = 0, totalCollected = 0, totalDue = 0, totalTests = 0, outsourced = 0;
    const patients = new Set();
    
    bills.forEach((b: any) => {
        if (!b.isDeleted) {
            totalRevenue += b.netAmount;
            totalCollected += b.paidAmount;
            totalDue += b.dueAmount;
            patients.add(b.patientId);
            b.items?.forEach((i: any) => {
                totalTests++;
                if (i.test?.isOutsourced) outsourced++;
            });
        }
    });
    return { totalBills, totalRevenue, totalCollected, totalDue, totalPatients: patients.size, totalTests, outsourced };
}

export async function getRevenueData(from?: string, to?: string) {
    const { orgId } = await requireAuth(); // 🚨 GATEKEEPER
    const { startDate, endDate } = getRange(from, to);
    const bills = await prisma.bill.findMany({
        where: { organizationId: orgId, date: { gte: startDate, lte: endDate }, isDeleted: false }, // 🚨 FILTER BY ORG
        orderBy: { date: 'asc' }
    });
    const map = new Map();
    bills.forEach((b: any) => {
        const d = new Date(b.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        if (!map.has(d)) map.set(d, { date: d, revenue: 0 });
        map.get(d).revenue += b.netAmount;
    });
    return Array.from(map.values());
}

export async function getPatientData(from?: string, to?: string) {
    const { orgId } = await requireAuth(); // 🚨 GATEKEEPER
    const { startDate, endDate } = getRange(from, to);
    const bills = await prisma.bill.findMany({
        where: { organizationId: orgId, date: { gte: startDate, lte: endDate }, isDeleted: false }, // 🚨 FILTER BY ORG
        include: { patient: true },
        orderBy: { date: 'asc' }
    });
    
    const map = new Map();
    bills.forEach((b: any) => {
        const d = new Date(b.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        if (!map.has(d)) map.set(d, { date: d, new: 0, returning: 0, total: 0, _seen: new Set() });
        const dayData = map.get(d);
        if (b.patient && !dayData._seen.has(b.patientId)) {
            dayData._seen.add(b.patientId);
            dayData.total += 1;
            const pDate = new Date(b.patient.createdAt).toDateString();
            const bDate = new Date(b.date).toDateString();
            if (pDate === bDate) dayData.new += 1;
            else dayData.returning += 1;
        }
    });
    return Array.from(map.values()).map(({_seen, ...rest}) => rest);
}

export async function getTestTrendData(from?: string, to?: string) {
    const { orgId } = await requireAuth(); // 🚨 GATEKEEPER
    const { startDate, endDate } = getRange(from, to);
    const bills = await prisma.bill.findMany({
        where: { organizationId: orgId, date: { gte: startDate, lte: endDate }, isDeleted: false }, // 🚨 FILTER BY ORG
        include: { items: true },
        orderBy: { date: 'asc' }
    });
    const map = new Map();
    bills.forEach((b: any) => {
        const d = new Date(b.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        if (!map.has(d)) map.set(d, { date: d, tests: 0 });
        map.get(d).tests += (b.items?.length || 0);
    });
    return Array.from(map.values());
}

export async function getTestStatusData(from?: string, to?: string) {
    const { orgId } = await requireAuth(); // 🚨 GATEKEEPER
    const { startDate, endDate } = getRange(from, to);
    const items = await prisma.billItem.findMany({
        where: { organizationId: orgId, bill: { date: { gte: startDate, lte: endDate }, isDeleted: false } } // 🚨 FILTER BY ORG
    });
    let counts = { Pending: 0, Entered: 0, Approved: 0, Printed: 0 };
    items.forEach((i: any) => {
        if (counts[i.status as keyof typeof counts] !== undefined) counts[i.status as keyof typeof counts]++;
        else counts.Pending++;
    });
    return [
        { name: 'Pending', value: counts.Pending, fill: '#fbbf24' },
        { name: 'Entered', value: counts.Entered, fill: '#60a5fa' },
        { name: 'Approved', value: counts.Approved, fill: '#34d399' },
        { name: 'Printed', value: counts.Printed, fill: '#818cf8' },
    ].filter(d => d.value > 0);
}

export async function getTopTestsData(from?: string, to?: string) {
    const { orgId } = await requireAuth(); // 🚨 GATEKEEPER
    const { startDate, endDate } = getRange(from, to);
    const items = await prisma.billItem.findMany({
        where: { organizationId: orgId, bill: { date: { gte: startDate, lte: endDate }, isDeleted: false } }, // 🚨 FILTER BY ORG
        include: { test: true }
    });
    const map = new Map();
    items.forEach((i: any) => {
        const name = i.test?.name || 'Unknown';
        map.set(name, (map.get(name) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
}

export async function getTopReferralsData(from?: string, to?: string) {
    const { orgId } = await requireAuth(); // 🚨 GATEKEEPER
    const { startDate, endDate } = getRange(from, to);
    const bills = await prisma.bill.findMany({
        where: { organizationId: orgId, date: { gte: startDate, lte: endDate }, isDeleted: false }, // 🚨 FILTER BY ORG
        include: { patient: true }
    });
    const map = new Map();
    bills.forEach((b: any) => {
        const type = b.patient?.referralType;
        const doc = b.patient?.refDoctor;
        if (type !== 'Self' && doc && doc.toLowerCase() !== 'self') {
            if (!map.has(doc)) map.set(doc, { name: doc, patients: 0, revenue: 0, _seen: new Set() });
            const docData = map.get(doc);
            docData.revenue += b.netAmount;
            if (!docData._seen.has(b.patientId)) {
                docData._seen.add(b.patientId);
                docData.patients += 1;
            }
        }
    });
    return Array.from(map.values()).map(({_seen, ...rest}) => rest).sort((a: any, b: any) => b.patients - a.patients).slice(0, 5);
}

export async function getOutsourceData(from?: string, to?: string) {
    const { orgId } = await requireAuth(); // 🚨 GATEKEEPER
    const { startDate, endDate } = getRange(from, to);
    const items = await prisma.billItem.findMany({
        where: { organizationId: orgId, bill: { date: { gte: startDate, lte: endDate }, isDeleted: false } }, // 🚨 FILTER BY ORG
        include: { test: true }
    });
    let inHouse = 0, outsourced = 0;
    items.forEach((i: any) => {
        if (i.test?.isOutsourced) outsourced++;
        else inHouse++;
    });
    return [
        { name: 'In-House', value: inHouse, fill: '#34d399' },
        { name: 'Outsourced', value: outsourced, fill: '#f87171' }
    ].filter(d => d.value > 0);
}

export async function getSelfVsReferralData(from?: string, to?: string) {
    const { orgId } = await requireAuth(); // 🚨 GATEKEEPER
    const { startDate, endDate } = getRange(from, to);
    const bills = await prisma.bill.findMany({
        where: { organizationId: orgId, date: { gte: startDate, lte: endDate }, isDeleted: false }, // 🚨 FILTER BY ORG
        include: { patient: true }
    });
    
    let selfCount = 0;
    let referredCount = 0;
    const seen = new Set();
    
    bills.forEach((b: any) => {
        if (!seen.has(b.patientId)) {
            seen.add(b.patientId);
            const doc = b.patient?.refDoctor;
            if (!doc || String(doc).toLowerCase() === 'self') {
                selfCount++;
            } else {
                referredCount++;
            }
        }
    });
    
    return [
        { name: 'Self (Walk-in)', value: selfCount, fill: '#0ea5e9' },
        { name: 'Referred', value: referredCount, fill: '#8b5cf6' }   
    ].filter(d => d.value > 0);
}

export async function getReferralList() {
    try {
        const { orgId } = await requireAuth(); // 🚨 GATEKEEPER
        const refs = await prisma.doctor.findMany({
            where: { organizationId: orgId, isActive: true }, // 🚨 FILTER BY ORG
            select: { name: true },
            orderBy: { name: 'asc' }
        });
        
        return refs.map((r: { name: string }) => r.name).filter((n: string | null) => n && n.trim() !== '');
    } catch (error) {
        console.error("Error fetching referral master list:", error);
        return [];
    }
}

export async function getSpecificReferralTrendData(from?: string, to?: string, doctorName?: string) {
    if (!doctorName) return [];
    const { orgId } = await requireAuth(); // 🚨 GATEKEEPER
    const { startDate, endDate } = getRange(from, to);
    
    const bills = await prisma.bill.findMany({
        where: { 
            organizationId: orgId, // 🚨 FILTER BY ORG
            date: { gte: startDate, lte: endDate }, 
            patient: { refDoctor: { contains: doctorName } }, 
            isDeleted: false 
        },
        orderBy: { date: 'asc' }
    });
    
    const map = new Map();
    bills.forEach((b: any) => {
        const d = new Date(b.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        if (!map.has(d)) map.set(d, { date: d, revenue: 0, patients: 0 });
        const dayData = map.get(d);
        dayData.revenue += b.netAmount;
        dayData.patients += 1;
    });
    
    return Array.from(map.values());
}
// --- BLOCK app/actions/dashboard.ts CLOSE ---