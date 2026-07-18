import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { getPdfFontName, cleanBasicHTML, parseInterpretation } from './reportUtils';

const parsePadding = (val: string, defaultVal: number) => {
    if (val === 'py-0') return 0;
    if (val === 'py-px') return 1;
    if (val === 'py-0.5') return 2;
    if (val === 'py-1') return 4;
    if (val === 'py-1.5') return 6;
    if (val === 'py-2') return 8;
    if (val === 'py-2.5') return 10;
    if (val === 'py-3') return 12;
    return defaultVal;
};

// ✨ NEW: Parses Horizontal padding specifically
const parsePxPadding = (val: string, defaultVal: number) => {
    if (val === 'px-0') return 0;
    if (val === 'px-px') return 1;
    if (val === 'px-0.5') return 2;
    if (val === 'px-1') return 4;
    if (val === 'px-1.5') return 6;
    if (val === 'px-2') return 8;
    if (val === 'px-2.5') return 10;
    if (val === 'px-3') return 12;
    return defaultVal;
};

export default function ReportBody({ groupedData, reportSettings, styles, bFontSize, separateDept, separateTest, realData }: any) {
    
    const getFlagProps = (flag: any) => {
        const f = String(flag || '').toUpperCase().trim();
        const isLow = f === 'L' || f === 'LOW';
        const isHigh = f === 'H' || f === 'HIGH' || f === 'A' || f === 'ABNORMAL' || f === '*';
        const isNormal = !isLow && !isHigh;

        let text = '';
        const style = reportSettings?.flagStyle || 'lh';
        if (style === 'arrows') text = isLow ? '↓' : isHigh ? '↑' : '';
        else if (style === 'lh') text = isLow ? 'L' : isHigh ? 'H' : '';
        else if (style === 'star') text = (isLow || isHigh) ? '*' : '';
        else if (style === 'text') text = isLow ? 'Low' : isHigh ? 'High' : 'Normal';
        else text = isLow ? 'L' : isHigh ? 'H' : ''; 

        if (isNormal && style !== 'text') text = ''; 
        const color = isLow ? (reportSettings?.flagColorLow || '#3b82f6') : isHigh ? (reportSettings?.flagColorHigh || '#ef4444') : (reportSettings?.flagColorNormal || '#000000');
        return { text, color };
    }

    const bodyTableStyle: string = reportSettings?.bodyTableStyle || 'grid';
    const tableHeaderRepeat = reportSettings?.tableHeaderRepeat || 'test';
    
    const isSeparateDeptEnabled = separateDept === true || String(separateDept) === 'true' || reportSettings?.separatePagesBy === 'department';
    const isSeparateTestEnabled = separateTest === true || String(separateTest) === 'true' || reportSettings?.separatePagesBy === 'test';

    let bbw = 0.75; 
    if (reportSettings?.gridLineThickness === '1.5') bbw = 0.85;
    else if (reportSettings?.gridLineThickness === '1.75') bbw = 1.0;
    else if (reportSettings?.gridLineThickness === '2.0' || reportSettings?.gridLineThickness === '2') bbw = 1.25;
    else if (reportSettings?.gridLineThickness === '2.25') bbw = 1.5;
    else if (reportSettings?.gridLineThickness === '4') bbw = 2.0;

    const showUnitCol = reportSettings?.showUnitCol !== false;
    const showRefRangeCol = reportSettings?.showRefRangeCol !== false;
    const showMethodCol = reportSettings?.showMethodCol === true;
    const showFlagCol = reportSettings?.showFlagCol !== false;
    const showDeptName = reportSettings?.showDepartmentName !== false;

    const methodDisplay = reportSettings?.methodDisplayStyle || 'column';
    const rawFont = reportSettings?.bodyFontFamily || reportSettings?.fontFamily || '';
    
    const rawHighlightSetting = reportSettings?.highlightAbnormalValues ?? reportSettings?.highlightAbnormal ?? reportSettings?.highlightAbnormalResult;
    const isHighlightEnabled = rawHighlightSetting === true || String(rawHighlightSetting).toLowerCase() === 'true' || rawHighlightSetting === 1 || String(rawHighlightSetting) === '1';

    // ✨ Calculates the dynamic Vertical (Py) and Horizontal (Px) Text Padding
    const headerPy = parsePadding(reportSettings?.headerRowHeight, 6);
    const bodyPy = parsePadding(reportSettings?.bodyRowHeight, 6);
    const bodyPx = parsePxPadding(reportSettings?.bodyColPadding, 6);
    
    // ✨ Extracts Dynamic Line Height
    const bLineHeight = parseFloat(reportSettings?.bodyLineHeight || '1.5');

    let totalCols = 2;
    if (showFlagCol) totalCols++;
    if (showUnitCol) totalCols++;
    if (showRefRangeCol) totalCols++;
    if (showMethodCol && methodDisplay === 'column') totalCols++;

    const pW = parseFloat(reportSettings?.colWidthParam) || 0;
    const rW = parseFloat(reportSettings?.colWidthResult) || 0;
    const fW = showFlagCol ? (parseFloat(reportSettings?.colWidthFlag) || 0) : 0; 
    const uW = showUnitCol ? (parseFloat(reportSettings?.colWidthUnit) || 0) : 0;
    const refW = showRefRangeCol ? (parseFloat(reportSettings?.colWidthRef) || 0) : 0;
    const mW = (showMethodCol && methodDisplay === 'column') ? (parseFloat(reportSettings?.colWidthMethod) || 0) : 0;
    
    const isCustomValid = (pW + rW + fW + uW + refW + mW) === 100;

    const paramColWidth = isCustomValid ? `${pW}%` : (showFlagCol ? '33%' : '40%');
    const resultColWidth = isCustomValid ? `${rW}%` : '15%';
    const flagColWidth = isCustomValid ? `${fW}%` : '7%';
    const unitColWidth = isCustomValid ? `${uW}%` : '18%';
    const refColWidth = isCustomValid ? `${refW}%` : '27%';
    const methodColWidth = isCustomValid ? `${mW}%` : '15%';

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

    const getCellBorder = (isLastCol: boolean, isHeader: boolean = false) => {
        const cellStyle: any = { 
            paddingHorizontal: bodyPx, // ✨ Applies Dynamic Text-to-Border Width Padding
            paddingVertical: isHeader ? headerPy : bodyPy, 
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
        return matchedItem?.test?.department?.name || ''; 
    };

    return (
        <React.Fragment>
            {groupedData.map((group: any, gIdx: number) => {
                
                const currentDept = getGroupDept(group);
                const prevDept = gIdx > 0 ? getGroupDept(groupedData[gIdx - 1]) : "";
                
                const isNewDept = gIdx === 0 || currentDept !== prevDept;
                const needsBreak = gIdx > 0 && (isSeparateTestEnabled || (isSeparateDeptEnabled && currentDept !== prevDept));

                const showTableHeader = tableHeaderRepeat === 'test' || 
                                        (tableHeaderRepeat === 'department' && isNewDept) || 
                                        (tableHeaderRepeat === 'report' && gIdx === 0);

                return (
                    <React.Fragment key={`group-${gIdx}`}>
                        
                        {needsBreak ? <View break /> : null}

                        <View style={{ marginBottom: 15 }}>
                            
                            {showDeptName && isNewDept && currentDept ? (
                                <Text style={[
                                    styles.deptName || {}, 
                                    { 
                                        fontFamily: getPdfFontName(rawFont, true), 
                                        fontSize: bFontSize + 2, 
                                        textAlign: 'center', 
                                        marginBottom: 10, 
                                        color: '#475569', 
                                        textTransform: 'uppercase' 
                                    }
                                ]}>
                                    {currentDept}
                                </Text>
                            ) : null}

                            {reportSettings?.showTestName !== false && group.testName ? (
                                <Text style={[styles.testNameText, { marginBottom: 6 }]}>
                                    {group.testName}
                                </Text>
                            ) : null}

                            <View style={getTableWrapStyle()}>
                                
                                {showTableHeader && (
                                    <View style={getHeaderRowStyle()} wrap={false} fixed>
                                        <View style={[{ width: paramColWidth }, getCellBorder(false, true)]}>
                                            <Text style={[styles.thText, { textAlign: 'left', color: dynamicHeaderTextColor, lineHeight: bLineHeight }]}>{"Test\u00A0Parameter"}</Text>
                                        </View>
                                        <View style={[{ width: resultColWidth }, getCellBorder(!showFlagCol && !showUnitCol && !showRefRangeCol && !(showMethodCol && methodDisplay === 'column'), true)]}>
                                            <Text style={[styles.thText, { textAlign: bodyAlign as any, color: dynamicHeaderTextColor, lineHeight: bLineHeight }]}>Result</Text>
                                        </View>
                                        
                                        {showFlagCol ? (
                                            <View style={[{ width: flagColWidth }, getCellBorder(!showUnitCol && !showRefRangeCol && !(showMethodCol && methodDisplay === 'column'), true)]}>
                                                <Text style={[styles.thText, { textAlign: 'center', color: dynamicHeaderTextColor, lineHeight: bLineHeight }]}>Flag</Text>
                                            </View>
                                        ) : null}

                                        {showUnitCol ? (
                                            <View style={[{ width: unitColWidth }, getCellBorder(!showRefRangeCol && !(showMethodCol && methodDisplay === 'column'), true)]}>
                                                <Text style={[styles.thText, { textAlign: bodyAlign as any, color: dynamicHeaderTextColor, lineHeight: bLineHeight }]}>Units</Text>
                                            </View>
                                        ) : null}

                                        {showRefRangeCol ? (
                                            <View style={[{ width: refColWidth }, getCellBorder(!(showMethodCol && methodDisplay === 'column'), true)]}>
                                                <Text style={[styles.thText, { textAlign: bodyAlign as any, color: dynamicHeaderTextColor, lineHeight: bLineHeight }]}>{"Bio.\u00A0Ref.\u00A0Range"}</Text>
                                            </View>
                                        ) : null}

                                        {showMethodCol && methodDisplay === 'column' ? (
                                            <View style={[{ width: methodColWidth }, getCellBorder(true, true)]}>
                                                <Text style={[styles.thText, { textAlign: bodyAlign as any, color: dynamicHeaderTextColor, lineHeight: bLineHeight }]}>Method</Text>
                                            </View>
                                        ) : null}
                                    </View>
                                )}

                                {group.items.map((row: any, idx: number) => {
                                    if (row.isGroup) {
                                        return (
                                            <View key={idx} style={[getRowStyle(), { paddingVertical: bodyPy, paddingHorizontal: bodyPx, backgroundColor: '#ffffff' }]} wrap={false}>
                                                <Text style={[styles.subHeadingText, { lineHeight: bLineHeight }]}>{row.param}</Text>
                                            </View>
                                        );
                                    }

                                    const isStriped = reportSettings?.stripedRows && idx % 2 !== 0;
                                    
                                    if (row.inputType === 'Big') {
                                        const bigBlocks = parseInterpretation(row.result || '');
                                        return (
                                            <View key={idx} style={[getRowStyle(), { backgroundColor: isStriped ? '#f8fafc' : '#ffffff' }]} wrap={false}>
                                                <View style={[{ width: paramColWidth }, getCellBorder(false)]}>
                                                    <Text style={[styles.tdText, { textAlign: 'left', fontFamily: getPdfFontName(rawFont, false), lineHeight: bLineHeight }]}>{row.param}</Text>
                                                </View>
                                                
                                                <View style={[{ flex: 1, flexDirection: 'column', justifyContent: 'center' }, getCellBorder(true)]}>
                                                    {bigBlocks.map((block: any, bIdx: number) => {
                                                        if (block.type === 'text') {
                                                            return (
                                                                <Text key={bIdx} style={{ fontFamily: getPdfFontName(rawFont, false), fontSize: bFontSize, color: '#000000', lineHeight: bLineHeight, marginBottom: 2 }}>
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
                                                                                        <Text style={{ fontFamily: getPdfFontName(rawFont, isHeader), fontSize: bFontSize - 1, color: isHeader ? '#334155' : '#0f172a', textAlign: 'center', lineHeight: bLineHeight }}>
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

                                    const flagProps = getFlagProps(row.flag);
                                    const isAbnormal = isHighlightEnabled && (flagProps.text !== '' && flagProps.text !== 'Normal');

                                    return (
                                        <View key={idx} style={[getRowStyle(), { backgroundColor: isStriped ? '#f8fafc' : '#ffffff' }]} wrap={false}>
                                            <View style={[{ width: paramColWidth }, getCellBorder(false)]}>
                                                <Text style={[styles.tdText, { textAlign: 'left', fontFamily: getPdfFontName(rawFont, false), lineHeight: bLineHeight }]}>{row.param}</Text>
                                                
                                                {showMethodCol && methodDisplay === 'beneath' && row.method ? (
                                                    <Text style={{ fontSize: bFontSize - 2, fontFamily: getPdfFontName(rawFont, false), color: '#475569', paddingTop: 2, lineHeight: bLineHeight }}>Method: {row.method}</Text>
                                                ) : null}
                                            </View>
                                            
                                            <View style={[{ width: resultColWidth }, getCellBorder(!showFlagCol && !showUnitCol && !showRefRangeCol && !(showMethodCol && methodDisplay === 'column'))]}>
                                                <Text style={[styles.tdText, { 
                                                    textAlign: bodyAlign as any, 
                                                    fontFamily: getPdfFontName(rawFont, isAbnormal),
                                                    fontWeight: isAbnormal ? 'bold' : 'normal',
                                                    lineHeight: bLineHeight
                                                }]}>
                                                    {row.result ?? row.value ?? row.resultValue ?? ''}
                                                </Text>
                                            </View>

                                            {showFlagCol ? (
                                                <View style={[{ width: flagColWidth }, getCellBorder(!showUnitCol && !showRefRangeCol && !(showMethodCol && methodDisplay === 'column'))]}>
                                                    <Text style={[styles.tdText, { 
                                                        textAlign: 'center',
                                                        fontFamily: getPdfFontName(rawFont, true), 
                                                        color: flagProps.color,
                                                        lineHeight: bLineHeight
                                                    }]}>
                                                        {flagProps.text}
                                                    </Text>
                                                </View>
                                            ) : null}

                                            {showUnitCol ? (
                                                <View style={[{ width: unitColWidth }, getCellBorder(!showRefRangeCol && !(showMethodCol && methodDisplay === 'column'))]}>
                                                    <Text style={[styles.tdText, { textAlign: bodyAlign as any, lineHeight: bLineHeight }]}>
                                                        {row.unit ? String(row.unit).replace(/([/.\-])/g, '$1\u200B') : ''}
                                                    </Text>
                                                </View>
                                            ) : null}

                                            {showRefRangeCol ? (
                                                <View style={[{ width: refColWidth }, getCellBorder(!(showMethodCol && methodDisplay === 'column'))]}>
                                                    <Text style={[styles.tdText, { textAlign: bodyAlign as any, lineHeight: bLineHeight }]}>
                                                        {cleanBasicHTML(row.range || row.normalRange || row.displayRange || row.referenceRange || row.refRange || row.ref || '')}
                                                    </Text>
                                                </View>
                                            ) : null}

                                            {showMethodCol && methodDisplay === 'column' ? (
                                                <View style={[{ width: methodColWidth }, getCellBorder(true)]}>
                                                    <Text style={[styles.tdText, { textAlign: bodyAlign as any, fontSize: bFontSize - 1, lineHeight: bLineHeight }]}>{row.method}</Text>
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