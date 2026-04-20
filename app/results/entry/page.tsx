// app/results/entry/page.tsx
// 🚨 NO "use client" directive here! This is a pure Server Component.

import React from 'react';
import { getPendingWorklist } from '@/app/actions/result-entry';
import ClientResultEntry from './ClientResultEntry';

export const dynamic = 'force-dynamic';

export default async function ResultEntryPage() {
    // 1. Fetch data instantly on the server before the page loads
    const initialRes = await getPendingWorklist();
    const initialBills = initialRes?.success && initialRes?.data ? initialRes.data : [];

    // 2. Pass the pre-loaded data perfectly to your new Client component
    return <ClientResultEntry initialBills={initialBills} />;
}