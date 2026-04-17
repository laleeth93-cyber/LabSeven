// --- BLOCK app/components/ExpirationBanner.tsx OPEN ---
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AlertTriangle, Clock } from "lucide-react";

export default async function ExpirationBanner() {
  // 1. Get the current logged-in user
  const session = await getServerSession(authOptions);
  
  // 2. If no one is logged in, or it's the Master HQ (ID 1), hide the banner
  if (!session?.user || (session.user as any).orgId === 1) return null;

  const orgId = (session.user as any).orgId;

  // 3. Fetch the organization's plan and expiration date
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { plan: true, subscriptionEndsAt: true, createdAt: true }
  });

  if (!org) return null;

  // 4. Calculate Expiration Date securely
  // Fallback to 5 days from creation if the date is missing in the database
  const expDate = org.subscriptionEndsAt 
    ? new Date(org.subscriptionEndsAt) 
    : new Date(org.createdAt.getTime() + 5 * 24 * 60 * 60 * 1000);

  const today = new Date();
  
  // Normalize both dates to midnight so we count exact "Days" (not hours/minutes)
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(expDate);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // 5. If it's more than 5 days away, or already expired (they are locked out anyway), hide it
  if (diffDays > 5 || diffDays < 0) return null;

  const isTrial = org.plan === "Free" || org.plan.includes("Trial");

  // 6. Format the countdown text exactly as requested
  let daysText = `in ${diffDays} days`;
  if (diffDays === 1) daysText = `in 1 day`;
  if (diffDays === 0) daysText = `TODAY`;

  return (
    <div className={`w-full px-4 py-2 flex flex-wrap items-center justify-center gap-2.5 text-[13px] font-medium text-white shadow-md relative z-[100] flex-shrink-0 ${isTrial ? 'bg-amber-600' : 'bg-red-500'}`}>
      {isTrial ? <Clock size={16} className="animate-pulse" /> : <AlertTriangle size={16} className="animate-pulse" />}
      
      {isTrial ? (
        <p>
          Your Free Trial is expiring <span className="font-black underline decoration-2 underline-offset-2">{daysText}</span>. Please upgrade your plan.
        </p>
      ) : (
        <p>
          Your {org.plan} Plan is expiring <span className="font-black underline decoration-2 underline-offset-2">{daysText}</span>. Please renew it.
        </p>
      )}
    </div>
  );
}
// --- BLOCK app/components/ExpirationBanner.tsx CLOSE ---