"use server";

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/server-auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const API_KEY = process.env.INTERNAL_API_KEY || "labseven_secret_key_2025";

type MicroType = 'organism' | 'antibiotic' | 'antibioticClass' | 'interpretation' | 'susceptibilityInfo';

function revalidateMicrobiology() {
    revalidatePath('/organisms');
    revalidatePath('/antibiotics');
    revalidatePath('/antibiotic-classes');
    revalidatePath('/multi-values');
    revalidatePath('/susceptibility-info');
    revalidatePath('/sensitivity');
}

// 🚀 Helper to keep the frontend completely DRY
async function fetchPaginated(type: MicroType, page: number, limit: number, search: string) {
    try {
        const { orgId } = await requireAuth();
        const url = new URL(`${BACKEND_URL}/api/microbiology/paginated/${type}`);
        url.searchParams.append('orgId', orgId.toString());
        url.searchParams.append('page', page.toString());
        url.searchParams.append('limit', limit.toString());
        if (search) url.searchParams.append('search', search);

        const response = await fetch(url.toString(), {
            headers: { 'x-api-key': API_KEY },
            cache: 'no-store'
        });
        return await response.json();
    } catch (error: any) { return { success: false, message: error.message }; }
}

export async function getOrganismsPaginated(page: number = 1, limit: number = 20, search: string = '') {
    return fetchPaginated('organism', page, limit, search);
}

export async function getAntibioticsPaginated(page: number = 1, limit: number = 20, search: string = '') {
    return fetchPaginated('antibiotic', page, limit, search);
}

export async function getAntibioticClassesPaginated(page: number = 1, limit: number = 20, search: string = '') {
    return fetchPaginated('antibioticClass', page, limit, search);
}

export async function getInterpretationsPaginated(page: number = 1, limit: number = 20, search: string = '') {
    return fetchPaginated('interpretation', page, limit, search);
}

export async function getSusceptibilityInfoPaginated(page: number = 1, limit: number = 20, search: string = '') {
    return fetchPaginated('susceptibilityInfo', page, limit, search);
}

export async function getMicrobiologyMaster(type: MicroType) {
    try {
        const { orgId } = await requireAuth();
        const response = await fetch(`${BACKEND_URL}/api/microbiology/master/${type}?orgId=${orgId}`, {
            headers: { 'x-api-key': API_KEY },
            cache: 'no-store'
        });
        return await response.json();
    } catch (error: any) { return { success: false, message: error.message }; }
}

export async function saveMicrobiologyMaster(type: MicroType, data: any) {
    try {
        const { orgId } = await requireAuth();
        const response = await fetch(`${BACKEND_URL}/api/microbiology/master/${type}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
            body: JSON.stringify({ orgId, data })
        });
        const result = await response.json();
        if (result.success) revalidateMicrobiology();
        return result;
    } catch (error: any) { return { success: false, message: error.message }; }
}

export async function mapOrganismAntibiotics(organismId: number, antibioticIds: number[]) {
    try {
        const { orgId } = await requireAuth();
        const response = await fetch(`${BACKEND_URL}/api/microbiology/organism/map-antibiotics`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
            body: JSON.stringify({ orgId, organismId, antibioticIds })
        });
        const result = await response.json();
        if (result.success) revalidateMicrobiology();
        return result;
    } catch (error: any) { return { success: false, message: error.message }; }
}

export async function importMicrobiologyMaster(type: MicroType, dataArray: any[]) {
    try {
        const { orgId } = await requireAuth();
        const response = await fetch(`${BACKEND_URL}/api/microbiology/master/${type}/import`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
            body: JSON.stringify({ orgId, dataArray })
        });
        const result = await response.json();
        if (result.success) revalidateMicrobiology();
        return result;
    } catch (error: any) { return { success: false, message: error.message }; }
}

export async function deleteMicrobiologyMaster(type: MicroType, id: number) {
    try {
        const { orgId } = await requireAuth();
        const response = await fetch(`${BACKEND_URL}/api/microbiology/master/${type}/${id}?orgId=${orgId}`, {
            method: 'DELETE',
            headers: { 'x-api-key': API_KEY }
        });
        const result = await response.json();
        if (result.success) revalidateMicrobiology();
        return result;
    } catch (error: any) { return { success: false, message: error.message }; }
}

export async function deleteAllMicrobiologyMaster(type: MicroType) {
    try {
        const { orgId } = await requireAuth();
        const response = await fetch(`${BACKEND_URL}/api/microbiology/master/${type}/all?orgId=${orgId}`, {
            method: 'DELETE',
            headers: { 'x-api-key': API_KEY }
        });
        const result = await response.json();
        if (result.success) revalidateMicrobiology();
        return result;
    } catch (error: any) { return { success: false, message: error.message }; }
}