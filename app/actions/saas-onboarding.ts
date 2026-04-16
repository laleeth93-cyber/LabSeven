"use server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
const API_KEY = process.env.INTERNAL_API_KEY || 'labseven_secret_key_2025';

export async function registerNewSaaSLab(data: {
    labName: string;
    email: string;
    phone: string;
    address: string;
    adminName: string;
    adminUsername: string;
    adminPassword: string; 
}) {
    try {
        // Note: We do NOT use requireAuth() here because this is a public registration page.
        // It relies purely on the secure API_KEY to talk to the backend.
        
        const res = await fetch(`${BACKEND_URL}/api/saas/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            body: JSON.stringify(data)
        });
        
        const result = await res.json();
        return result;
        
    } catch (error: any) {
        console.error("SaaS Proxy Error:", error);
        return { success: false, message: "Backend unreachable. Please try again later." };
    }
}