"use server";

import { requireAuth } from "@/lib/server-auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
const API_KEY = process.env.INTERNAL_API_KEY || 'labseven_secret_key_2025';

export async function getTenantFeatures() {
    try {
        const { orgId } = await requireAuth();
        
        const res = await fetch(`${BACKEND_URL}/api/tenant/features?orgId=${orgId}`, {
            method: 'GET',
            headers: { 'x-api-key': API_KEY },
            cache: 'no-store'
        });
        
        return await res.json();
    } catch (error) {
        return { success: false, hasSensitivity: false };
    }
}