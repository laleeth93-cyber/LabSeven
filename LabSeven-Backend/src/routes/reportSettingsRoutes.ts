import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET: Fetch Report Settings
router.get('/', async (req, res) => {
    try {
        const orgId = Number(req.query.orgId);
        if (!orgId) return res.status(400).json({ success: false, message: "Organization ID is required" });

        let settings = await prisma.reportSettings.findFirst({
            where: { organizationId: orgId }
        });
        
        if (!settings) { 
            settings = await prisma.reportSettings.create({ 
                data: { organizationId: orgId }
            }); 
        }
        res.json({ success: true, data: settings });
    } catch (error: any) {
        console.error("Fetch Report Settings Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT: Update Report Settings
router.put('/', async (req, res) => {
    try {
        const { orgId, ...data } = req.body;
        if (!orgId) return res.status(400).json({ success: false, message: "Organization ID is required" });

        const settings = await prisma.reportSettings.findFirst({
            where: { organizationId: orgId }
        });

        // Prisma update logic
        const payload = {
            doc1Name: data.doc1Name, doc1Designation: data.doc1Designation, doc2Name: data.doc2Name, doc2Designation: data.doc2Designation,
            marginTop: parseInt(data.marginTop) || 120, marginBottom: parseInt(data.marginBottom) || 80,
            marginLeft: parseInt(data.marginLeft) || 40, marginRight: parseInt(data.marginRight) || 40,
            marginSettings: data.marginSettings,
            tableStyle: data.tableStyle, fontFamily: data.fontFamily, fontSize: data.fontSize, rowPadding: data.rowPadding, labelBold: data.labelBold, dataBold: data.dataBold,
            leftColFields: data.leftColFields, rightColFields: data.rightColFields, leftColWidth: data.leftColWidth || "35 65", rightColWidth: data.rightColWidth || "35 65", headerQrCode: data.headerQrCode,
            showMethodCol: data.showMethodCol, methodDisplayStyle: data.methodDisplayStyle, showUnitCol: data.showUnitCol, showRefRangeCol: data.showRefRangeCol, highlightAbnormal: data.highlightAbnormal, stripedRows: data.stripedRows,
            bodyTableStyle: data.bodyTableStyle, bodyFontFamily: data.bodyFontFamily, bodyFontSize: data.bodyFontSize, bodyRowHeight: data.bodyRowHeight, bodyColPadding: data.bodyColPadding,
            bodyHeaderBgColor: data.bodyHeaderBgColor, bodyHeaderTextColor: data.bodyHeaderTextColor, bodyResultAlign: data.bodyResultAlign,
            showDepartmentName: data.showDepartmentName, departmentNameSize: data.departmentNameSize, testNameAlignment: data.testNameAlignment, testNameUnderline: data.testNameUnderline, testNameSize: data.testNameSize, gridLineThickness: data.gridLineThickness,
            testColumnWidth: data.testColumnWidth, colWidthParam: data.colWidthParam, colWidthResult: data.colWidthResult, colWidthUnit: data.colWidthUnit, colWidthRef: data.colWidthRef, colWidthMethod: data.colWidthMethod,
            subheadingColor: data.subheadingColor, subheadingSize: data.subheadingSize,
            footerStyle: data.footerStyle, showQrCode: data.showQrCode, showBarcode: data.showBarcode, showPageNumbers: data.showPageNumbers, showEndOfReport: data.showEndOfReport,
            qrPlacement: data.qrPlacement, qrText: data.qrText, barcodeText: data.barcodeText,
            sigSize: parseInt(data.sigSize) || 40, sigSpacing: parseInt(data.sigSpacing) || 4, docNameSize: parseInt(data.docNameSize) || 10, docDesigSize: parseInt(data.docDesigSize) || 8, docNameSpacing: parseInt(data.docNameSpacing) || 2, sigAlignment: data.sigAlignment || 'center',
            letterheadStyle: data.letterheadStyle, paperSize: data.paperSize, printOrientation: data.printOrientation,
            customHeader1: data.customHeader1, customHeader2: data.customHeader2, customHeader3: data.customHeader3, customHeader4: data.customHeader4,
            deltaSettings: data.deltaSettings
        };

        if (settings) {
            await prisma.reportSettings.update({ where: { id: settings.id }, data: payload });
        } else {
            await prisma.reportSettings.create({ data: { ...payload, organizationId: orgId } });
        }
        
        res.json({ success: true, message: "Settings saved successfully!" });
    } catch (error: any) {
        console.error("Update Report Settings Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;