// --- FILE: app/actions/report-settings.ts ---
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// 1. Fetch the settings when the page loads
export async function getReportSettings() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.orgId) return { success: false, message: "Unauthorized" };

  try {
    let settings = await prisma.reportSettings.findFirst({
      where: { organizationId: session.user.orgId }
    });

    // If no settings exist for this lab yet, create default ones
    if (!settings) {
      settings = await prisma.reportSettings.create({
        data: { organizationId: session.user.orgId }
      });
    }

    return { success: true, data: settings };
  } catch (error: any) {
    console.error("Fetch Settings Error:", error);
    return { success: false, message: "Failed to load report settings." };
  }
}

// 2. Save the settings permanently
export async function updateReportSettings(payload: any) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.orgId) return { success: false, message: "Unauthorized" };

  try {
    // Prevent ID or OrganizationID from being overwritten
    const { id, organizationId, createdAt, updatedAt, ...safeData } = payload;

    const existingSettings = await prisma.reportSettings.findFirst({
      where: { organizationId: session.user.orgId }
    });

    if (existingSettings) {
      await prisma.reportSettings.update({
        where: { id: existingSettings.id },
        data: safeData
      });
    } else {
      await prisma.reportSettings.create({
        data: { ...safeData, organizationId: session.user.orgId }
      });
    }

    return { success: true, message: "Settings saved successfully!" };
  } catch (error: any) {
    console.error("Save Settings Error:", error);
    return { success: false, message: "Failed to save report settings." };
  }
}