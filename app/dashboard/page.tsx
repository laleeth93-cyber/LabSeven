import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import DashboardClient from '@/app/DashboardClient';
import { authOptions } from '@/lib/auth';
import { getDashboardInitialData } from '@/lib/dashboard-data';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const initialData = await getDashboardInitialData();
  return <DashboardClient initialData={initialData} />;
}
