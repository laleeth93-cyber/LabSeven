import React from 'react';
import { getPendingWorklist } from '@/app/actions/result-entry';
import ClientPatientList from './ClientPatientList';

export default async function PatientListPage() {
    // 🚨 1. Fetch data instantly on the server before the page loads
    const initialRes = await getPendingWorklist();
    const initialBills = initialRes?.success && initialRes?.data ? initialRes.data : [];

    // 🚨 2. Pass the data perfectly to your existing Client component
    return <ClientPatientList initialBills={initialBills} />;
}