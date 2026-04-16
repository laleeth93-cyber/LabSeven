"use server";

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/server-auth';

// ⚡ Connect to the Node.js Engine
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

// 🚨 We use the explicit string as a fallback to defeat Next.js caching!
const API_KEY = process.env.INTERNAL_API_KEY || 'labseven_secret_key_2025';

const getHeaders = (orgId: number) => ({
    'Content-Type': 'application/json',
    'x-org-id': orgId.toString(),
    'x-api-key': API_KEY
});

export async function generateMasterCode(tab: string) {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/masters/${tab}/generate-code`, { 
            headers: getHeaders(orgId), 
            cache: 'no-store' 
        });
        const result = await res.json();
        return result.data;
    } catch (error) {
        return 'GEN-0000';
    }
}

export async function getMasterData(tab: string) {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/masters/${tab}`, { 
            headers: getHeaders(orgId), 
            cache: 'no-store' 
        });
        return await res.json();
    } catch (error) {
        return { success: false, data: [] };
    }
}

export async function saveMasterData(tab: string, data: any) {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/masters/${tab}/save`, {
            method: 'POST',
            headers: getHeaders(orgId),
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) revalidatePath('/masters');
        return result;
    } catch (error) {
        return { success: false, message: "Backend unreachable." };
    }
}

export async function deleteMasterData(tab: string, id: number) {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/masters/${tab}/${id}`, { 
            method: 'DELETE', 
            headers: getHeaders(orgId) 
        });
        const result = await res.json();
        if (result.success) revalidatePath('/masters');
        return result;
    } catch (error) {
        return { success: false, message: "Backend unreachable." };
    }
}

export async function toggleMasterStatus(tab: string, id: number, currentStatus: boolean) {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/masters/${tab}/${id}/status`, {
            method: 'PATCH',
            headers: getHeaders(orgId),
            body: JSON.stringify({ currentStatus })
        });
        const result = await res.json();
        if (result.success) revalidatePath('/masters');
        return result;
    } catch (error) {
        return { success: false };
    }
}