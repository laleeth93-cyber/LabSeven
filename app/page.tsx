import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DashboardClient from "./DashboardClient";
import { getDashboardInitialData } from "@/lib/dashboard-data";

export default async function Page() {
    // 1. Validate Session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        redirect("/login");
    }

    const initialData = await getDashboardInitialData();
    return <DashboardClient initialData={initialData} />;
}