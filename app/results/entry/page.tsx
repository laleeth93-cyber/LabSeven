import React from 'react';
import { getPendingWorklist } from '@/app/actions/result-entry';
import ClientResultEntry from './ClientResultEntry';

export default async function ResultEntryPage() {
    // 1. Fetch ONLY the worklist instantly. No deep loading here!
    const initialRes = await getPendingWorklist();
    const initialBills = initialRes?.success && initialRes?.data ? initialRes.data : [];

    // 2. Pass to the client so the page loads in milliseconds
    return <ClientResultEntry initialBills={initialBills} initialFirstBillData={null} />;
}