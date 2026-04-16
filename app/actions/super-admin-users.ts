"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from '@/lib/server-auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
const API_KEY = process.env.INTERNAL_API_KEY || 'labseven_secret_key_2025';

const getHeaders = (orgId: number) => ({
    'Content-Type': 'application/json',
    'x-org-id': orgId.toString(),
    'x-api-key': API_KEY
});

export async function createSuperAdminUser(data: { name: string, username: string, email: string, password: string }) {
    try {
        const { orgId } = await requireAuth();
        
        const res = await fetch(`${BACKEND_URL}/api/super-admin-users/create`, {
            method: 'POST',
            headers: getHeaders(orgId),
            body: JSON.stringify(data)
        });
        
        const result = await res.json();
        
        if (result.success) {
            revalidatePath("/super-admin/admins");
        }
        
        return result;
    } catch (error: any) {
        console.error("Create Super Admin Proxy Error:", error);
        return { success: false, message: "Backend unreachable." };
    }
}

export async function toggleAdminStatus(id: number, currentStatus: boolean) {
    try {
        const { orgId } = await requireAuth();
        
        const res = await fetch(`${BACKEND_URL}/api/super-admin-users/${id}/status`, {
            method: 'PATCH',
            headers: getHeaders(orgId),
            body: JSON.stringify({ currentStatus })
        });
        
        const result = await res.json();
        
        if (result.success) {
            revalidatePath("/super-admin/admins");
        }
        
        return result;
    } catch (error: any) {
        console.error("Toggle Admin Status Proxy Error:", error);
        return { success: false, message: "Backend unreachable." };
    }
}