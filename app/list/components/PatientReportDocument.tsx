// --- BLOCK app/list/components/PatientReportDocument.tsx OPEN ---
import React from 'react';
import { Document, Page, StyleSheet, Image, View, Text } from '@react-pdf/renderer';
import { parseMargin, getPdfFontName, groupDisplayData } from './report-pdf/reportUtils';
import ReportHeader from './report-pdf/ReportHeader';
import ReportBody from './report-pdf/ReportBody';
import ReportFooter from './report-pdf/ReportFooter';

export default function PatientReportDocument(props: any) {
    const { 
        realData,
        displayData,
        reportSettings,
        barcodeUrl,
        qrDataUrl,
        collectedDate,
        reportedDate,
        activeImageBase64,
        printHeaderFooter,
        letterheadStyle,
        separateDept,
        separateTest 
    } = props;

    const paperSize = reportSettings?.paperSize || 'A4';
    const orientation = reportSettings?.printOrientation || 'portrait';
    const activeStyle = (letterheadStyle && letterheadStyle.startsWith('custom')) ? letterheadStyle : 'custom1';
    
    let parsedMarginSettings: any = null;
    try {
        if (reportSettings?.marginSettings) {
            parsedMarginSettings = typeof reportSettings.marginSettings === 'string' 
                ? JSON.parse(reportSettings.marginSettings) 
                : reportSettings.marginSettings;
        }
    } catch (e) {
        console.error("Error parsing margin settings", e);
    }

    const margins = {
        top: parseMargin(parsedMarginSettings?.[activeStyle]?.top ?? reportSettings?.marginTop, 120),
        bottom: parseMargin(parsedMarginSettings?.[activeStyle]?.bottom ?? reportSettings?.marginBottom, 80),
        left: parseMargin(parsedMarginSettings?.[activeStyle]?.left ?? reportSettings?.marginLeft, 40),
        right: parseMargin(parsedMarginSettings?.[activeStyle]?.right ?? reportSettings?.marginRight, 40)
    };

    const rawFont = reportSettings?.bodyFontFamily || reportSettings?.fontFamily || '';
    const isLabelBold = reportSettings?.labelBold === true || reportSettings?.labelBold === 'true';
    const isDataBold = reportSettings?.dataBold === true || reportSettings?.dataBold === 'true';

    let pdfFontSize = 10; 
    if (reportSettings?.fontSize === 'text-[10px]') pdfFontSize = 9;
    if (reportSettings?.fontSize === 'text-[11px]') pdfFontSize = 10;
    if (reportSettings?.fontSize === 'text-xs') pdfFontSize = 11;
    if (reportSettings?.fontSize === 'text-sm') pdfFontSize = 12;

    let bFontSize = 10;
    if (reportSettings?.bodyFontSize === 'text-[10px]') bFontSize = 9;
    if (reportSettings?.bodyFontSize === 'text-[11px]') bFontSize = 10;
    if (reportSettings?.bodyFontSize === 'text-xs') bFontSize = 11;
    if (reportSettings?.bodyFontSize === 'text-sm') bFontSize = 12;

    let testNameFontSize = 12;
    if (reportSettings?.testNameSize === 'text-sm') testNameFontSize = 11;
    if (reportSettings?.testNameSize === 'text-base') testNameFontSize = 12;
    if (reportSettings?.testNameSize === 'text-lg') testNameFontSize = 14;
    if (reportSettings?.testNameSize === 'text-xl') testNameFontSize = 16;

    const styles = StyleSheet.create({
        page: { 
            backgroundColor: '#ffffff',
            paddingTop: margins.top, 
            paddingBottom: margins.bottom + 90, 
            paddingLeft: margins.left, 
            paddingRight: margins.right,
            position: 'relative',
        },
        letterheadBackground: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 },
        labelText: { fontSize: pdfFontSize, color: '#475569', fontFamily: getPdfFontName(rawFont, isLabelBold) },
        colonText: { fontSize: pdfFontSize, color: '#475569', fontFamily: getPdfFontName(rawFont, isLabelBold) },
        valText: { fontSize: pdfFontSize, color: '#0f172a', fontFamily: getPdfFontName(rawFont, isDataBold) },
        
        thText: { fontSize: bFontSize, fontFamily: getPdfFontName(rawFont, true), color: reportSettings?.bodyHeaderTextColor || '#000000', paddingVertical: 6, paddingHorizontal: 6 },
        tdText: { fontSize: bFontSize, fontFamily: getPdfFontName(rawFont, false), color: '#000000', paddingVertical: 5, paddingHorizontal: 6 },
        deptName: { fontSize: 13, fontFamily: getPdfFontName(rawFont, true), textAlign: 'center', textTransform: 'uppercase', marginBottom: 6, marginTop: 15, color: '#475569' },
        
        testNameText: { 
            fontSize: testNameFontSize, 
            fontFamily: getPdfFontName(rawFont, true), 
            color: '#0f172a', 
            textAlign: (reportSettings?.testNameAlignment || 'text-left').replace('text-', '') as any, 
            textDecoration: reportSettings?.testNameUnderline ? 'underline' : 'none' 
        },
        
        subHeadingText: { fontSize: bFontSize, fontFamily: getPdfFontName(rawFont, true), color: reportSettings?.subheadingColor || '#334155' },

        footer: { position: 'absolute', bottom: margins.bottom, left: margins.left, right: margins.right, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
        
        signatureBlock: { alignItems: 'center', justifyContent: 'flex-end', width: 120 },
        signatureLine: { height: 40, borderBottomWidth: 1, borderBottomColor: '#000000', width: '100%', marginBottom: 4 },
        docName: { fontSize: 10, fontFamily: getPdfFontName(rawFont, true), color: '#0f172a' },
        docDesig: { fontSize: 8, color: '#475569', marginTop: 2, fontFamily: getPdfFontName(rawFont, false) },
        qrBlock: { alignItems: 'center', justifyContent: 'flex-end', width: 64 },
        qrText: { fontSize: 7, fontFamily: getPdfFontName(rawFont, true), color: '#64748b', marginBottom: 2, textTransform: 'uppercase', textAlign: 'center' },
        barcodeBlock: { alignItems: 'center', justifyContent: 'flex-end' },
        pageNumberBlock: { justifyContent: 'flex-end', paddingBottom: 4 },
        pageNumber: { fontSize: 10, fontFamily: getPdfFontName(rawFont, true), color: '#64748b' },

        // Empty State Styles
        emptyStateContainer: {
            marginTop: 60,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            backgroundColor: '#f8fafc',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#e2e8f0',
            borderStyle: 'dashed'
        },
        emptyStateTitle: {
            fontSize: 14,
            fontFamily: getPdfFontName(rawFont, true),
            color: '#475569',
            marginBottom: 8
        },
        emptyStateSub: {
            fontSize: 10,
            fontFamily: getPdfFontName(rawFont, false),
            color: '#64748b',
            textAlign: 'center',
            lineHeight: 1.4
        }
    });

    const groupedData = groupDisplayData(displayData, realData);
    const hasData = displayData && displayData.length > 0;

    return (
        <Document>
            <Page size={paperSize as any} orientation={orientation as any} style={styles.page}>
                
                {printHeaderFooter && activeImageBase64 && (
                    <Image src={activeImageBase64} style={styles.letterheadBackground} fixed />
                )}

                <ReportHeader 
                    reportSettings={reportSettings}
                    realData={realData}
                    collectedDate={collectedDate}
                    reportedDate={reportedDate}
                    styles={styles}
                />

                {/* FIX: If there are no printable routine tests, show a clear message instead of a blank table */}
                {hasData ? (
                    <ReportBody 
                        groupedData={groupedData}
                        reportSettings={reportSettings}
                        styles={styles}
                        bFontSize={bFontSize}
                        separateDept={separateDept}
                        separateTest={separateTest}
                        realData={realData}
                    />
                ) : (
                    <View style={styles.emptyStateContainer}>
                        <Text style={styles.emptyStateTitle}>No Routine Results Available</Text>
                        <Text style={styles.emptyStateSub}>
                            The tests in this bill are either pending result entry, {"\n"}
                            or belong to specialized reports (like Culture & Susceptibility). {"\n"}
                            Please use the specific report buttons or complete result entry to view them.
                        </Text>
                    </View>
                )}

                <ReportFooter 
                    reportSettings={reportSettings}
                    realData={realData}
                    qrDataUrl={qrDataUrl}
                    barcodeUrl={barcodeUrl}
                    styles={styles}
                />

            </Page>
        </Document>
    );
}
// --- BLOCK app/list/components/PatientReportDocument.tsx CLOSE ---