import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "./api/auth/[...nextauth]/route";
import DashboardClient from "./DashboardClient";

export default async function Page() {
    // 🚨 GUARANTEED FAILSAFE: Server checks the login key
    const session = await getServerSession(authOptions);

    // If there is no key, physically force them to the login page
    if (!session) {
        redirect("/login");
    }

    // If they have the key, open the door and show the dashboard!
    return <DashboardClient />;
}