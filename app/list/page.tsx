import React from 'react';
import { getPatientList } from '@/app/actions/patient-list';
import ClientPatientList from './ClientPatientList';

export default async function PatientListPage() {
    // 🚨 1. Fetch data instantly using the correct Patient List API
    const initialRes = await getPatientList();
    const initialBills = initialRes?.success && initialRes?.data ? initialRes.data : [];

    // 🚨 2. Pass the data to the Client component
    return <ClientPatientList initialBills={initialBills} />;
}