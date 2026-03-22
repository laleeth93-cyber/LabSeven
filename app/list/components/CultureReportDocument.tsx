// --- BLOCK app/list/components/CultureReportDocument.tsx OPEN ---
import React from 'react';
import { Document, Page, StyleSheet, Image, View, Text } from '@react-pdf/renderer';
import { parseMargin, getPdfFontName } from './report-pdf/reportUtils';
import ReportHeader from './report-pdf/ReportHeader';
import ReportFooter from './report-pdf/ReportFooter';

export default function CultureReportDocument(props: any) {
    const { 
        realData,
        reportSettings,
        barcodeUrl,
        qrDataUrl,
        collectedDate,
        reportedDate,
        activeImageBase64,
        printHeaderFooter,
        letterheadStyle,
        cultureItems
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

    let bbw = 0.75; 
    if (reportSettings?.gridLineThickness === '1.5') bbw = 0.85;
    else if (reportSettings?.gridLineThickness === '1.75') bbw = 1.0;
    else if (reportSettings?.gridLineThickness === '2.0' || reportSettings?.gridLineThickness === '2') bbw = 1.25;
    else if (reportSettings?.gridLineThickness === '2.25') bbw = 1.5;
    else if (reportSettings?.gridLineThickness === '4') bbw = 2.0;

    const bodyTableStyle: string = reportSettings?.bodyTableStyle || 'grid';
    
    const getTableWrapStyle = () => ({ marginTop: 4, borderColor: '#000000', borderStyle: 'solid', flexDirection: 'column' });

    const getRowStyle = () => {
        const base: any = { flexDirection: 'row', borderColor: '#000000', borderStyle: 'solid' };
        if (bodyTableStyle === 'grid') return { ...base, borderLeftWidth: bbw, borderRightWidth: bbw, borderBottomWidth: bbw };
        if (bodyTableStyle === 'horizontal') return { ...base, borderBottomWidth: bbw };
        if (bodyTableStyle === 'outer') return { ...base, borderLeftWidth: bbw, borderRightWidth: bbw };
        return base;
    };

    const getHeaderRowStyle = () => {
        const base = getRowStyle();
        return {
            ...base,
            backgroundColor: reportSettings?.bodyHeaderBgColor?.replace('bg-', '#') || '#f8fafc',
            borderTopWidth: (bodyTableStyle === 'grid' || bodyTableStyle === 'horizontal' || bodyTableStyle === 'outer') ? bbw : 0,
            borderBottomWidth: (bodyTableStyle === 'grid' || bodyTableStyle === 'horizontal' || bodyTableStyle === 'outer') ? bbw : 0,
        };
    };

    const getCellBorder = (isLastCol: boolean) => {
        if (bodyTableStyle === 'grid') return isLastCol ? {} : { borderRightWidth: bbw, borderColor: '#000000', borderStyle: 'solid' as any };
        return {};
    };

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

        testNameText: { 
            fontSize: testNameFontSize, 
            fontFamily: getPdfFontName(rawFont, true), 
            color: '#0f172a', 
            textAlign: (reportSettings?.testNameAlignment || 'text-left').replace('text-', '') as any, 
            textDecoration: reportSettings?.testNameUnderline ? 'underline' : 'none',
            marginBottom: 15,
            marginTop: 15
        },
        
        paramRow: { flexDirection: 'row', marginBottom: 6, paddingHorizontal: 4 },
        paramLabel: { width: '35%', fontSize: bFontSize, fontFamily: getPdfFontName(rawFont, isLabelBold), color: '#475569' },
        paramColon: { width: '5%', fontSize: bFontSize, fontFamily: getPdfFontName(rawFont, isLabelBold), color: '#475569' },
        paramValue: { width: '60%', fontSize: bFontSize, fontFamily: getPdfFontName(rawFont, isDataBold), color: '#0f172a' },
        headingRow: { fontSize: bFontSize + 1, fontFamily: getPdfFontName(rawFont, true), color: reportSettings?.subheadingColor || '#334155', marginTop: 10, marginBottom: 6, paddingHorizontal: 4, textDecoration: 'underline' },

        organismBox: { backgroundColor: '#e2e8f0', paddingVertical: 6, paddingHorizontal: 8, marginBottom: 6 },
        organismTitle: { fontSize: bFontSize + 1, fontFamily: getPdfFontName(rawFont, true), color: '#0f172a' },
        
        thText: { fontSize: bFontSize, fontFamily: getPdfFontName(rawFont, true), color: reportSettings?.bodyHeaderTextColor || '#000000', paddingVertical: 6, paddingHorizontal: 6 },
        tdText: { fontSize: bFontSize, fontFamily: getPdfFontName(rawFont, false), color: '#000000', paddingVertical: 5, paddingHorizontal: 6 },
        tdTextBold: { fontSize: bFontSize, fontFamily: getPdfFontName(rawFont, true), color: '#000000', paddingVertical: 5, paddingHorizontal: 6 },
        
        emptyStateText: { fontSize: bFontSize, fontFamily: getPdfFontName(rawFont, false), color: '#64748B', fontStyle: 'italic', textAlign: 'center', marginTop: 10 }
    });

    const getColumnWidth = (colName: string, columns: string[]) => {
        if (!columns || columns.length === 0) return '50%';
        if (colName === 'Antibiotic') return `${100 - (columns.length * 15)}%`;
        return '15%';
    };

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
                    styles={styles as any}
                />

                <View style={{ marginTop: 5 }}>
                    {(cultureItems || []).map((item: any, itemIndex: number) => {
                        
                        let cultureData: any = null;
                        let displayColumns = ['Result', 'Interpretation', 'MIC']; 

                        if (item.test?.cultureColumns) {
                            try { 
                                if (typeof item.test.cultureColumns === 'string') displayColumns = JSON.parse(item.test.cultureColumns); 
                                else displayColumns = item.test.cultureColumns;
                            } catch(e) { displayColumns = item.test.cultureColumns.split(','); }
                        }

                        if (item.results && Array.isArray(item.results)) {
                            const cultureResult = item.results.find((r: any) => r.parameterId === null || r.isCultureResult === true || (r.resultValue && r.resultValue.includes('organisms')));
                            if (cultureResult && cultureResult.resultValue) {
                                try { cultureData = JSON.parse(cultureResult.resultValue); } catch(e){}
                            }
                        }

                        // --- 1. Culture Block Logic Extracted cleanly ---
                        const cultureBlockJSX = (
                            <View style={{ width: '100%', marginTop: 8, marginBottom: 8 }}>
                                {(!cultureData || !cultureData.organisms || cultureData.organisms.length === 0) ? (
                                    <View style={{ padding: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 4 }}>
                                        <Text style={styles.emptyStateText}>Result entry pending or no organisms isolated.</Text>
                                    </View>
                                ) : (
                                    (cultureData.organisms || []).map((org: any, orgIndex: number) => {
                                        const filledAntibiotics = (org.antibioticResults || []).filter((anti: any) => {
                                            return (anti.result && anti.result.trim() !== '') ||
                                                   (anti.value && anti.value.trim() !== '') ||
                                                   (anti.interpretation && anti.interpretation.trim() !== '') ||
                                                   (anti.breakPoint && anti.breakPoint.trim() !== '') ||
                                                   (anti.mic && anti.mic.trim() !== '');
                                        });

                                        return (
                                            <View key={orgIndex} wrap={false} style={{ marginBottom: 15 }}>
                                                <View style={styles.organismBox}>
                                                    <Text style={styles.organismTitle}>Isolate {orgIndex + 1}: {org.name || 'Unknown Organism'}</Text>
                                                </View>
                                                
                                                {filledAntibiotics.length === 0 ? (
                                                    <View style={{ padding: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 4 }}>
                                                        <Text style={styles.emptyStateText}>
                                                            No antibiotic sensitivities reported for this isolate.
                                                        </Text>
                                                    </View>
                                                ) : (
                                                    <View style={getTableWrapStyle() as any}>
                                                        <View style={getHeaderRowStyle() as any} wrap={false} fixed>
                                                            <View style={[{ width: getColumnWidth('Antibiotic', displayColumns) }, getCellBorder(displayColumns.length === 0)]}>
                                                                <Text style={[styles.thText, { textAlign: 'left' }]}>Antibiotic Name</Text>
                                                            </View>
                                                            {displayColumns.includes('Result') && (
                                                                <View style={[{ width: '15%' }, getCellBorder(displayColumns[displayColumns.length-1] === 'Result')]}>
                                                                    <Text style={[styles.thText, { textAlign: 'center' }]}>Result</Text>
                                                                </View>
                                                            )}
                                                            {displayColumns.includes('Value') && (
                                                                <View style={[{ width: '15%' }, getCellBorder(displayColumns[displayColumns.length-1] === 'Value')]}>
                                                                    <Text style={[styles.thText, { textAlign: 'center' }]}>Value</Text>
                                                                </View>
                                                            )}
                                                            {displayColumns.includes('Interpretation') && (
                                                                <View style={[{ width: '15%' }, getCellBorder(displayColumns[displayColumns.length-1] === 'Interpretation')]}>
                                                                    <Text style={[styles.thText, { textAlign: 'center' }]}>Interpretation</Text>
                                                                </View>
                                                            )}
                                                            {displayColumns.includes('BreakPoint') && (
                                                                <View style={[{ width: '15%' }, getCellBorder(displayColumns[displayColumns.length-1] === 'BreakPoint')]}>
                                                                    <Text style={[styles.thText, { textAlign: 'center' }]}>BreakPoint</Text>
                                                                </View>
                                                            )}
                                                            {displayColumns.includes('MIC') && (
                                                                <View style={[{ width: '15%' }, getCellBorder(displayColumns[displayColumns.length-1] === 'MIC')]}>
                                                                    <Text style={[styles.thText, { textAlign: 'center' }]}>MIC</Text>
                                                                </View>
                                                            )}
                                                        </View>

                                                        {filledAntibiotics.map((anti: any, aIndex: number) => {
                                                            const isStriped = reportSettings?.stripedRows && aIndex % 2 !== 0;
                                                            return (
                                                                <View key={aIndex} style={[getRowStyle(), { backgroundColor: isStriped ? '#f8fafc' : '#ffffff' }]} wrap={false}>
                                                                    <View style={[{ width: getColumnWidth('Antibiotic', displayColumns) }, getCellBorder(displayColumns.length === 0)]}>
                                                                        <Text style={[styles.tdTextBold, { textAlign: 'left' }]}>{anti.name || '-'}</Text>
                                                                    </View>
                                                                    {displayColumns.includes('Result') && (
                                                                        <View style={[{ width: '15%' }, getCellBorder(displayColumns[displayColumns.length-1] === 'Result')]}>
                                                                            <Text style={[styles.tdText, { textAlign: 'center' }]}>{anti.result || '-'}</Text>
                                                                        </View>
                                                                    )}
                                                                    {displayColumns.includes('Value') && (
                                                                        <View style={[{ width: '15%' }, getCellBorder(displayColumns[displayColumns.length-1] === 'Value')]}>
                                                                            <Text style={[styles.tdText, { textAlign: 'center' }]}>{anti.value || '-'}</Text>
                                                                        </View>
                                                                    )}
                                                                    {displayColumns.includes('Interpretation') && (
                                                                        <View style={[{ width: '15%' }, getCellBorder(displayColumns[displayColumns.length-1] === 'Interpretation')]}>
                                                                            <Text style={[styles.tdText, { textAlign: 'center' }]}>{anti.interpretation || '-'}</Text>
                                                                        </View>
                                                                    )}
                                                                    {displayColumns.includes('BreakPoint') && (
                                                                        <View style={[{ width: '15%' }, getCellBorder(displayColumns[displayColumns.length-1] === 'BreakPoint')]}>
                                                                            <Text style={[styles.tdText, { textAlign: 'center' }]}>{anti.breakPoint || '-'}</Text>
                                                                        </View>
                                                                    )}
                                                                    {displayColumns.includes('MIC') && (
                                                                        <View style={[{ width: '15%' }, getCellBorder(displayColumns[displayColumns.length-1] === 'MIC')]}>
                                                                            <Text style={[styles.tdText, { textAlign: 'center' }]}>{anti.mic || '-'}</Text>
                                                                        </View>
                                                                    )}
                                                                </View>
                                                            );
                                                        })}
                                                        
                                                        {bodyTableStyle === 'outer' && filledAntibiotics.length > 0 && (
                                                            <View style={{ width: '100%', borderTopWidth: bbw, borderColor: '#000000', borderStyle: 'solid' }} wrap={false} />
                                                        )}
                                                    </View>
                                                )}
                                            </View>
                                        );
                                    })
                                )}
                            </View>
                        );

                        // --- 2. Main Iteration (Mapping Parameters in exact sequence) ---
                        const hasParameters = item.test?.parameters && item.test.parameters.length > 0;
                        const hasCultureField = item.test?.parameters?.some((tp: any) => tp.isCultureField);

                        return (
                            <View key={itemIndex} style={{ marginBottom: 20 }}>
                                <Text style={styles.testNameText}>{item.test?.name || 'Culture Test'}</Text>
                                
                                {hasParameters && (
                                    item.test.parameters.map((tp: any, tpIndex: number) => {
                                        
                                        if (tp.isHeading) {
                                            return <Text key={tpIndex} style={styles.headingRow}>{tp.headingText}</Text>;
                                        }
                                        
                                        if (tp.isCultureField) {
                                            return <View key={tpIndex}>{cultureBlockJSX}</View>;
                                        }
                                        
                                        if (tp.parameter) {
                                            const pRes = (item.results || []).find((r: any) => r.parameterId === tp.parameter.id);
                                            const pVal = pRes ? (pRes.resultValue ?? pRes.value ?? pRes.result ?? '') : '';
                                            
                                            if (pVal === null || pVal === undefined || String(pVal).trim() === '') return null;
                                            
                                            return (
                                                <View key={tpIndex} style={styles.paramRow} wrap={false}>
                                                    <Text style={styles.paramLabel}>{tp.parameter.name}</Text>
                                                    <Text style={styles.paramColon}>:</Text>
                                                    <Text style={styles.paramValue}>{pVal}</Text>
                                                </View>
                                            );
                                        }
                                        return null;
                                    })
                                )}

                                {(!hasParameters || !hasCultureField) && cultureBlockJSX}
                            </View>
                        );
                    })}
                </View>

                {reportSettings?.showEndOfReport !== false && cultureItems && cultureItems.length > 0 && (
                    <Text style={{ textAlign: 'center', marginTop: 15, fontSize: 9, fontFamily: getPdfFontName(rawFont, true), color: '#64748b', textTransform: 'uppercase' }}>
                        *** End of Report ***
                    </Text>
                )}

                <ReportFooter 
                    reportSettings={reportSettings}
                    realData={realData}
                    qrDataUrl={qrDataUrl}
                    barcodeUrl={barcodeUrl}
                    styles={styles as any}
                />

            </Page>
        </Document>
    );
}
// --- BLOCK app/list/components/CultureReportDocument.tsx CLOSE ---