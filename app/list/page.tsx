import React from 'react';
import { getPatientList } from '@/app/actions/patient-list';
import ClientPatientList from './ClientPatientList';

// 🚨 ADDED: This forces Next.js to render the page dynamically on every request,
// preventing the DYNAMIC_SERVER_USAGE build error on Vercel.
export const dynamic = 'force-dynamic';

export default async function PatientListPage() {
    // 🚨 1. Fetch data instantly using the correct Patient List API
    const initialRes = await getPatientList();
    const initialBills = initialRes?.success && initialRes?.data ? initialRes.data : [];

    // 🚨 2. Pass the data to the Client component
    return <ClientPatientList initialBills={initialBills} />;
}