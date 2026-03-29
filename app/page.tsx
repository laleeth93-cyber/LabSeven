// FILE: app/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import DashboardClient from "./DashboardClient";

export default async function Page() {
    // 1. Create the secure server connection to Supabase
    const supabase = createClient();

    // 2. Ask Supabase if there is a valid "VIP Pass" (logged-in user)
    const { data: { user }, error } = await supabase.auth.getUser();

    // 3. If there is no user, physically force them back to the login page
    if (!user || error) {
        redirect("/login");
    }

    // 4. If they have the pass, open the door and show the dashboard!
    return <DashboardClient />;
}