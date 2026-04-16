"use server";

import { requireAuth } from '@/lib/server-auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
const API_KEY = process.env.INTERNAL_API_KEY || 'labseven_secret_key_2025';

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'x-api-key': API_KEY
});

// 🚀 Helper to keep the dashboard chart fetchers completely DRY
async function fetchDashboardData(endpoint: string, from?: string | null, to?: string | null, extraParams: Record<string, string> = {}) {
    try {
        const { orgId } = await requireAuth();
        const url = new URL(`${BACKEND_URL}/api/dashboard/${endpoint}`);
        
        url.searchParams.append('orgId', orgId.toString());
        if (from) url.searchParams.append('from', from);
        if (to) url.searchParams.append('to', to);

        Object.entries(extraParams).forEach(([key, value]) => {
            if (value) url.searchParams.append(key, value);
        });

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: getHeaders(),
            cache: 'no-store'
        });

        const result = await response.json();
        return result.success ? result.data : [];
    } catch (error) {
        console.error(`Error fetching dashboard ${endpoint}:`, error);
        return []; 
    }
}

// =====================================
// EXISTING STATS
// =====================================
export async function getDashboardStats() {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/dashboard/stats?orgId=${orgId}`, { 
            headers: getHeaders(), 
            cache: 'no-store' 
        });
        const result = await res.json();
        return result.success ? result.data : null;
    } catch (error) {
        console.error("Failed to fetch dashboard stats from backend:", error);
        return { todaysPatients: 0, todaysRevenue: 0, pendingResults: 0, totalDues: 0 };
    }
}

export async function getRecentActivity() {
    return fetchDashboardData('recent-activity');
}

// =====================================
// 🚨 MISSING CHART WIDGET FETCHERS 🚨
// =====================================
export async function getKPIs(from?: string | null, to?: string | null) {
    try {
        const { orgId } = await requireAuth();
        const url = new URL(`${BACKEND_URL}/api/dashboard/kpis`);
        url.searchParams.append('orgId', orgId.toString());
        if (from) url.searchParams.append('from', from);
        if (to) url.searchParams.append('to', to);

        const response = await fetch(url.toString(), { headers: getHeaders(), cache: 'no-store' });
        const result = await response.json();
        return result.success ? result.data : { totalBills: 0, totalRevenue: 0, totalPatients: 0, totalTests: 0, totalDue: 0, outsourced: 0 };
    } catch (error) {
        return { totalBills: 0, totalRevenue: 0, totalPatients: 0, totalTests: 0, totalDue: 0, outsourced: 0 };
    }
}

export async function getRevenueData(from?: string | null, to?: string | null) { return fetchDashboardData('revenue', from, to); }
export async function getPatientData(from?: string | null, to?: string | null) { return fetchDashboardData('patients', from, to); }
export async function getTestTrendData(from?: string | null, to?: string | null) { return fetchDashboardData('test-trend', from, to); }
export async function getTestStatusData(from?: string | null, to?: string | null) { return fetchDashboardData('test-status', from, to); }
export async function getTopTestsData(from?: string | null, to?: string | null) { return fetchDashboardData('top-tests', from, to); }
export async function getTopReferralsData(from?: string | null, to?: string | null) { return fetchDashboardData('top-referrals', from, to); }
export async function getOutsourceData(from?: string | null, to?: string | null) { return fetchDashboardData('outsource', from, to); }
export async function getSelfVsReferralData(from?: string | null, to?: string | null) { return fetchDashboardData('self-vs-referral', from, to); }

export async function getReferralList() {
    return fetchDashboardData('referral-list');
}

export async function getSpecificReferralTrendData(from?: string | null, to?: string | null, refName?: string) {
    return fetchDashboardData('specific-referral', from, to, refName ? { refName } : {});
}