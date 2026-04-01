// --- BLOCK app/page.tsx OPEN ---
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DashboardClient from "./DashboardClient";

export default async function Page() {
    // 1. Ask NextAuth if there is a valid session
    const session = await getServerSession(authOptions);

    // 2. If there is no user, force them back to the login page
    if (!session || !session.user) {
        redirect("/login");
    }

    // 3. If they have the pass, open the door and show the dashboard!
    return <DashboardClient />;
}
// --- BLOCK app/page.tsx CLOSE ---