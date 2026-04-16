// --- BLOCK restructure/app/actions/parameters.ts OPEN ---
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

export async function generateNextParameterCode() {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/parameters/generate-code`, { headers: getHeaders(orgId), cache: 'no-store' });
        const result = await res.json();
        return result.data;
    } catch (error) {
        return 'PAR-0001';
    }
}

export async function getParameters() {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/parameters`, { headers: getHeaders(orgId), cache: 'no-store' });
        return await res.json();
    } catch (error) {
        return { success: false, message: "Failed to load parameters.", data: [] };
    }
}

export async function getParameter(id: number) {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/parameters/${id}`, { headers: getHeaders(orgId), cache: 'no-store' });
        return await res.json();
    } catch (error) {
        return { success: false, message: "Failed to fetch parameter" };
    }
}

export async function createParameter(data: any) {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/parameters`, {
            method: 'POST', headers: getHeaders(orgId), body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) revalidatePath('/parameters');
        return result;
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to create parameter." };
    }
}

export async function updateParameter(id: number, data: any) {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/parameters/${id}`, {
            method: 'PUT', headers: getHeaders(orgId), body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) revalidatePath('/parameters');
        return result;
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to update parameter." };
    }
}

export async function saveParameter(data: any) {
    if (data.id) return updateParameter(data.id, data);
    return createParameter(data);
}

export async function updateParameterStatus(id: number, isActive: boolean) {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/parameters/${id}/status`, {
            method: 'PATCH', headers: getHeaders(orgId), body: JSON.stringify({ isActive })
        });
        const result = await res.json();
        if (result.success) revalidatePath('/parameters');
        return result;
    } catch (error) {
        return { success: false, message: "Failed to update status." };
    }
}

export async function deleteParameter(id: number) {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/parameters/${id}`, { method: 'DELETE', headers: getHeaders(orgId) });
        const result = await res.json();
        if (result.success) revalidatePath('/parameters');
        return result;
    } catch (error) {
        return { success: false, message: "Failed to delete parameter." };
    }
}
// --- BLOCK restructure/app/actions/parameters.ts CLOSE ---