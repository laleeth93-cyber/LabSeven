import React from 'react';
import { Document, Page, StyleSheet, View, Text, Svg, Circle, Line, G, Path, Image } from '@react-pdf/renderer';

function PdfDynamicChart({ dataPoints, isAlert, deltaSettings }: { dataPoints: {value: number, label: string}[], isAlert: boolean, deltaSettings: any }) {
    if (!dataPoints || dataPoints.length < 2) return null;

    const width = 480; 
    const height = 70;
    const paddingX = 20;
    const paddingY = 20;
    const usableHeight = height - paddingY * 2;

    const values = dataPoints.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min === 0 ? 1 : max - min;
    
    const getX = (i: number) => paddingX + (i * ((width - paddingX * 2) / (dataPoints.length - 1)));
    const getY = (val: number) => paddingY + usableHeight - (((val - min) / range) * usableHeight);

    const primaryColor = isAlert ? (deltaSettings?.alertColor || '#e11d48') : (deltaSettings?.primaryColor || '#9575cd');
    const nodeRadius = parseInt(deltaSettings?.nodeRadius !== undefined ? deltaSettings.nodeRadius : '3');

    const style = deltaSettings?.graphStyle || 'lollipop';
    const isLine = style === 'line';
    const isBar = style === 'bar';
    const isArea = style === 'area';
    const isStep = style === 'step';
    const isScatter = style === 'scatter';
    const isLollipop = !isLine && !isBar && !isArea && !isStep && !isScatter;

    let linePath = '';
    let areaPath = '';
    let stepPath = '';

    if (isLine || isArea) {
        linePath = dataPoints.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.value)}`).join(' ');
    }
    if (isArea && dataPoints.length > 0) {
        areaPath = `${linePath} L ${getX(dataPoints.length - 1)} ${height - paddingY} L ${getX(0)} ${height - paddingY} Z`;
    }
    if (isStep) {
        stepPath = dataPoints.map((d, i) => i === 0 ? `M ${getX(i)} ${getY(d.value)}` : `L ${getX(i)} ${getY(dataPoints[i-1].value)} L ${getX(i)} ${getY(d.value)}`).join(' ');
    }

    return (
        <View style={{ marginTop: 15, alignItems: 'center' }}>
            <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                <Line x1={paddingX - 10} y1={height - paddingY} x2={width - paddingX + 10} y2={height - paddingY} stroke="#e2e8f0" strokeWidth={1.5} strokeLinecap="round" />
                
                {isArea && <Path d={areaPath} fill={primaryColor} opacity={0.15} stroke="none" />}

                {(isLine || isArea) && <Path d={linePath} stroke={primaryColor} strokeWidth={2} fill="none" />}
                {isStep && <Path d={stepPath} stroke={primaryColor} strokeWidth={2} fill="none" />}

                {dataPoints.map((d, i) => {
                    const cx = getX(i);
                    const cy = getY(d.value);
                    return (
                        <G key={i}>
                            {(isLollipop || isBar) && (
                                <Line 
                                    x1={cx} y1={height - paddingY} x2={cx} y2={cy} 
                                    stroke={primaryColor} 
                                    strokeWidth={isBar ? 12 : 1.5} 
                                    opacity={isBar ? 0.7 : 1}
                                />
                            )}
                            
                            {!isBar && nodeRadius > 0 && (
                                <Circle cx={cx} cy={cy} r={nodeRadius} fill="#ffffff" stroke={primaryColor} strokeWidth={1.5} />
                            )}
                            
                            <Text x={cx} y={cy - (isBar ? 2 : (nodeRadius + 4))} fill={primaryColor} style={{ fontSize: 8, fontFamily: deltaSettings?.fontFamily || 'Helvetica-Bold' }} textAnchor="middle">{d.value}</Text>
                            <Text x={cx} y={height - 8} fill="#64748b" style={{ fontSize: 7, fontFamily: deltaSettings?.fontFamily || 'Helvetica' }} textAnchor="middle">{d.label}</Text>
                        </G>
                    );
                })}
            </Svg>
        </View>
    );
}

export default function SmartReportDocument({ bill, groupedData, reportSettings, reportedDate, deltaSettings }: any) {
    
    const primaryTheme = deltaSettings?.primaryColor || '#9575cd';
    const alertTheme = deltaSettings?.alertColor || '#e11d48';
    const docFont = deltaSettings?.fontFamily || 'Helvetica';
    const headingSize = parseInt(deltaSettings?.headingSize || '12');
    const paramNameSize = parseInt(deltaSettings?.paramNameSize || '11');
    const resultValueSize = parseInt(deltaSettings?.resultValueSize || '12');

    const styles = StyleSheet.create({
        page: { backgroundColor: '#ffffff', padding: 40, paddingBottom: 140, fontFamily: docFont, position: 'relative' },
        headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 2, borderBottomColor: primaryTheme, paddingBottom: 15, marginBottom: 20 },
        headerLeft: { flex: 1 },
        headerRight: { flex: 1, alignItems: 'flex-end' },
        labName: { fontSize: 20, fontFamily: `${docFont}-Bold`, color: '#1e293b', marginBottom: 4 },
        tagline: { fontSize: 9, color: '#64748b', textTransform: 'uppercase' },
        reportTitle: { fontSize: 14, fontFamily: `${docFont}-Bold`, color: primaryTheme, textAlign: 'right', marginBottom: 4 },
        reportDate: { fontSize: 9, color: '#64748b', textAlign: 'right' },
        demoBox: { backgroundColor: '#f8fafc', borderRadius: 8, padding: 12, flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20 },
        demoCol: { flex: 1 },
        demoLabel: { fontSize: 7, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4, fontFamily: `${docFont}-Bold` },
        demoValue: { fontSize: 11, color: '#0f172a', fontFamily: `${docFont}-Bold`, marginBottom: 2 },
        demoSubValue: { fontSize: 9, color: '#475569' },
        testSection: { marginBottom: 25 },
        testHeader: { fontSize: headingSize, fontFamily: `${docFont}-Bold`, color: primaryTheme, textTransform: 'uppercase', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 4 },
        paramCard: { marginBottom: 15, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
        paramTopRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
        colName: { width: '30%' },
        paramName: { fontSize: paramNameSize, fontFamily: `${docFont}-Bold`, color: '#1e293b' },
        paramUnit: { fontSize: 7, color: '#64748b', marginTop: 2 },
        colResults: { width: '55%', flexDirection: 'row', flexWrap: 'wrap' },
        resultItem: { marginRight: 24, alignItems: 'flex-start' },
        resultValue: { fontSize: resultValueSize, fontFamily: `${docFont}-Bold`, color: '#1e293b' },
        alertValue: { color: alertTheme },
        resultDate: { fontSize: 7, color: '#64748b', marginTop: 2 },
        colShift: { width: '15%', alignItems: 'flex-end' },
        shiftText: { fontSize: resultValueSize, fontFamily: `${docFont}-Bold`, color: '#334155' },
        shiftAlert: { color: alertTheme },
        shiftLabel: { fontSize: 6, color: '#94a3b8', textTransform: 'uppercase', marginTop: 2 },
        footer: { position: 'absolute', bottom: 30, left: 40, right: 40 },
        footerNotesContainer: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8, marginTop: 15 },
        footerText: { fontSize: 8, color: '#94a3b8' }
    });

    const patientName = `${bill?.patient?.designation || ''} ${bill?.patient?.firstName} ${bill?.patient?.lastName}`.trim();

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.headerContainer} fixed>
                    <View style={styles.headerLeft}>
                        <Text style={styles.labName}>{reportSettings?.labName || 'Lab Seven'}</Text>
                        <Text style={styles.tagline}>{reportSettings?.tagline || 'Advanced Analytics & Diagnostics'}</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <Text style={styles.reportTitle}>DELTA VARIANCE REPORT</Text>
                        <Text style={styles.reportDate}>Generated: {reportedDate}</Text>
                    </View>
                </View>

                <View style={styles.demoBox}>
                    <View style={styles.demoCol}>
                        <Text style={styles.demoLabel}>Patient Details</Text>
                        <Text style={styles.demoValue}>{patientName}</Text>
                        <Text style={styles.demoSubValue}>{bill?.patient?.ageY}Y {bill?.patient?.ageM}M  |  {bill?.patient?.gender}</Text>
                    </View>
                    <View style={styles.demoCol}>
                        <Text style={styles.demoLabel}>Reference Bill</Text>
                        <Text style={styles.demoValue}>{bill?.billNumber}</Text>
                        <Text style={styles.demoSubValue}>UID: {bill?.patient?.patientId}</Text>
                    </View>
                    <View style={styles.demoCol}>
                        <Text style={styles.demoLabel}>Primary Doctor</Text>
                        <Text style={styles.demoValue}>{bill?.patient?.refDoctor || 'Self'}</Text>
                    </View>
                </View>

                {Object.keys(groupedData).map(testName => (
                    <View key={testName} style={styles.testSection}>
                        <Text style={styles.testHeader}>{testName}</Text>

                        {groupedData[testName].map((row: any, idx: number) => {
                            const isAlert = row.isClinicallySignificant;
                            const chronologicalHistory = row.history ? [...row.history].reverse() : [];
                            const rawPoints = [
                                ...chronologicalHistory.map((h: any) => ({
                                    value: parseFloat(h.value),
                                    label: new Date(h.date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short'})
                                })),
                                { value: parseFloat(row.currentValue), label: 'Latest' }
                            ];
                            const graphPoints = rawPoints.filter((p: {value: number, label: string}) => !isNaN(p.value));

                            const displaySequence = [
                                ...chronologicalHistory.map((h: any) => ({
                                    label: new Date(h.date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: '2-digit'}), value: h.value, flag: h.flag
                                })),
                                { label: new Date(row.currentDate).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: '2-digit'}), value: row.currentValue, flag: row.currentFlag }
                            ];
                            
                            return (
                                <View key={idx} style={styles.paramCard} wrap={false}>
                                    <View style={styles.paramTopRow}>
                                        <View style={styles.colName}>
                                            <Text style={styles.paramName}>{row.parameterName} {isAlert ? '(!)' : ''}</Text>
                                            <Text style={styles.paramUnit}>Unit: {row.unit || 'N/A'}</Text>
                                        </View>
                                        
                                        <View style={styles.colResults}>
                                            {displaySequence.map((item, i) => (
                                                <View key={i} style={styles.resultItem}>
                                                    <Text style={[styles.resultValue, item.flag !== 'Normal' ? styles.alertValue : {}]}>
                                                        {item.value}
                                                    </Text>
                                                    <Text style={styles.resultDate}>{item.label}</Text>
                                                </View>
                                            ))}
                                        </View>

                                        <View style={styles.colShift}>
                                            {row.deltaPercent !== null ? (
                                                <View>
                                                    <Text style={[styles.shiftText, isAlert ? styles.shiftAlert : {}]}>
                                                        {Number(row.deltaPercent) > 0 ? '+' : ''}{row.deltaPercent}%
                                                    </Text>
                                                    <Text style={styles.shiftLabel}>Shift</Text>
                                                </View>
                                            ) : <Text style={styles.shiftText}>-</Text>}
                                        </View>
                                    </View>

                                    <PdfDynamicChart dataPoints={graphPoints} isAlert={isAlert} deltaSettings={deltaSettings} />
                                    
                                </View>
                            );
                        })}
                    </View>
                ))}

                <View style={styles.footer} fixed>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <View style={{ flexDirection: 'row', gap: 15, alignItems: 'flex-end' }}>
                            {reportSettings?.showQrCode !== false && (
                                <View style={{ alignItems: 'center' }}>
                                    {/* 🚨 FIX: ADDED ?type=smart TO THE QR CODE LINK */}
                                    <Image src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`https://labseven.in/verify/${bill?.id}?type=smart`)}`} style={{ width: 50, height: 50 }} />
                                    <Text style={{ fontSize: 6, color: '#64748b', marginTop: 4 }}>{reportSettings?.qrText || 'Scan to validate'}</Text>
                                </View>
                            )}
                            {reportSettings?.showBarcode && (
                                <View style={{ alignItems: 'center', marginLeft: 10 }}>
                                    <Image src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${bill?.billNumber}&scale=2`} style={{ width: 80, height: 25 }} />
                                    <Text style={{ fontSize: 6, color: '#64748b', marginTop: 4 }}>{bill?.billNumber}</Text>
                                </View>
                            )}
                        </View>

                        <View style={{ flexDirection: 'row', gap: 40, alignItems: 'flex-end' }}>
                            {reportSettings?.doc1Name && (
                                <View style={{ alignItems: 'center' }}>
                                    {reportSettings?.doc1SignUrl ? (
                                        <Image src={reportSettings.doc1SignUrl} style={{ width: (reportSettings.sigSize || 40) * 2, height: reportSettings.sigSize || 40, objectFit: 'contain', marginBottom: reportSettings?.sigSpacing || 4 }} />
                                    ) : <View style={{ height: reportSettings?.sigSize || 40, marginBottom: reportSettings?.sigSpacing || 4 }} />}
                                    <Text style={{ fontSize: reportSettings?.docNameSize || 10, fontFamily: `${docFont}-Bold`, color: '#1e293b' }}>{reportSettings.doc1Name}</Text>
                                    <Text style={{ fontSize: reportSettings?.docDesigSize || 8, color: '#64748b', marginTop: reportSettings?.docNameSpacing || 2 }}>{reportSettings.doc1Designation}</Text>
                                </View>
                            )}
                            {reportSettings?.doc2Name && (
                                <View style={{ alignItems: 'center' }}>
                                    {reportSettings?.doc2SignUrl ? (
                                        <Image src={reportSettings.doc2SignUrl} style={{ width: (reportSettings.sigSize || 40) * 2, height: reportSettings.sigSize || 40, objectFit: 'contain', marginBottom: reportSettings?.sigSpacing || 4 }} />
                                    ) : <View style={{ height: reportSettings?.sigSize || 40, marginBottom: reportSettings?.sigSpacing || 4 }} />}
                                    <Text style={{ fontSize: reportSettings?.docNameSize || 10, fontFamily: `${docFont}-Bold`, color: '#1e293b' }}>{reportSettings.doc2Name}</Text>
                                    <Text style={{ fontSize: reportSettings?.docDesigSize || 8, color: '#64748b', marginTop: reportSettings?.docNameSpacing || 2 }}>{reportSettings.doc2Designation}</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    <View style={styles.footerNotesContainer}>
                        <Text style={styles.footerText}>
                            {deltaSettings?.showFooterNotes !== false ? '* (!) Indicates a clinically significant shift (>15%) from historical baseline.' : ''}
                        </Text>
                        <Text style={styles.footerText} render={({ pageNumber, totalPages }) => (
                            `Page ${pageNumber} of ${totalPages}  |  Lab Seven Data Engine`
                        )} />
                    </View>
                </View>

            </Page>
        </Document>
    );
}