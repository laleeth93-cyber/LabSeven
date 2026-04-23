import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DashboardClient from "./DashboardClient";

// 🚨 IMPORT ALL DASHBOARD ACTIONS
import {
    getKPIs, getRevenueData, getPatientData, getTestTrendData,
    getTestStatusData, getTopTestsData, getTopReferralsData,
    getOutsourceData, getReferralList, getSelfVsReferralData, getSpecificReferralTrendData
} from '@/app/actions/dashboard';

export default async function Page() {
    // 1. Validate Session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        redirect("/login");
    }

    // 2. Compute "Today's" Date boundary instantly on the server
    const today = new Date();
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);
    const fromStr = startOfToday.toISOString();
    const toStr = endOfToday.toISOString();

    // 3. Fetch the Referral Master List first (so we can get the first doctor's trend)
    const referralList = await getReferralList();
    const firstRef = referralList.length > 0 ? referralList[0] : null;

    // 4. 🚨 THE MAGIC: Run all 9 heavy database queries AT THE EXACT SAME TIME
    const [
        kpiData, revenueData, patientData, testTrendData,
        testStatusData, topTestsData, topReferralsData,
        outsourceData, selfVsReferralData, specificReferralData
    ] = await Promise.all([
        getKPIs(fromStr, toStr),
        getRevenueData(fromStr, toStr),
        getPatientData(fromStr, toStr),
        getTestTrendData(fromStr, toStr),
        getTestStatusData(fromStr, toStr),
        getTopTestsData(fromStr, toStr),
        getTopReferralsData(fromStr, toStr),
        getOutsourceData(fromStr, toStr),
        getSelfVsReferralData(fromStr, toStr),
        firstRef ? getSpecificReferralTrendData(fromStr, toStr, firstRef) : Promise.resolve([])
    ]);

    // 5. Bundle it perfectly for the Client Component
    const initialData = {
        kpiData, revenueData, patientData, testTrendData,
        testStatusData, topTestsData, topReferralsData,
        outsourceData, selfVsReferralData, referralList, specificReferralData
    };

    return <DashboardClient initialData={initialData} />;
}