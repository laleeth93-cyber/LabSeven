// --- BLOCK restructure/app/actions/patient-list.ts OPEN ---
"use server";

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/server-auth'; // 🚨 Keeps your Frontend Secure!

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
// 🚨 The Secret Key that only Next.js and Node.js know
const API_KEY = process.env.BACKEND_API_KEY || 'labseven_secure_backend_key_2026';

export async function getPatientList(searchQuery: string = '', startDate?: string, endDate?: string) {
    try {
        const { orgId } = await requireAuth(); 
        
        const url = new URL(`${BACKEND_URL}/api/patient-list`);
        if (searchQuery) url.searchParams.append('searchQuery', searchQuery);
        if (startDate) url.searchParams.append('startDate', startDate);
        if (endDate) url.searchParams.append('endDate', endDate);

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json', 
                'x-org-id': orgId.toString(),
                'x-api-key': API_KEY 
            },
            cache: 'no-store' 
        });

        if (!response.ok) throw new Error("Backend Unreachable");
        return await response.json();
    } catch (error: any) {
        console.error("Frontend failed to reach Node.js Backend:", error);
        return { success: false, message: "Backend Server Unreachable", data: [] };
    }
}

export async function clearBillDue(billId: number, amount: number, paymentMode: string) {
    try {
        const { orgId } = await requireAuth();
        const response = await fetch(`${BACKEND_URL}/api/patient-list/clear-due`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'x-org-id': orgId.toString(),
                'x-api-key': API_KEY 
            },
            body: JSON.stringify({ billId, amount, paymentMode })
        });

        const data = await response.json();
        if (data.success) revalidatePath('/list');
        return data;
    } catch (error: any) {
        return { success: false, message: "Failed to connect to backend" };
    }
}

export async function processRefund(billId: number, amount: number, mode: string, reason: string) {
    try {
        const { orgId } = await requireAuth();
        const response = await fetch(`${BACKEND_URL}/api/patient-list/refund`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'x-org-id': orgId.toString(),
                'x-api-key': API_KEY 
            },
            body: JSON.stringify({ billId, amount, mode, reason })
        });

        const data = await response.json();
        if (data.success) revalidatePath('/list');
        return data;
    } catch (error: any) {
        return { success: false, message: "Failed to connect to backend" };
    }
}

export async function deleteBill(billId: number) {
    try {
        const { orgId } = await requireAuth();
        const response = await fetch(`${BACKEND_URL}/api/patient-list/delete`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'x-org-id': orgId.toString(),
                'x-api-key': API_KEY 
            },
            body: JSON.stringify({ billId })
        });

        const data = await response.json();
        if (data.success) revalidatePath('/list');
        return data;
    } catch (error: any) {
        return { success: false, message: "Failed to connect to backend" };
    }
}

export async function updatePatientDetails(patientId: number, data: any) {
    try {
        const { orgId } = await requireAuth();
        const response = await fetch(`${BACKEND_URL}/api/patient-list/update-patient`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json', 
                'x-org-id': orgId.toString(),
                'x-api-key': API_KEY 
            },
            body: JSON.stringify({ patientId, data })
        });

        const result = await response.json();
        if (result.success) revalidatePath('/list');
        return result;
    } catch (error: any) {
        return { success: false, message: "Failed to connect to backend" };
    }
}

export async function searchMasterTests(query: string) {
    if (!query || query.length < 2) return [];
    try {
        const { orgId } = await requireAuth();
        const url = new URL(`${BACKEND_URL}/api/patient-list/search-tests`);
        url.searchParams.append('q', query);

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json', 
                'x-org-id': orgId.toString(),
                'x-api-key': API_KEY 
            },
            cache: 'no-store'
        });

        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        return [];
    }
}
// --- BLOCK restructure/app/actions/patient-list.ts CLOSE ---