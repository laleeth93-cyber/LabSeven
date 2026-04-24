// --- BLOCK app/list/components/report-pdf/ReportBody.tsx OPEN ---
import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { getPdfFontName, cleanBasicHTML, parseInterpretation } from './reportUtils';

export default function ReportBody({ groupedData, reportSettings, styles, bFontSize, separateDept, separateTest, realData }: any) {
    
    const bodyTableStyle: string = reportSettings?.bodyTableStyle || 'grid';
    
    let bbw = 0.75; 
    if (reportSettings?.gridLineThickness === '1.5') bbw = 0.85;
    else if (reportSettings?.gridLineThickness === '1.75') bbw = 1.0;
    else if (reportSettings?.gridLineThickness === '2.0' || reportSettings?.gridLineThickness === '2') bbw = 1.25;
    else if (reportSettings?.gridLineThickness === '2.25') bbw = 1.5;
    else if (reportSettings?.gridLineThickness === '4') bbw = 2.0;

    const showUnitCol = reportSettings?.showUnitCol !== false;
    const showRefRangeCol = reportSettings?.showRefRangeCol !== false;
    const showMethodCol = reportSettings?.showMethodCol === true;
    const methodDisplay = reportSettings?.methodDisplayStyle || 'column';
    const rawFont = reportSettings?.bodyFontFamily || reportSettings?.fontFamily || '';
    
    const rawHighlightSetting = reportSettings?.highlightAbnormalValues ?? reportSettings?.highlightAbnormal ?? reportSettings?.highlightAbnormalResult;
    const isHighlightEnabled = rawHighlightSetting === true || 
                               String(rawHighlightSetting).toLowerCase() === 'true' || 
                               rawHighlightSetting === 1 || 
                               String(rawHighlightSetting) === '1';

    const isSeparateDeptEnabled = separateDept === true || String(separateDept) === 'true';
    const isSeparateTestEnabled = separateTest === true || String(separateTest) === 'true';

    let totalCols = 2;
    if (showUnitCol) totalCols++;
    if (showRefRangeCol) totalCols++;
    if (showMethodCol && methodDisplay === 'column') totalCols++;

    const pW = parseFloat(reportSettings?.colWidthParam) || 0;
    const rW = parseFloat(reportSettings?.colWidthResult) || 0;
    const uW = showUnitCol ? (parseFloat(reportSettings?.colWidthUnit) || 0) : 0;
    const refW = showRefRangeCol ? (parseFloat(reportSettings?.colWidthRef) || 0) : 0;
    const mW = (showMethodCol && methodDisplay === 'column') ? (parseFloat(reportSettings?.colWidthMethod) || 0) : 0;
    
    const isCustomValid = (pW + rW + uW + refW + mW) === 100;

    const defParam = totalCols === 5 ? '40%' : totalCols === 4 ? '40%' : totalCols === 3 ? '50%' : '70%';
    const defRem = totalCols === 5 ? '15%' : totalCols === 4 ? '20%' : totalCols === 3 ? '25%' : '30%';

    const paramColWidth = isCustomValid ? `${pW}%` : defParam;
    const resultColWidth = isCustomValid ? `${rW}%` : defRem;
    const unitColWidth = isCustomValid ? `${uW}%` : defRem;
    const refColWidth = isCustomValid ? `${refW}%` : defRem;
    const methodColWidth = isCustomValid ? `${mW}%` : defRem;

    const bodyAlign = (reportSettings?.bodyResultAlign || 'text-left').replace('text-', '');

    const dynamicHeaderBgColor = reportSettings?.bodyHeaderBgColor || '#f8fafc';
    const dynamicHeaderTextColor = reportSettings?.bodyHeaderTextColor || '#0f172a';

    const getTableWrapStyle = () => ({ marginTop: 4 });

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
            backgroundColor: dynamicHeaderBgColor,
            borderTopWidth: (bodyTableStyle === 'grid' || bodyTableStyle === 'horizontal' || bodyTableStyle === 'outer') ? bbw : 0,
            borderBottomWidth: (bodyTableStyle === 'grid' || bodyTableStyle === 'horizontal' || bodyTableStyle === 'outer') ? bbw : 0,
        };
    };

    // 🚨 FIX: Added strict padding and content justification to force spacing and stop overlaps
    const getCellBorder = (isLastCol: boolean) => {
        const cellStyle: any = { 
            paddingHorizontal: 6, 
            paddingVertical: 5, 
            justifyContent: 'center',
            overflow: 'hidden'
        };
        if (bodyTableStyle === 'grid') {
            cellStyle.borderRightWidth = isLastCol ? 0 : bbw;
            cellStyle.borderColor = '#000000';
            cellStyle.borderStyle = 'solid';
        }
        return cellStyle;
    };

    const hasData = groupedData.some((g: any) => g.items && g.items.length > 0);
    
    const getGroupDept = (group: any) => {
        const matchedItem = realData?.items?.find((i:any) => i.test?.name === group.testName || i.test?.displayName === group.testName || i.testName === group.testName);
        const raw = matchedItem?.test?.department?.name || 'Pathology';
        return raw.toLowerCase().startsWith('department of') ? raw : `Department of ${raw}`;
    };

    return (
        <React.Fragment>
            {groupedData.map((group: any, gIdx: number) => {
                
                const currentDept = getGroupDept(group);
                const prevDept = gIdx > 0 ? getGroupDept(groupedData[gIdx - 1]) : "";
                
                const isNewDept = gIdx === 0 || currentDept !== prevDept;
                const needsBreak = gIdx > 0 && (isSeparateTestEnabled || (isSeparateDeptEnabled && currentDept !== prevDept));

                return (
                    <React.Fragment key={`group-${gIdx}`}>
                        
                        {needsBreak ? <View break /> : null}

                        <View style={{ marginBottom: 15 }}>
                            
                            {isSeparateDeptEnabled && isNewDept ? (
                                <Text style={styles.deptName}>{currentDept}</Text>
                            ) : null}

                            {group.testName ? (
                                <Text style={[styles.testNameText, { marginBottom: 6 }]}>
                                    {group.testName}
                                </Text>
                            ) : null}

                            <View style={getTableWrapStyle()}>
                                <View style={getHeaderRowStyle()} wrap={false} fixed>
                                    <View style={[{ width: paramColWidth }, getCellBorder(false)]}>
                                        <Text style={[styles.thText, { textAlign: 'left', color: dynamicHeaderTextColor }]}>{"Test\u00A0Parameter"}</Text>
                                    </View>
                                    <View style={[{ width: resultColWidth }, getCellBorder(!showUnitCol && !showRefRangeCol && !(showMethodCol && methodDisplay === 'column'))]}>
                                        <Text style={[styles.thText, { textAlign: bodyAlign as any, color: dynamicHeaderTextColor }]}>Result</Text>
                                    </View>
                                    
                                    {showUnitCol ? (
                                        <View style={[{ width: unitColWidth }, getCellBorder(!showRefRangeCol && !(showMethodCol && methodDisplay === 'column'))]}>
                                            <Text style={[styles.thText, { textAlign: bodyAlign as any, color: dynamicHeaderTextColor }]}>Units</Text>
                                        </View>
                                    ) : null}

                                    {showRefRangeCol ? (
                                        <View style={[{ width: refColWidth }, getCellBorder(!(showMethodCol && methodDisplay === 'column'))]}>
                                            <Text style={[styles.thText, { textAlign: bodyAlign as any, color: dynamicHeaderTextColor }]}>{"Bio.\u00A0Ref.\u00A0Range"}</Text>
                                        </View>
                                    ) : null}

                                    {showMethodCol && methodDisplay === 'column' ? (
                                        <View style={[{ width: methodColWidth }, getCellBorder(true)]}>
                                            <Text style={[styles.thText, { textAlign: bodyAlign as any, color: dynamicHeaderTextColor }]}>Method</Text>
                                        </View>
                                    ) : null}
                                </View>

                                {group.items.map((row: any, idx: number) => {
                                    if (row.isGroup) {
                                        return (
                                            <View key={idx} style={[getRowStyle(), { paddingVertical: 6, paddingHorizontal: 8, backgroundColor: '#ffffff' }]} wrap={false}>
                                                <Text style={styles.subHeadingText}>{row.param}</Text>
                                            </View>
                                        );
                                    }

                                    const isStriped = reportSettings?.stripedRows && idx % 2 !== 0;
                                    
                                    if (row.inputType === 'Big') {
                                        const bigBlocks = parseInterpretation(row.result || '');
                                        return (
                                            <View key={idx} style={[getRowStyle(), { backgroundColor: isStriped ? '#f8fafc' : '#ffffff' }]} wrap={false}>
                                                <View style={[{ width: paramColWidth }, getCellBorder(false)]}>
                                                    <Text style={[styles.tdText, { textAlign: 'left', fontFamily: getPdfFontName(rawFont, false) }]}>{row.param}</Text>
                                                </View>
                                                
                                                <View style={[{ flex: 1, paddingHorizontal: 6, paddingVertical: 5, flexDirection: 'column', justifyContent: 'center' }, getCellBorder(true)]}>
                                                    {bigBlocks.map((block: any, bIdx: number) => {
                                                        if (block.type === 'text') {
                                                            return (
                                                                <Text key={bIdx} style={{ fontFamily: getPdfFontName(rawFont, false), fontSize: bFontSize, color: '#000000', lineHeight: block.lineHeight || 1.4, marginBottom: 2 }}>
                                                                    {block.content}
                                                                </Text>
                                                            );
                                                        } else if (block.type === 'table') {
                                                            return (
                                                                <View key={bIdx} style={{ borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 6, marginTop: 2, borderRadius: 2 }}>
                                                                    {block.rows.map((r: any[], rIdx: number) => {
                                                                        const isHeader = rIdx === 0;
                                                                        return (
                                                                            <View key={rIdx} style={{ flexDirection: 'row', borderBottomWidth: rIdx === block.rows.length - 1 ? 0 : 1, borderColor: '#cbd5e1', backgroundColor: isHeader ? '#e2e8f0' : '#ffffff' }} wrap={false}>
                                                                                {r.map((cell: string, cIdx: number) => (
                                                                                    <View key={cIdx} style={{ flex: 1, padding: 4, borderRightWidth: cIdx === r.length - 1 ? 0 : 1, borderColor: '#cbd5e1', justifyContent: 'center' }}>
                                                                                        <Text style={{ fontFamily: getPdfFontName(rawFont, isHeader), fontSize: bFontSize - 1, color: isHeader ? '#334155' : '#0f172a', textAlign: 'center' }}>
                                                                                            {cell}
                                                                                        </Text>
                                                                                    </View>
                                                                                ))}
                                                                            </View>
                                                                        );
                                                                    })}
                                                                </View>
                                                            );
                                                        }
                                                        return null;
                                                    })}
                                                </View>
                                            </View>
                                        );
                                    }

                                    const rowFlag = row.abnormal ?? row.isAbnormal ?? row.flag;
                                    const isRowAbnormal = rowFlag === true || 
                                                          String(rowFlag).toLowerCase() === 'true' || 
                                                          String(rowFlag).toUpperCase() === 'H' || 
                                                          String(rowFlag).toUpperCase() === 'L' ||
                                                          String(rowFlag).toUpperCase() === 'HIGH' ||
                                                          String(rowFlag).toUpperCase() === 'LOW' ||
                                                          String(rowFlag).toUpperCase() === 'A' ||
                                                          String(rowFlag).toUpperCase() === 'ABNORMAL';
                                                          
                                    const isAbnormal = isHighlightEnabled && isRowAbnormal;

                                    return (
                                        <View key={idx} style={[getRowStyle(), { backgroundColor: isStriped ? '#f8fafc' : '#ffffff' }]} wrap={false}>
                                            <View style={[{ width: paramColWidth }, getCellBorder(false)]}>
                                                <Text style={[styles.tdText, { textAlign: 'left', fontFamily: getPdfFontName(rawFont, false) }]}>{row.param}</Text>
                                                
                                                {showMethodCol && methodDisplay === 'beneath' && row.method ? (
                                                    <Text style={{ fontSize: bFontSize - 2, fontFamily: getPdfFontName(rawFont, false), color: '#475569', paddingTop: 2 }}>Method: {row.method}</Text>
                                                ) : null}
                                            </View>
                                            
                                            <View style={[{ width: resultColWidth }, getCellBorder(!showUnitCol && !showRefRangeCol && !(showMethodCol && methodDisplay === 'column'))]}>
                                                <Text style={[styles.tdText, { 
                                                    textAlign: bodyAlign as any, 
                                                    fontFamily: getPdfFontName(rawFont, isAbnormal),
                                                    fontWeight: isAbnormal ? 'bold' : 'normal'
                                                }]}>
                                                    {row.result}{isAbnormal ? '*' : ''}
                                                </Text>
                                            </View>

                                            {showUnitCol ? (
                                                <View style={[{ width: unitColWidth }, getCellBorder(!showRefRangeCol && !(showMethodCol && methodDisplay === 'column'))]}>
                                                    <Text style={[styles.tdText, { textAlign: bodyAlign as any }]}>
                                                        {row.unit ? String(row.unit).replace(/([/.\-])/g, '$1\u200B') : ''}
                                                    </Text>
                                                </View>
                                            ) : null}

                                            {showRefRangeCol ? (
                                                <View style={[{ width: refColWidth }, getCellBorder(!(showMethodCol && methodDisplay === 'column'))]}>
                                                    <Text style={[styles.tdText, { textAlign: bodyAlign as any }]}>{cleanBasicHTML(row.ref || '')}</Text>
                                                </View>
                                            ) : null}

                                            {showMethodCol && methodDisplay === 'column' ? (
                                                <View style={[{ width: methodColWidth }, getCellBorder(true)]}>
                                                    <Text style={[styles.tdText, { textAlign: bodyAlign as any, fontSize: bFontSize - 1 }]}>{row.method}</Text>
                                                </View>
                                            ) : null}
                                        </View>
                                    );
                                })}
                                
                                {bodyTableStyle === 'outer' && group.items.length > 0 ? (
                                    <View style={{ width: '100%', borderTopWidth: bbw, borderColor: '#000000', borderStyle: 'solid' }} wrap={false} />
                                ) : null}
                            </View>

                            {/* INTERPRETATION BLOCK */}
                            {group.interpretationBlocks && group.interpretationBlocks.length > 0 ? (
                                <View style={{ marginTop: 12, paddingHorizontal: 6 }} wrap={false}>
                                    <Text style={{ fontFamily: getPdfFontName(rawFont, true), fontSize: bFontSize, marginBottom: 6, color: '#0f172a', textDecoration: 'underline' }}>
                                        Interpretation:
                                    </Text>
                                    
                                    {group.interpretationBlocks.map((block: any, bIdx: number) => {
                                        if (block.type === 'text') {
                                            return (
                                                <Text key={bIdx} style={{ fontFamily: getPdfFontName(rawFont, false), fontSize: bFontSize - 1, color: '#334155', lineHeight: block.lineHeight || 1.4, marginBottom: 4 }}>
                                                    {block.content}
                                                </Text>
                                            );
                                        } else if (block.type === 'table') {
                                            return (
                                                <View key={bIdx} style={{ borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 8, marginTop: 4, borderRadius: 2 }}>
                                                    {block.rows.map((row: any[], rIdx: number) => {
                                                        const isHeader = rIdx === 0;
                                                        return (
                                                            <View key={rIdx} style={{ flexDirection: 'row', borderBottomWidth: rIdx === block.rows.length - 1 ? 0 : 1, borderColor: '#cbd5e1', backgroundColor: isHeader ? '#e2e8f0' : '#ffffff' }} wrap={false}>
                                                                {row.map((cell: string, cIdx: number) => (
                                                                    <View key={cIdx} style={{ flex: 1, padding: 4, borderRightWidth: cIdx === row.length - 1 ? 0 : 1, borderColor: '#cbd5e1', justifyContent: 'center' }}>
                                                                        <Text style={{ fontFamily: getPdfFontName(rawFont, isHeader), fontSize: bFontSize - 2, color: isHeader ? '#334155' : '#0f172a', textAlign: 'center' }}>
                                                                            {cell}
                                                                        </Text>
                                                                    </View>
                                                                ))}
                                                            </View>
                                                        );
                                                    })}
                                                </View>
                                            );
                                        }
                                        return null;
                                    })}
                                </View>
                            ) : null}

                            {/* NOTES BLOCK */}
                            {group.noteBlocks && group.noteBlocks.length > 0 ? (
                                <View style={{ marginTop: 8, paddingHorizontal: 6 }} wrap={false}>
                                    <Text style={{ fontFamily: getPdfFontName(rawFont, true), fontSize: bFontSize, marginBottom: 4, color: '#0f172a', textDecoration: 'underline' }}>
                                        Note:
                                    </Text>
                                    
                                    {group.noteBlocks.map((block: any, bIdx: number) => {
                                        if (block.type === 'text') {
                                            return (
                                                <Text key={bIdx} style={{ fontFamily: getPdfFontName(rawFont, false), fontSize: bFontSize - 1, color: '#334155', lineHeight: block.lineHeight || 1.4, marginBottom: 4 }}>
                                                    {block.content}
                                                </Text>
                                            );
                                        } else if (block.type === 'table') {
                                            return (
                                                <View key={bIdx} style={{ borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 8, marginTop: 4, borderRadius: 2 }}>
                                                    {block.rows.map((row: any[], rIdx: number) => {
                                                        const isHeader = rIdx === 0;
                                                        return (
                                                            <View key={rIdx} style={{ flexDirection: 'row', borderBottomWidth: rIdx === block.rows.length - 1 ? 0 : 1, borderColor: '#cbd5e1', backgroundColor: isHeader ? '#e2e8f0' : '#ffffff' }} wrap={false}>
                                                                {row.map((cell: string, cIdx: number) => (
                                                                    <View key={cIdx} style={{ flex: 1, padding: 4, borderRightWidth: cIdx === row.length - 1 ? 0 : 1, borderColor: '#cbd5e1', justifyContent: 'center' }}>
                                                                        <Text style={{ fontFamily: getPdfFontName(rawFont, isHeader), fontSize: bFontSize - 2, color: isHeader ? '#334155' : '#0f172a', textAlign: 'center' }}>
                                                                            {cell}
                                                                        </Text>
                                                                    </View>
                                                                ))}
                                                            </View>
                                                        );
                                                    })}
                                                </View>
                                            );
                                        }
                                        return null;
                                    })}
                                </View>
                            ) : null}

                        </View>
                    </React.Fragment>
                );
            })}

            {reportSettings?.showEndOfReport !== false && hasData ? (
                <Text style={{ textAlign: 'center', marginTop: 15, fontSize: 9, fontFamily: getPdfFontName(rawFont, true), color: '#64748b', textTransform: 'uppercase' }}>
                    *** End of Report ***
                </Text>
            ) : null}
        </React.Fragment>
    );
}
// --- BLOCK app/list/components/report-pdf/ReportBody.tsx CLOSE ---