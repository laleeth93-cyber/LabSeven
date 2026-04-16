"use server";

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/server-auth'; 

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
const API_KEY = process.env.INTERNAL_API_KEY || 'labseven_secret_key_2025';

export async function updateTestConfiguration(testId: number, data: any) {
  try {
    const { orgId } = await requireAuth(); 

    // ⚡ Forward the heavy lifting to the Node.js Engine
    const res = await fetch(`${BACKEND_URL}/api/test-config/${testId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY
        },
        body: JSON.stringify({ orgId, data })
    });

    const result = await res.json();

    if (result.success) {
        revalidatePath('/tests/configuration');
        revalidatePath('/tests/formats');
    }

    return result;

  } catch (error: any) {
    console.error("Test Config Proxy Error:", error);
    return { success: false, message: "Backend unreachable." };
  }
}