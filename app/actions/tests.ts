// --- BLOCK restructure/app/actions/tests.ts OPEN ---
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

export async function generateTestCode(type: string = 'Test') {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/tests/generate-code?type=${type}`, { headers: getHeaders(orgId), cache: 'no-store' });
        const result = await res.json();
        return result.data;
    } catch (error) {
        return type === 'Package' ? 'PKG-0001' : 'TST-0001';
    }
}

export async function getOutsourceLabs() {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/tests/outsource-labs`, { headers: getHeaders(orgId), cache: 'no-store' });
        return await res.json();
    } catch (error) {
        return { success: false, data: [] };
    }
}

export async function getTests() {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/tests`, { headers: getHeaders(orgId), cache: 'no-store' });
        return await res.json();
    } catch (error) {
        return { success: false, message: "Failed to load tests.", data: [] };
    }
}

export async function getTestsForFormats() {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/tests/formats`, { headers: getHeaders(orgId), cache: 'no-store' });
        return await res.json();
    } catch (error) {
        return { success: false, message: "Failed to load tests.", data: [] };
    }
}

export async function getTestById(id: number) {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/tests/${id}`, { headers: getHeaders(orgId), cache: 'no-store' });
        return await res.json();
    } catch (error) {
        return { success: false, message: "Test not found" };
    }
}

export async function createTest(data: any) {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/tests`, {
            method: 'POST', headers: getHeaders(orgId), body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) revalidatePath('/tests');
        return result;
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to create test." };
    }
}

export async function updateTest(id: number, data: any) {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/tests/${id}`, {
            method: 'PUT', headers: getHeaders(orgId), body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) revalidatePath('/tests');
        return result;
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to update test." };
    }
}

export async function saveTest(data: any) {
    if (data.id) return updateTest(data.id, data);
    return createTest(data);
}

export async function deleteTest(id: number) {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/tests/${id}`, { method: 'DELETE', headers: getHeaders(orgId) });
        const result = await res.json();
        if (result.success) revalidatePath('/tests');
        return result;
    } catch (error) {
        return { success: false, message: "Failed to delete test." };
    }
}

export async function toggleTestStatus(id: number, currentStatus: boolean) {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/tests/${id}/toggle`, {
            method: 'PATCH', headers: getHeaders(orgId), body: JSON.stringify({ currentStatus })
        });
        const result = await res.json();
        if (result.success) revalidatePath('/tests');
        return result;
    } catch (error) {
        return { success: false, message: "Failed to toggle status." };
    }
}
// --- BLOCK restructure/app/actions/tests.ts CLOSE ---