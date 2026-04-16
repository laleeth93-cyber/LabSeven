// --- BLOCK restructure/app/actions/patient.ts OPEN ---
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

export async function generatePatientId() {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/patients/generate-id`, { headers: getHeaders(orgId), cache: 'no-store' });
        const result = await res.json();
        return result.data;
    } catch (error) {
        return 'PT-0001';
    }
}

export async function getPatients() {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/patients`, { headers: getHeaders(orgId), cache: 'no-store' });
        return await res.json();
    } catch (error) {
        return { success: false, message: "Failed to load patients.", data: [] };
    }
}

export async function getPatientById(id: number) {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/patients/${id}`, { headers: getHeaders(orgId), cache: 'no-store' });
        return await res.json();
    } catch (error) {
        return { success: false, message: "Failed to fetch patient" };
    }
}

export async function createPatient(data: any) {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/patients`, {
            method: 'POST', headers: getHeaders(orgId), body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) revalidatePath('/patients');
        return result;
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to create patient." };
    }
}

export async function updatePatient(id: number, data: any) {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/patients/${id}`, {
            method: 'PUT', headers: getHeaders(orgId), body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) revalidatePath('/patients');
        return result;
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to update patient." };
    }
}

export async function savePatient(data: any) {
    if (data.id) return updatePatient(data.id, data);
    return createPatient(data);
}

export async function deletePatient(id: number) {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/patients/${id}`, { method: 'DELETE', headers: getHeaders(orgId) });
        const result = await res.json();
        if (result.success) revalidatePath('/patients');
        return result;
    } catch (error) {
        return { success: false, message: "Failed to delete patient." };
    }
}
// --- BLOCK restructure/app/actions/patient.ts CLOSE ---