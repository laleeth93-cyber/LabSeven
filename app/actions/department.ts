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

export async function getDepartments() {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/departments`, { headers: getHeaders(orgId), cache: 'no-store' });
        return await res.json();
    } catch (error) {
        return { success: false, message: "Failed to load departments.", data: [] };
    }
}

export async function createDepartment(data: any) {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/departments`, {
            method: 'POST', headers: getHeaders(orgId), body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) revalidatePath('/department');
        return result;
    } catch (error: any) {
        return { success: false, message: "Backend unreachable." };
    }
}

export async function updateDepartment(id: number, data: any) {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/departments/${id}`, {
            method: 'PUT', headers: getHeaders(orgId), body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) revalidatePath('/department');
        return result;
    } catch (error: any) {
        return { success: false, message: "Backend unreachable." };
    }
}

export async function saveDepartment(data: any) {
    if (data.id) return updateDepartment(data.id, data);
    return createDepartment(data);
}

export async function updateDepartmentStatus(id: number, isActive: boolean) {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/departments/${id}/status`, {
            method: 'PATCH', headers: getHeaders(orgId), body: JSON.stringify({ isActive })
        });
        const result = await res.json();
        if (result.success) revalidatePath('/department');
        return result;
    } catch (error) {
        return { success: false, message: "Backend unreachable." };
    }
}

export async function deleteDepartment(id: number) {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/departments/${id}`, { 
            method: 'DELETE', headers: getHeaders(orgId) 
        });
        const result = await res.json();
        if (result.success) revalidatePath('/department');
        return result;
    } catch (error) {
        return { success: false, message: "Backend unreachable." };
    }
}

// --- DUMMY STUBS FOR VERCEL BUILD ---
export async function generateDepartmentCode() { return "DEPT-000"; }
export async function toggleDepartmentStatus(id: number, status: boolean) { return { success: false }; }