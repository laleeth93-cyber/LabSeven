import React from 'react';
import { getPendingWorklist } from '@/app/actions/result-entry';
import ClientResultEntry from './ClientResultEntry';

export default async function ResultEntryPage({ 
    searchParams 
}: { 
    searchParams?: { billId?: string, billNumber?: string } 
}) {
    // 1. Fetch ONLY the worklist instantly. No deep loading here!
    const initialRes = await getPendingWorklist();
    const initialBills = initialRes?.success && initialRes?.data ? initialRes.data : [];

    // 2. Intelligently figure out the internal Bill ID whether it came from the Link or the InvoiceModal
    let initialBillId = null;
    
    if (searchParams?.billId) {
        // If we got the exact database ID (from BillingWindowPage)
        initialBillId = Number(searchParams.billId);
    } else if (searchParams?.billNumber) {
        // If we got the text billNumber (from InvoiceModal), look it up in the pending list!
        const matchedBill = initialBills.find((b: any) => b.billNumber === searchParams.billNumber);
        if (matchedBill) {
            initialBillId = matchedBill.id;
        }
    }

    // 3. Pass to the client so the page loads the exact patient form in milliseconds
    return (
        <ClientResultEntry 
             initialBills={initialBills} 
             initialFirstBillData={null} 
             initialBillId={initialBillId} 
         />
    );
}