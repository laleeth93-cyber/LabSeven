// --- BLOCK restructure/app/actions/billing.ts OPEN ---
"use server";

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/server-auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
const API_KEY = process.env.BACKEND_API_KEY || 'labseven_secure_backend_key_2026';

const getHeaders = (orgId: number) => ({
    'Content-Type': 'application/json',
    'x-org-id': orgId.toString(),
    'x-api-key': API_KEY
});

// 1. SEARCH TESTS
export async function searchTests(query: string) {
    if (!query || query.length < 2) return [];

    try {
        const { orgId } = await requireAuth();
        
        const url = new URL(`${BACKEND_URL}/api/billing/search`);
        url.searchParams.append('q', query);

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: getHeaders(orgId),
            cache: 'no-store'
        });

        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error("Frontend failed to reach search API:", error);
        return [];
    }
}

// 2. CREATE BILL
export async function createBill(data: any) {
    try {
        const { orgId } = await requireAuth();

        const response = await fetch(`${BACKEND_URL}/api/billing/create`, {
            method: 'POST',
            headers: getHeaders(orgId),
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            revalidatePath('/list');
            revalidatePath('/');
        }

        return result;
    } catch (error: any) {
        console.error("Frontend failed to connect to backend for billing:", error);
        return { success: false, message: "Backend Server Unreachable" };
    }
}
// --- BLOCK restructure/app/actions/billing.ts CLOSE ---