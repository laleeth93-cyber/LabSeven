// --- BLOCK restructure/app/actions/result-entry.ts OPEN ---
"use server";

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/server-auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
const API_KEY = process.env.BACKEND_API_KEY || 'labseven_secure_backend_key_2026';

interface TestResultItem {
  billItemId: number;
  parameterId?: number | null; 
  value: string;
  flag: string;
}

const getHeaders = (orgId: number) => ({
    'Content-Type': 'application/json',
    'x-org-id': orgId.toString(),
    'x-api-key': API_KEY
});

export async function getSignatureUsers() {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/results/signatures`, { headers: getHeaders(orgId), cache: 'no-store' });
        if (!res.ok) throw new Error("Backend Unreachable");
        return await res.json();
    } catch (error) {
        return { success: false, data: [] };
    }
}

export async function getPendingWorklist(search?: string) {
    try {
        const { orgId } = await requireAuth();
        const url = new URL(`${BACKEND_URL}/api/results/worklist`);
        if (search) url.searchParams.append('search', search);

        const res = await fetch(url.toString(), { headers: getHeaders(orgId), cache: 'no-store' });
        return await res.json();
    } catch (error) {
        return { success: false, data: [] };
    }
}

export async function getResultEntryData(billId: number) {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/results/entry-data/${billId}`, { headers: getHeaders(orgId), cache: 'no-store' });
        return await res.json();
    } catch (error) {
        return { success: false, error: "Failed to load bill" };
    }
}

export async function saveTestResults(billId: number, results: TestResultItem[], status: string = 'Entered', sig1Id?: number | null, sig2Id?: number | null) {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/results/save`, {
            method: 'POST',
            headers: getHeaders(orgId),
            body: JSON.stringify({ billId, results, status, sig1Id, sig2Id })
        });
        const data = await res.json();
        if (data.success) revalidatePath('/results/entry');
        return data;
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function saveTestNote(billItemId: number, note: string) {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/results/note`, {
            method: 'POST',
            headers: getHeaders(orgId),
            body: JSON.stringify({ billItemId, note })
        });
        const data = await res.json();
        if (data.success) revalidatePath('/results/entry');
        return data;
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function checkHistoryAvailability(patientId: number, parameterIds: number[], excludeBillId?: number) {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/results/history-check`, {
            method: 'POST',
            headers: getHeaders(orgId),
            body: JSON.stringify({ patientId, parameterIds, excludeBillId })
        });
        return await res.json();
    } catch (error) {
        return { success: false, data: [] };
    }
}

export async function getParameterHistory(patientId: number, parameterId: number) {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/results/history/${patientId}/${parameterId}`, { headers: getHeaders(orgId), cache: 'no-store' });
        return await res.json();
    } catch (error) {
        return { success: false };
    }
}

export async function getDeltaCheckData(billId: number, patientId: number) {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/results/delta-check/${billId}/${patientId}`, { headers: getHeaders(orgId), cache: 'no-store' });
        return await res.json();
    } catch (error) {
        return { success: false, data: [] };
    }
}

export async function clearAllEntryData() {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/results/clear-all`, {
            method: 'POST',
            headers: getHeaders(orgId)
        });
        const data = await res.json();
        if (data.success) revalidatePath('/results/entry');
        return data;
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}
// --- BLOCK app/actions/result-entry.ts CLOSE ---