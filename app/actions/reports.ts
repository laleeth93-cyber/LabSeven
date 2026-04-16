"use server";

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/server-auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const API_KEY = process.env.INTERNAL_API_KEY || "labseven_secret_key_2025";

export async function getReportSettings() {
    try {
        const { orgId } = await requireAuth();
        
        const response = await fetch(`${BACKEND_URL}/api/report-settings?orgId=${orgId}`, {
            method: 'GET',
            headers: { 'x-api-key': API_KEY },
            cache: 'no-store'
        });

        return await response.json();
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function updateReportSettings(data: any) {
    try {
        const { orgId } = await requireAuth();
        
        const response = await fetch(`${BACKEND_URL}/api/report-settings`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            body: JSON.stringify({ ...data, orgId })
        });

        const result = await response.json();

        if (result.success) {
            revalidatePath('/reports');
        }

        return result;
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}