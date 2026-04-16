"use server";

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/server-auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
const API_KEY = process.env.INTERNAL_API_KEY || 'labseven_secret_key_2025';

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'x-api-key': API_KEY
});

// 🚀 FETCH ALL REFERRALS (Filters by Type)
export async function getReferrals(type: string, search: string = '') {
    try {
        const { orgId } = await requireAuth();
        const url = new URL(`${BACKEND_URL}/api/doctors`); // Forwarding to the generic doctors/referrals backend route
        
        url.searchParams.append('orgId', orgId.toString());
        url.searchParams.append('type', type);
        if (search) url.searchParams.append('search', search);

        const res = await fetch(url.toString(), { 
            headers: getHeaders(), 
            cache: 'no-store' 
        });
        return await res.json();
    } catch (error) {
        return { success: false, message: "Failed to load referrals.", data: [] };
    }
}

// 🚀 SAVE / UPDATE REFERRAL
export async function saveReferral(data: any, type: string) {
    try {
        const { orgId } = await requireAuth();
        
        // Inject the organization ID and the Referral Type (Doctor/Lab/Hospital/Outsource)
        const payload = { ...data, type, orgId };

        const url = data.id 
            ? `${BACKEND_URL}/api/doctors/${data.id}` 
            : `${BACKEND_URL}/api/doctors`;

        const res = await fetch(url, {
            method: data.id ? 'PUT' : 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });

        const result = await res.json();
        if (result.success) revalidatePath('/referrals');
        return result;
    } catch (error: any) {
        return { success: false, message: "Backend unreachable." };
    }
}

// 🚀 DELETE REFERRAL
export async function deleteReferral(id: number) {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/doctors/${id}?orgId=${orgId}`, { 
            method: 'DELETE', 
            headers: getHeaders() 
        });
        
        const result = await res.json();
        if (result.success) revalidatePath('/referrals');
        return result;
    } catch (error) {
        return { success: false, message: "Backend unreachable." };
    }
}

// 🚀 TOGGLE STATUS (Active/Inactive)
export async function toggleReferralStatus(id: number, isActive: boolean) {
    try {
        const { orgId } = await requireAuth();
        const res = await fetch(`${BACKEND_URL}/api/doctors/${id}/status`, {
            method: 'PATCH', 
            headers: getHeaders(), 
            body: JSON.stringify({ orgId, isActive })
        });
        
        const result = await res.json();
        if (result.success) revalidatePath('/referrals');
        return result;
    } catch (error) {
        return { success: false, message: "Backend unreachable." };
    }
}