"use server";

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/server-auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
const API_KEY = process.env.INTERNAL_API_KEY || 'labseven_secret_key_2025';

const getHeaders = (orgId: number) => ({
    'Content-Type': 'application/json',
    'x-org-id': orgId.toString(),
    'x-api-key': API_KEY
});

export async function generateNextPackageCode() {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/packages/generate-code`, { headers: getHeaders(orgId), cache: 'no-store' });
        const result = await res.json();
        return result.data;
    } catch (error) {
        return 'PKG-0001';
    }
}

export async function getPackages() {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/packages`, { headers: getHeaders(orgId), cache: 'no-store' });
        return await res.json();
    } catch (error) {
        return { success: false, message: "Failed to load packages.", data: [] };
    }
}

export async function getPackage(id: number) {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/packages/${id}`, { headers: getHeaders(orgId), cache: 'no-store' });
        return await res.json();
    } catch (error) {
        return { success: false, message: "Failed to fetch package" };
    }
}

export async function createPackage(data: any) {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/packages`, {
            method: 'POST', headers: getHeaders(orgId), body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) revalidatePath('/packages');
        return result;
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to create package." };
    }
}

export async function updatePackage(id: number, data: any) {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/packages/${id}`, {
            method: 'PUT', headers: getHeaders(orgId), body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) revalidatePath('/packages');
        return result;
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to update package." };
    }
}

export async function savePackage(data: any) {
    if (data.id) return updatePackage(data.id, data);
    return createPackage(data);
}

export async function updatePackageStatus(id: number, isActive: boolean) {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/packages/${id}/status`, {
            method: 'PATCH', headers: getHeaders(orgId), body: JSON.stringify({ isActive })
        });
        const result = await res.json();
        if (result.success) revalidatePath('/packages');
        return result;
    } catch (error) {
        return { success: false, message: "Failed to update status." };
    }
}

export async function deletePackage(id: number) {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/packages/${id}`, { method: 'DELETE', headers: getHeaders(orgId) });
        const result = await res.json();
        if (result.success) revalidatePath('/packages');
        return result;
    } catch (error) {
        return { success: false, message: "Failed to delete package." };
    }
}

// --- DUMMY STUBS FOR VERCEL BUILD ---
export async function savePackageTests(pkgId: number, tests: any[]) { return { success: false }; }
export async function getAvailableTestsForPackage(pkgId: number) { return []; }