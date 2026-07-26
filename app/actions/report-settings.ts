"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server-auth";

// 1. Fetch the settings when the page loads
export async function getReportSettings() {
  try {
    const { orgId } = await requireAuth();

    let settings = await prisma.reportSettings.findFirst({
      where: { organizationId: orgId }
    });

    // If no settings exist for this lab yet, create default ones
    if (!settings) {
      settings = await prisma.reportSettings.create({
        data: { organizationId: orgId }
      });
    }

    return { success: true, data: settings };
  } catch (error: any) {
    console.error("Fetch Settings Error:", error);
    return { success: false, message: "Unauthorized or Failed to load report settings." };
  }
}

// 2. Save the settings permanently
export async function updateReportSettings(payload: any) {
  try {
    const { orgId } = await requireAuth();

    // Prevent ID or OrganizationID from being overwritten
    const { id, organizationId, createdAt, updatedAt, ...safeData } = payload;

    const existingSettings = await prisma.reportSettings.findFirst({
      where: { organizationId: orgId }
    });

    if (existingSettings) {
      await prisma.reportSettings.update({
        where: { id: existingSettings.id },
        data: safeData
      });
    } else {
      await prisma.reportSettings.create({
        data: { ...safeData, organizationId: orgId }
      });
    }

    return { success: true, message: "Settings saved successfully!" };
  } catch (error: any) {
    console.error("Save Settings Error:", error);
    return { success: false, message: "Failed to save report settings." };
  }
}