"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server-auth";
import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";

// 1. Fetch the settings when the page loads
export async function getReportSettings(cacheBuster?: string) {
  noStore(); // 🚨 Forces Next.js to skip the cache and hit the database directly!
  
  try {
    const { orgId } = await requireAuth();

    let settings = await prisma.reportSettings.findFirst({
      where: { organizationId: orgId }
    });

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

    // 🚨 Safe Filter: Only save fields that exist in our schema to prevent silent database crashes!
    const validKeys = [
      "doc1Name", "doc1Designation", "doc1SignUrl", "doc2Name", "doc2Designation", "doc2SignUrl",
      "marginTop", "marginBottom", "marginLeft", "marginRight", "marginSettings",
      "tableStyle", "fontFamily", "fontSize", "rowPadding", "labelBold", "dataBold",
      "leftColFields", "rightColFields", "leftColWidth", "rightColWidth", "headerColumnGap", "headerQrCode",
      "showMethodCol", "methodDisplayStyle", "showUnitCol", "showRefRangeCol", "highlightAbnormal", "stripedRows",
      "testColumnWidth", "colWidthParam", "colWidthResult", "colWidthUnit", "colWidthRef", "colWidthMethod",
      "bodyTableStyle", "bodyFontFamily", "bodyFontSize", "bodyRowHeight", "bodyColPadding", "bodyLineHeight",
      "bodyHeaderBgColor", "bodyHeaderTextColor", "bodyResultAlign", "testBlockSpacing",
      "headerFontSize", "headerFontWeight", "headerRowHeight", "headerBorderRadius",
      "showDepartmentName", "showTestName", "departmentNameSize", "testNameAlignment", "testNameUnderline", "testNameSize", "gridLineThickness",
      "subheadingColor", "subheadingSize", "showFlagCol", "colWidthFlag", "flagStyle", "flagColorLow", "flagColorNormal", "flagColorHigh",
      "tableHeaderRepeat", "separatePagesBy", "footerStyle", "sigSize", "sigSpacing", "docNameSize", "docDesigSize", "docNameSpacing", "sigAlignment",
      "showQrCode", "showBarcode", "showPageNumbers", "showEndOfReport", "qrPlacement", "qrText", "barcodeText",
      "letterheadStyle", "paperSize", "printOrientation", "customHeader1", "customHeader2", "customHeader3", "customHeader4", "deltaSettings"
    ];
    
    const safeData: any = {};
    for (const key of validKeys) {
        if (payload[key] !== undefined) {
            safeData[key] = payload[key];
        }
    }

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

    // 🚨 Clear the server cache so the page reload grabs the new data!
    revalidatePath('/reports');
    
    return { success: true, message: "Settings saved successfully!" };
  } catch (error: any) {
    console.error("Save Settings Error:", error);
    return { success: false, message: "Failed to save report settings." };
  }
}