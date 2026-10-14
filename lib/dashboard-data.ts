import {
  getKPIs,
  getPatientData,
  getRevenueData,
  getSelfVsReferralData,
  getSpecificReferralTrendData,
  getTestStatusData,
  getTestTrendData,
  getTopReferralsData,
  getTopTestsData,
  getOutsourceData,
  getReferralList,
} from '@/app/actions/dashboard';

export async function getDashboardInitialData() {
  const today = new Date();
  const startOfToday = new Date(today);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);
  const fromStr = startOfToday.toISOString();
  const toStr = endOfToday.toISOString();

  const referralList = await getReferralList();
  const firstRef = referralList.length > 0 ? referralList[0] : null;

  const [
    kpiData,
    revenueData,
    patientData,
    testTrendData,
    testStatusData,
    topTestsData,
    topReferralsData,
    outsourceData,
    selfVsReferralData,
    specificReferralData,
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
    firstRef ? getSpecificReferralTrendData(fromStr, toStr, firstRef) : Promise.resolve([]),
  ]);

  return {
    kpiData,
    revenueData,
    patientData,
    testTrendData,
    testStatusData,
    topTestsData,
    topReferralsData,
    outsourceData,
    selfVsReferralData,
    referralList,
    specificReferralData,
  };
}
