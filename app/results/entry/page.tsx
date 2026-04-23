import React from 'react';
import { getPendingWorklist, getResultEntryData } from '@/app/actions/result-entry';
import ClientResultEntry from './ClientResultEntry';

export default async function ResultEntryPage() {
    // 1. Fetch the main worklist instantly on the server
    const initialRes = await getPendingWorklist();
    const initialBills = initialRes?.success && initialRes?.data ? initialRes.data : [];

    // 2. 🚨 THE FIX: Fetch the FULL deep-data for Patient #1 before the page even loads!
    let initialFirstBillData = null;
    if (initialBills.length > 0) {
        const firstRes = await getResultEntryData(initialBills[0].id);
        if (firstRes?.success && firstRes?.data) {
            initialFirstBillData = firstRes.data;
        }
    }

    // 3. Pass both the list and Patient #1 perfectly to your Client UI
    return <ClientResultEntry initialBills={initialBills} initialFirstBillData={initialFirstBillData} />;
}