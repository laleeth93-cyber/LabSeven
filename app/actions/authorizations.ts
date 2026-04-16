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

// ==========================================
// USERS
// ==========================================
export async function getUsers() {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/authorizations/users`, { headers: getHeaders(orgId), cache: 'no-store' });
        const result = await res.json();
        return result.success ? result.data : [];
    } catch (error) {
        return [];
    }
}

export async function saveUser(data: any) {
    try {
        const { orgId } = await requireAuth();
        const url = data.id 
            ? `${BACKEND_URL}/api/authorizations/users/${data.id}` 
            : `${BACKEND_URL}/api/authorizations/users`;
            
        const res = await fetch(url, {
            method: data.id ? 'PUT' : 'POST', 
            headers: getHeaders(orgId), 
            body: JSON.stringify(data)
        });
        
        const result = await res.json();
        if (result.success) revalidatePath('/authorizations');
        return result;
    } catch (error: any) {
        return { success: false, message: "Backend unreachable." };
    }
}

export async function deleteUser(id: number) {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/authorizations/users/${id}`, { method: 'DELETE', headers: getHeaders(orgId) });
        const result = await res.json();
        if (result.success) revalidatePath('/authorizations');
        return result;
    } catch (error) {
        return { success: false, message: "Backend unreachable." };
    }
}

// ==========================================
// ROLES & PERMISSIONS
// ==========================================
export async function getRoles() {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/authorizations/roles`, { headers: getHeaders(orgId), cache: 'no-store' });
        const result = await res.json();
        return result.success ? result.data : [];
    } catch (error) {
        return [];
    }
}

export async function saveRole(data: any) {
    try {
        const { orgId } = await requireAuth();
        const url = data.id 
            ? `${BACKEND_URL}/api/authorizations/roles/${data.id}` 
            : `${BACKEND_URL}/api/authorizations/roles`;
            
        const res = await fetch(url, {
            method: data.id ? 'PUT' : 'POST', 
            headers: getHeaders(orgId), 
            body: JSON.stringify(data)
        });
        
        const result = await res.json();
        if (result.success) revalidatePath('/authorizations');
        return result;
    } catch (error: any) {
        return { success: false, message: "Backend unreachable." };
    }
}

export async function deleteRole(id: number) {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/authorizations/roles/${id}`, { method: 'DELETE', headers: getHeaders(orgId) });
        const result = await res.json();
        if (result.success) revalidatePath('/authorizations');
        return result;
    } catch (error) {
        return { success: false, message: "Backend unreachable." };
    }
}

export async function getAllPermissions() {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/authorizations/permissions`, { headers: getHeaders(orgId), cache: 'no-store' });
        const result = await res.json();
        return result.success ? result.data : [];
    } catch (error) {
        return [];
    }
}

export async function getUserPermissions(userId: number) {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/authorizations/user-permissions/${userId}`, { headers: getHeaders(orgId), cache: 'no-store' });
        return await res.json();
    } catch (error) {
        console.error("Failed to fetch user permissions:", error);
        return { success: false, data: [], roleName: '' };
    }
}

export async function assignPermissions(roleId: number, permissionIds: number[]) {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/authorizations/roles/${roleId}/permissions`, {
            method: 'POST',
            headers: getHeaders(orgId),
            body: JSON.stringify({ permissionIds })
        });
        const result = await res.json();
        if (result.success) revalidatePath('/authorizations');
        return result;
    } catch (error: any) {
        return { success: false, message: "Backend unreachable." };
    }
}

// --- DUMMY STUBS FOR VERCEL BUILD ---
export async function saveUserPermissions(data: any) { return { success: false }; }
export async function saveUserSignatureDetails(data: any) { return { success: false }; }
export async function toggleUserStatus(id: number, status: boolean) { return { success: false }; }
export async function resetUserPassword(id: number) { return { success: false }; }