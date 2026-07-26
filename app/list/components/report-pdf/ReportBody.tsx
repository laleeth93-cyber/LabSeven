import React from 'react';
import { View, Text, Svg, Path } from '@react-pdf/renderer';
import { getPdfFontName, cleanBasicHTML, parseInterpretation } from './reportUtils';

// ✨ PARSER: Extracts numbers even from messy strings
const parseExtremePadding = (val: any, defaultVal: number) => {
    if (val === undefined || val === null) return defaultVal;
    const str = String(val).toLowerCase().trim();
    
    if (str === 'py-0' || str === 'px-0' || str === '0') return 0;
    if (str === 'py-px' || str === 'px-px') return 1;
    if (str === 'py-0.5' || str === 'px-0.5') return 2;
    if (str === 'py-1' || str === 'px-1') return 4;
    if (str === 'py-1.5' || str === 'px-1.5') return 6;
    if (str === 'py-2' || str === 'px-2') return 8;
    if (str === 'py-2.5' || str === 'px-2.5') return 10;
    if (str === 'py-3' || str === 'px-3') return 12;

    const num = parseFloat(str.replace(/[^\d.-]/g, ''));
    if (!isNaN(num)) return num;
    
    return defaultVal;
};

// ✨ CONVERSION FACTOR: Forces PDF Points to exactly match HTML Pixels
const pxToPt = 0.75; 

export default function ReportBody({ groupedData, reportSettings, styles, bFontSize, separateDept, separateTest, realData }: any) {
    
    const getFlagProps = (flag: any) => {
        const f = String(flag || '').toUpperCase().trim();
        const isLow = f === 'L' || f === 'LOW';
        const isHigh = f === 'H' || f === 'HIGH' || f === 'A' || f === 'ABNORMAL' || f === '*';
        const isNormal = !isLow && !isHigh;

        let text = ''; let type = '';
        const style = reportSettings?.flagStyle || 'lh';
        if (style === 'arrows') { type = isLow ? 'arrowDown' : isHigh ? 'arrowUp' : ''; text = ''; }
        else if (style === 'lh') text = isLow ? 'L' : isHigh ? 'H' : '';
        else if (style === 'star') text = (isLow || isHigh) ? '*' : '';
        else if (style === 'text') text = isLow ? 'Low' : isHigh ? 'High' : 'Normal';
        else text = isLow ? 'L' : isHigh ? 'H' : ''; 

        if (isNormal && style !== 'text') text = ''; 
        const color = isLow ? (reportSettings?.flagColorLow || '#3b82f6') : isHigh ? (reportSettings?.flagColorHigh || '#ef4444') : (reportSettings?.flagColorNormal || '#000000');
        return { text, color, type };
    }

    const bodyTableStyle: string = reportSettings?.bodyTableStyle || 'grid';
    const tableHeaderRepeat = reportSettings?.tableHeaderRepeat || 'test';
    const isSeparateDeptEnabled = separateDept === true || String(separateDept) === 'true' || reportSettings?.separatePagesBy === 'department';
    const isSeparateTestEnabled = separateTest === true || String(separateTest) === 'true' || reportSettings?.separatePagesBy === 'test';

    // Scales borders to match HTML visual thickness
    let bbw = 0.75; 
    if (reportSettings?.gridLineThickness === '1.5') bbw = 0.85;
    else if (reportSettings?.gridLineThickness === '1.75') bbw = 1.3;
    else if (reportSettings?.gridLineThickness === '2.0' || reportSettings?.gridLineThickness === '2') bbw = 1.5;
    else if (reportSettings?.gridLineThickness === '2.25') bbw = 1.7;
    else if (reportSettings?.gridLineThickness === '4') bbw = 3.0;

    const showUnitCol = reportSettings?.showUnitCol !== false;
    const showRefRangeCol = reportSettings?.showRefRangeCol !== false;
    const showMethodCol = reportSettings?.showMethodCol === true;
    const showFlagCol = reportSettings?.showFlagCol !== false;
    const showDeptName = reportSettings?.showDepartmentName !== false;

    const methodDisplay = reportSettings?.methodDisplayStyle || 'column';
    const rawFont = reportSettings?.bodyFontFamily || reportSettings?.fontFamily || '';
    
    const rawHighlightSetting = reportSettings?.highlightAbnormalValues ?? reportSettings?.highlightAbnormal ?? reportSettings?.highlightAbnormalResult;
    const isHighlightEnabled = rawHighlightSetting === true || String(rawHighlightSetting).toLowerCase() === 'true' || rawHighlightSetting === 1 || String(rawHighlightSetting) === '1';
    const safeFontSize = parseFloat(bFontSize) || 10;

    // ✨ SYNCHRONIZED PIXEL-TO-POINT MATCHING
    const headerPy = Math.max(0, parseExtremePadding(reportSettings?.headerRowHeight, 6)) * pxToPt;
    const bodyPy = Math.max(0, parseExtremePadding(reportSettings?.bodyRowHeight, 6) - 4) * pxToPt;
    const bodyPx = Math.max(0, parseExtremePadding(reportSettings?.bodyColPadding, 6)) * pxToPt;
    
    const headerToBodyGapPt = parseInt(reportSettings?.headerToBodyGap || '0') * pxToPt;

    const blhVal = reportSettings?.bodyLineHeight;
    let rawLineHeight = parseFloat(String(blhVal !== undefined && blhVal !== null ? blhVal : '').replace(/[^\d.-]/g, ''));
    if (isNaN(rawLineHeight)) rawLineHeight = 1.5;
    
    let actualLineHeightMultiplier = rawLineHeight > 5 ? rawLineHeight / safeFontSize : rawLineHeight;
    const bLineHeight = Math.max(1.0, actualLineHeightMultiplier);
    const squishMarginPt = actualLineHeightMultiplier < 1.0 ? (actualLineHeightMultiplier - 1.0) * safeFontSize : 0;

    // Maps Tailwind margin classes exactly to PDF point math
    const spacingMap: Record<string, number> = { 'mb-0': 0, 'mb-2': 8 * pxToPt, 'mb-4': 16 * pxToPt, 'mb-8': 32 * pxToPt, 'mb-12': 48 * pxToPt };
    const blockMb = spacingMap[reportSettings?.testBlockSpacing || 'mb-4'] ?? (16 * pxToPt);

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

    const borderRadiusMap: Record<string, number | undefined> = { 'none': undefined, 'sm': 2, 'md': 6, 'lg': 8, 'xl': 12 };
    const headerRadius = borderRadiusMap[reportSettings?.headerBorderRadius || 'none'] || undefined;



    // Kills any hidden paddings and enforces the strict mathematical line height
    const getStrictTextStyles = (isAbnormal = false, align = 'left', customLineHeight?: number) => ({
        textAlign: align as any,
        fontFamily: getPdfFontName(rawFont, isAbnormal),
        fontWeight: isAbnormal ? 'bold' : 'normal',
        lineHeight: customLineHeight || bLineHeight,
        marginTop: 0, 
        marginBottom: 0, 
        paddingTop: 0, 
        paddingBottom: 0, 
    });

    const getRowStyle = () => {
        const base: any = { flexDirection: 'row', borderColor: '#000000', borderStyle: 'solid', marginBottom: squishMarginPt };
        if (bodyTableStyle === 'grid') return { ...base, borderLeftWidth: bbw, borderRightWidth: bbw, borderBottomWidth: bbw };
        if (bodyTableStyle === 'horizontal') return { ...base, borderBottomWidth: bbw };
        if (bodyTableStyle === 'outer') return { ...base, borderLeftWidth: bbw, borderRightWidth: bbw };
        return base;
    };

    const getHeaderRowStyle = () => ({
        ...getRowStyle(),
        backgroundColor: dynamicHeaderBgColor,
        borderTopWidth: (bodyTableStyle === 'grid' || bodyTableStyle === 'horizontal' || bodyTableStyle === 'outer') ? bbw : 0,
        borderBottomWidth: (bodyTableStyle === 'grid' || bodyTableStyle === 'horizontal' || bodyTableStyle === 'outer') ? bbw : 0,
        borderRadius: headerRadius,
        marginBottom: squishMarginPt + headerToBodyGapPt,
    });

    const getCellBorder = (isLastCol: boolean, isHeader: boolean = false) => {
        const cellStyle: any = { 
            paddingLeft: bodyPx, 
            paddingRight: bodyPx,
            paddingTop: isHeader ? headerPy : bodyPy, 
            paddingBottom: isHeader ? headerPy : bodyPy,
            justifyContent: 'flex-start' 
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
                const showTableHeader = tableHeaderRepeat === 'test' || (tableHeaderRepeat === 'department' && isNewDept) || (tableHeaderRepeat === 'report' && gIdx === 0);

                return (
                    <React.Fragment key={`group-${gIdx}`}>
                        {needsBreak ? <View break /> : null}

                        <View style={{ marginBottom: blockMb }}>
                            {showDeptName && isNewDept && currentDept ? (
                                <Text style={[ styles.deptName || {}, { fontFamily: getPdfFontName(rawFont, true), fontSize: safeFontSize + 2, textAlign: 'center', marginBottom: 10 * pxToPt, color: '#475569', textTransform: 'uppercase' } ]}>
                                    {currentDept}
                                </Text>
                            ) : null}

                            {(reportSettings?.showTestName !== false || group.showTestNameOverride) && group.testName ? (
                                <Text style={[styles.testNameText, { marginBottom: 6 * pxToPt }]}>{group.testName}</Text>
                            ) : null}

                            <View style={{ marginTop: 4 * pxToPt }}>
                                {showTableHeader && (
                                    <View style={getHeaderRowStyle()} wrap={false} fixed>
                                        <View style={[{ width: paramColWidth }, getCellBorder(false, true), { borderTopLeftRadius: headerRadius, borderBottomLeftRadius: headerRadius }]}>
                                            <Text style={[styles.thText, getStrictTextStyles(true, 'left', 1.2), { color: dynamicHeaderTextColor }]}>{"Test\u00A0Parameter"}</Text>
                                        </View>
                                        <View style={[{ width: resultColWidth }, getCellBorder(!showFlagCol && !showUnitCol && !showRefRangeCol && !(showMethodCol && methodDisplay === 'column'), true), { borderTopRightRadius: totalCols === 2 ? headerRadius : undefined, borderBottomRightRadius: totalCols === 2 ? headerRadius : undefined }]}>
                                            <Text style={[styles.thText, getStrictTextStyles(true, bodyAlign, 1.2), { color: dynamicHeaderTextColor }]}>Result</Text>
                                        </View>
                                        {showFlagCol ? (
                                            <View style={[{ width: flagColWidth }, getCellBorder(!showUnitCol && !showRefRangeCol && !(showMethodCol && methodDisplay === 'column'), true), { borderTopRightRadius: totalCols === 3 ? headerRadius : undefined, borderBottomRightRadius: totalCols === 3 ? headerRadius : undefined }]}>
                                                <Text style={[styles.thText, getStrictTextStyles(true, 'center', 1.2), { color: dynamicHeaderTextColor }]}>Flag</Text>
                                            </View>
                                        ) : null}
                                        {showUnitCol ? (
                                            <View style={[{ width: unitColWidth }, getCellBorder(!showRefRangeCol && !(showMethodCol && methodDisplay === 'column'), true), { borderTopRightRadius: totalCols === (showFlagCol ? 4 : 3) ? headerRadius : undefined, borderBottomRightRadius: totalCols === (showFlagCol ? 4 : 3) ? headerRadius : undefined }]}>
                                                <Text style={[styles.thText, getStrictTextStyles(true, bodyAlign, 1.2), { color: dynamicHeaderTextColor }]}>Units</Text>
                                            </View>
                                        ) : null}
                                        {showRefRangeCol ? (
                                            <View style={[{ width: refColWidth }, getCellBorder(!(showMethodCol && methodDisplay === 'column'), true), { borderTopRightRadius: totalCols === (showMethodCol && methodDisplay === 'column' ? totalCols - 1 : totalCols) ? headerRadius : undefined, borderBottomRightRadius: totalCols === (showMethodCol && methodDisplay === 'column' ? totalCols - 1 : totalCols) ? headerRadius : undefined }]}>
                                                <Text style={[styles.thText, getStrictTextStyles(true, bodyAlign, 1.2), { color: dynamicHeaderTextColor }]}>{"Bio.\u00A0Ref.\u00A0Range"}</Text>
                                            </View>
                                        ) : null}
                                        {showMethodCol && methodDisplay === 'column' ? (
                                            <View style={[{ width: methodColWidth }, getCellBorder(true, true), { borderTopRightRadius: headerRadius, borderBottomRightRadius: headerRadius }]}>
                                                <Text style={[styles.thText, getStrictTextStyles(true, bodyAlign, 1.2), { color: dynamicHeaderTextColor }]}>Method</Text>
                                            </View>
                                        ) : null}
                                    </View>
                                )}

                                {group.items.map((row: any, idx: number) => {
                                    if (row.isGroup) {
                                        return (
                                            <View key={idx} style={[getRowStyle(), { paddingTop: bodyPy, paddingBottom: bodyPy, paddingLeft: bodyPx, paddingRight: bodyPx, backgroundColor: 'transparent' }]} wrap={false}>
                                                <Text style={[styles.subHeadingText, getStrictTextStyles(true, 'left', 1.2)]}>{row.param}</Text>
                                            </View>
                                        );
                                    }

                                    const isStriped = reportSettings?.stripedRows && idx % 2 !== 0;
                                    
                                    if (row.inputType === 'Big') {
                                        const bigBlocks = parseInterpretation(row.result || '');
                                        return (
                                            <View key={idx} style={[getRowStyle(), { backgroundColor: isStriped ? '#f8fafc' : 'transparent' }]} wrap={false}>
                                                <View style={[{ width: paramColWidth }, getCellBorder(false)]}>
                                                    <Text style={[styles.tdText, getStrictTextStyles(false, 'left')]}>{row.param}</Text>
                                                </View>
                                                <View style={[{ flex: 1, flexDirection: 'column', justifyContent: 'center' }, getCellBorder(true)]}>
                                                    {bigBlocks.map((block: any, bIdx: number) => {
                                                        if (block.type === 'text') {
                                                            return <Text key={bIdx} style={[getStrictTextStyles(false, 'left'), { fontSize: safeFontSize, color: '#000000', marginBottom: 2 * pxToPt }]}>{block.content}</Text>;
                                                        } else if (block.type === 'table') {
                                                            return (
                                                                <View key={bIdx} style={{ borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 6 * pxToPt, marginTop: 2 * pxToPt, borderRadius: 2 }}>
                                                                    {block.rows.map((r: any[], rIdx: number) => {
                                                                        const isHeader = rIdx === 0;
                                                                        return (
                                                                            <View key={rIdx} style={{ flexDirection: 'row', borderBottomWidth: rIdx === block.rows.length - 1 ? 0 : 1, borderColor: '#cbd5e1', backgroundColor: isHeader ? '#e2e8f0' : 'transparent' }} wrap={false}>
                                                                                {r.map((cell: string, cIdx: number) => (
                                                                                    <View key={cIdx} style={{ flex: 1, padding: 4 * pxToPt, borderRightWidth: cIdx === r.length - 1 ? 0 : 1, borderColor: '#cbd5e1', justifyContent: 'center' }}>
                                                                                        <Text style={[getStrictTextStyles(isHeader, 'center'), { fontSize: safeFontSize - 1, color: isHeader ? '#334155' : '#0f172a' }]}>
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
                                    const isAbnormal = isHighlightEnabled && ((flagProps.text !== '' && flagProps.text !== 'Normal') || flagProps.type !== '');

                                    return (
                                        <View key={idx} style={[getRowStyle(), { backgroundColor: isStriped ? '#f8fafc' : '#ffffff' }]} wrap={false}>
                                            <View style={[{ width: paramColWidth }, getCellBorder(false)]}>
                                                <Text style={[styles.tdText, getStrictTextStyles(false, 'left')]}>{row.param}</Text>
                                                {showMethodCol && methodDisplay === 'beneath' && row.method ? (
                                                    <Text style={[getStrictTextStyles(false, 'left'), { fontSize: safeFontSize - 2, color: '#475569', paddingTop: 2 * pxToPt }]}>Method: {row.method}</Text>
                                                ) : null}
                                            </View>
                                            
                                            <View style={[{ width: resultColWidth }, getCellBorder(!showFlagCol && !showUnitCol && !showRefRangeCol && !(showMethodCol && methodDisplay === 'column'))]}>
                                                <Text style={[styles.tdText, getStrictTextStyles(isAbnormal, bodyAlign)]}>{row.result ?? row.value ?? row.resultValue ?? ''}</Text>
                                            </View>

                                            {showFlagCol ? (
                                                <View style={[{ width: flagColWidth }, getCellBorder(!showUnitCol && !showRefRangeCol && !(showMethodCol && methodDisplay === 'column'))]}>
                                                    {flagProps.type === 'arrowUp' || flagProps.type === 'arrowDown' ? (
                                                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-start', margin: 0, padding: 0 }}>
                                                            <Svg style={{ width: 8, height: 10 }} viewBox="0 0 10 10">
                                                                <Path fill={flagProps.color} d={flagProps.type === 'arrowUp' ? "M 5,0 L 0,5 L 3,5 L 3,10 L 7,10 L 7,5 L 10,5 Z" : "M 5,10 L 0,5 L 3,5 L 3,0 L 7,0 L 7,5 L 10,5 Z"} />
                                                            </Svg>
                                                        </View>
                                                    ) : (
                                                        <Text style={[styles.tdText, getStrictTextStyles(true, 'center'), { color: flagProps.color }]}>{flagProps.text}</Text>
                                                    )}
                                                </View>
                                            ) : null}

                                            {showUnitCol ? (
                                                <View style={[{ width: unitColWidth }, getCellBorder(!showRefRangeCol && !(showMethodCol && methodDisplay === 'column'))]}>
                                                    <Text style={[styles.tdText, getStrictTextStyles(false, bodyAlign)]}>{row.unit ? String(row.unit).replace(/([/.\-])/g, '$1\u200B') : ''}</Text>
                                                </View>
                                            ) : null}

                                            {showRefRangeCol ? (
                                                <View style={[{ width: refColWidth }, getCellBorder(!(showMethodCol && methodDisplay === 'column'))]}>
                                                    <Text style={[styles.tdText, getStrictTextStyles(false, bodyAlign)]}>{cleanBasicHTML(row.range || row.normalRange || row.displayRange || row.referenceRange || row.refRange || row.ref || '')}</Text>
                                                </View>
                                            ) : null}

                                            {showMethodCol && methodDisplay === 'column' ? (
                                                <View style={[{ width: methodColWidth }, getCellBorder(true)]}>
                                                    <Text style={[styles.tdText, getStrictTextStyles(false, bodyAlign), { fontSize: safeFontSize - 1 }]}>{row.method}</Text>
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
                                <View style={{ marginTop: 12 * pxToPt, paddingHorizontal: 6 * pxToPt }} wrap={false}>
                                    <Text style={{ fontFamily: getPdfFontName(rawFont, true), fontSize: safeFontSize, marginBottom: 6 * pxToPt, color: 'grey', textDecoration: 'underline' }}>
                                        Interpretation:
                                    </Text>
                                    
                                    {group.interpretationBlocks.map((block: any, bIdx: number) => {
                                        if (block.type === 'text') {
                                            return (
                                                <Text key={bIdx} style={{ fontFamily: getPdfFontName(rawFont, false), fontSize: safeFontSize - 1, color: '#334155', lineHeight: block.lineHeight || 1.4, marginBottom: 4 * pxToPt }}>
                                                    {block.content}
                                                </Text>
                                            );
                                        } else if (block.type === 'table') {
                                            return (
                                                <View key={bIdx} style={{ borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 8 * pxToPt, marginTop: 4 * pxToPt, borderRadius: 2 }}>
                                                    {block.rows.map((row: any[], rIdx: number) => {
                                                        const isHeader = rIdx === 0;
                                                        return (
                                                            <View key={rIdx} style={{ flexDirection: 'row', borderBottomWidth: rIdx === block.rows.length - 1 ? 0 : 1, borderColor: '#cbd5e1', backgroundColor: isHeader ? '#e2e8f0' : '#ffffff' }} wrap={false}>
                                                                {row.map((cell: string, cIdx: number) => (
                                                                    <View key={cIdx} style={{ flex: 1, padding: 4 * pxToPt, borderRightWidth: cIdx === row.length - 1 ? 0 : 1, borderColor: '#cbd5e1', justifyContent: 'center' }}>
                                                                        <Text style={{ fontFamily: getPdfFontName(rawFont, isHeader), fontSize: safeFontSize - 2, color: isHeader ? '#334155' : '#0f172a', textAlign: 'center' }}>
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
                                <View style={{ marginTop: 8 * pxToPt, paddingHorizontal: 6 * pxToPt }} wrap={false}>
                                    <Text style={{ fontFamily: getPdfFontName(rawFont, true), fontSize: safeFontSize, marginBottom: 4 * pxToPt, color: '#0f172a', textDecoration: 'underline' }}>
                                        Note:
                                    </Text>
                                    
                                    {group.noteBlocks.map((block: any, bIdx: number) => {
                                        if (block.type === 'text') {
                                            return (
                                                <Text key={bIdx} style={{ fontFamily: getPdfFontName(rawFont, false), fontSize: safeFontSize - 1, color: '#334155', lineHeight: block.lineHeight || 1.4, marginBottom: 4 * pxToPt }}>
                                                    {block.content}
                                                </Text>
                                            );
                                        } else if (block.type === 'table') {
                                            return (
                                                <View key={bIdx} style={{ borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 8 * pxToPt, marginTop: 4 * pxToPt, borderRadius: 2 }}>
                                                    {block.rows.map((row: any[], rIdx: number) => {
                                                        const isHeader = rIdx === 0;
                                                        return (
                                                            <View key={rIdx} style={{ flexDirection: 'row', borderBottomWidth: rIdx === block.rows.length - 1 ? 0 : 1, borderColor: '#cbd5e1', backgroundColor: isHeader ? '#e2e8f0' : '#ffffff' }} wrap={false}>
                                                                {row.map((cell: string, cIdx: number) => (
                                                                    <View key={cIdx} style={{ flex: 1, padding: 4 * pxToPt, borderRightWidth: cIdx === row.length - 1 ? 0 : 1, borderColor: '#cbd5e1', justifyContent: 'center' }}>
                                                                        <Text style={{ fontFamily: getPdfFontName(rawFont, isHeader), fontSize: safeFontSize - 2, color: isHeader ? '#334155' : '#0f172a', textAlign: 'center' }}>
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
                <Text style={{ textAlign: 'center', marginTop: 15 * pxToPt, fontSize: 9, fontFamily: getPdfFontName(rawFont, true), color: '#64748b', textTransform: 'uppercase' }}>
                    *** End of Report ***
                </Text>
            ) : null}
        </React.Fragment>
    );
}