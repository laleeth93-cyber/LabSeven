// --- app/reports/components/PrintReportContent.tsx Block Open ---
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { getFieldValue } from '@/app/list/components/report-pdf/reportUtils';

interface PrintReportContentProps {
    formData: any;
    leftColFields: any[];
    rightColFields: any[];
    bodySettings: any;
    footerSettings: any;
    paperWidth: number;
    paperHeight: number;
    t: number;
    b: number;
    l: number;
    r: number;
    activeImageBase64: string;
    printHeaderFooter?: boolean;
}

const shortenedDummyData: any[] = [
    { isGroup: true, param: 'Complete Blood Picture (CBP)' },
    { isGroup: true, isSubHeading: true, param: 'COMPLETE BLOOD COUNT' },
    { param: 'Haemoglobin (Hb)', result: '10.5', unit: 'g/dL', ref: '13.0 - 17.0', method: 'Cyanmethaemoglobin', abnormal: true },
    { param: 'RBC Count', result: '4.8', unit: 'millions/cumm', ref: '4.5 - 5.5', method: 'Electrical Impedance', abnormal: false },
    { param: 'PCV (Hematocrit)', result: '38', unit: '%', ref: '40 - 50', method: 'Calculated', abnormal: true },
    { param: 'Mean Corpuscular Vol (MCV)', result: '82', unit: 'fL', ref: '83 - 101', method: 'Calculated', abnormal: true }
];

export default function PrintReportContent({ 
    formData, leftColFields, rightColFields, bodySettings, footerSettings, 
    paperWidth, paperHeight, t, b, l, r, activeImageBase64, printHeaderFooter = true 
}: PrintReportContentProps) {

    const ptToPx = 1.3333;
    const topPx = t * ptToPx;
    const bottomPx = b * ptToPx;
    const leftPx = l * ptToPx;
    const rightPx = r * ptToPx;

    let bw = '1px';
    if (bodySettings?.gridLineThickness === '1.75') bw = '1.75px';
    else if (bodySettings?.gridLineThickness === '2.0') bw = '2px';
    else if (bodySettings?.gridLineThickness === '2.25') bw = '2.25px';
    else if (bodySettings?.gridLineThickness === '2') bw = '2px'; 
    else if (bodySettings?.gridLineThickness === '4') bw = '3px'; 

    const bColor = "black";
    const maxRows = Math.max(leftColFields.length, rightColFields.length);
    const previewRows = maxRows > 0 ? Array.from({ length: maxRows }) : [];
    const currentHeaderStyle = formData?.tableStyle || 'grid';
    const dynamicLabelClass = `${formData?.labelBold ? 'font-bold' : 'font-medium'} text-slate-800`;
    const dynamicDataClass = `${formData?.dataBold ? 'font-bold' : 'font-medium'} text-slate-700`;
    
    const lSplit = (formData?.leftColWidth || "35 65").split(' '); 
    const rSplit = (formData?.rightColWidth || "35 65").split(' ');
    const lLabelW = Number(lSplit[0]); const lDataW = Number(lSplit[1]); 
    const rLabelW = Number(rSplit[0]); const rDataW = Number(rSplit[1]);

    let demoTableStyle: React.CSSProperties = { borderCollapse: 'collapse', borderSpacing: 0, width: '100%' };
    let demoTdStyle: React.CSSProperties = {};

    if (currentHeaderStyle === 'grid') {
        demoTableStyle = { ...demoTableStyle, border: `${bw} solid ${bColor}` };
        demoTdStyle = { border: `${bw} solid ${bColor}`, backgroundColor: '#ffffff' };
    } else if (currentHeaderStyle === 'horizontal') {
        demoTableStyle = { ...demoTableStyle, borderTop: `${bw} solid ${bColor}`, borderBottom: `${bw} solid ${bColor}` };
        demoTdStyle = { borderBottom: `${bw} solid ${bColor}` };
    } else if (currentHeaderStyle === 'outer' || currentHeaderStyle === 'split') {
        demoTableStyle = { ...demoTableStyle, border: `${bw} solid ${bColor}` };
    }

    const activeFontFamily = bodySettings?.bodyFontFamily || formData?.fontFamily || '';
    const isTailwindFont = activeFontFamily.startsWith('font-');
    const appliedFontClass = isTailwindFont ? activeFontFamily : '';
    const appliedCustomFont = !isTailwindFont ? activeFontFamily : undefined;

    let bodyTableStyle: React.CSSProperties = { borderCollapse: 'collapse', borderSpacing: 0, width: '100%' };
    let thStyle: React.CSSProperties = { backgroundColor: bodySettings?.bodyHeaderBgColor || '#ffffff', color: bodySettings?.bodyHeaderTextColor || '#000000' };
    let tdStyle: React.CSSProperties = {};

    if (bodySettings?.bodyTableStyle === 'grid') {
        bodyTableStyle = { ...bodyTableStyle, border: `${bw} solid ${bColor}` };
        thStyle = { ...thStyle, border: `${bw} solid ${bColor}` };
        tdStyle = { border: `${bw} solid ${bColor}` }; 
    } else if (bodySettings?.bodyTableStyle === 'horizontal') {
        bodyTableStyle = { ...bodyTableStyle, borderTop: `${bw} solid ${bColor}`, borderBottom: `${bw} solid ${bColor}` };
        thStyle = { ...thStyle, borderBottom: `${bw} solid ${bColor}` };
        tdStyle = { borderBottom: `${bw} solid ${bColor}` };
    } else if (bodySettings?.bodyTableStyle === 'outer') {
        bodyTableStyle = { ...bodyTableStyle, border: `${bw} solid ${bColor}` };
    }

    const hFont = bodySettings?.headerFontSize || 'text-xs';
    const hWeight = bodySettings?.headerFontWeight || 'font-bold';
    const hPad = bodySettings?.headerRowHeight || 'py-1.5';
    const thClass = `${hPad} ${bodySettings?.bodyColPadding || 'px-2'} ${hFont} ${hWeight} break-words align-middle`;
    const tdClass = `${bodySettings?.bodyRowHeight || 'py-1.5'} ${bodySettings?.bodyColPadding || 'px-2'} break-words align-top`;

    let totalCols = 2; 
    if (bodySettings?.showUnitCol) totalCols++; 
    if (bodySettings?.showRefRangeCol) totalCols++; 
    if (bodySettings?.showMethodCol && bodySettings?.methodDisplayStyle === 'column') totalCols++;

    const TableColGroup = () => {
        const isCustomW = bodySettings?.testColumnWidth && bodySettings.testColumnWidth !== 'auto';
        const w1 = isCustomW ? bodySettings.testColumnWidth : (totalCols === 5 ? '36%' : totalCols === 4 ? '40%' : totalCols === 3 ? '50%' : '70%');
        const wRem = isCustomW ? undefined : (totalCols === 5 ? '16%' : totalCols === 4 ? '20%' : totalCols === 3 ? '25%' : '30%');
        return (
            <colgroup>
                <col style={{ width: w1 }} />
                <col style={{ width: wRem }} />
                {bodySettings?.showUnitCol && <col style={{ width: wRem }} />}
                {bodySettings?.showRefRangeCol && <col style={{ width: wRem }} />}
                {bodySettings?.showMethodCol && bodySettings?.methodDisplayStyle === 'column' && <col style={{ width: wRem }} />}
            </colgroup>
        );
    };

    const groupedDummyData: { testName: string, items: any[] }[] = [];
    let currentDummyGroup = { testName: '', items: [] as any[] };

    shortenedDummyData.forEach((row: any) => {
        if (row.isGroup && !row.isSubHeading) {
            if (currentDummyGroup.items.length > 0 || currentDummyGroup.testName) {
                groupedDummyData.push(currentDummyGroup);
            }
            currentDummyGroup = { testName: row.param, items: [] };
        } else {
            currentDummyGroup.items.push(row);
        }
    });
    if (currentDummyGroup.items.length > 0 || currentDummyGroup.testName) {
        groupedDummyData.push(currentDummyGroup);
    }

    // Dynamic Preview Signature Styling
    const sigHeightPx = (footerSettings.sigSize || 40) * ptToPx;
    const sigSpacingPx = (footerSettings.sigSpacing ?? 4) * ptToPx;
    const docNamePx = (footerSettings.docNameSize || 10) * ptToPx;
    const docDesigPx = (footerSettings.docDesigSize || 8) * ptToPx;
    const docNameSpacingPx = (footerSettings.docNameSpacing ?? 2) * ptToPx;
    
    const rawAlign = footerSettings.sigAlignment || 'center';
    let textAlign = 'center';
    if (rawAlign === 'flex-start') textAlign = 'left';
    if (rawAlign === 'flex-end') textAlign = 'right';

    const renderSignature = (num: number) => (
        <div key={`sig${num}`} className="shrink-0 flex flex-col justify-end" style={{ width: `${120 * ptToPx}px`, alignItems: rawAlign }}>
            <div className="w-full mb-0 bg-slate-100/50 border border-slate-200 rounded-sm text-[10px] text-slate-400 flex items-center justify-center" style={{ height: `${sigHeightPx}px` }}>[ Signature Image ]</div>
            <div className="w-full" style={{ borderBottom: '1px solid black' }}></div>
            <p className="font-bold text-slate-800 leading-tight w-full" style={{ fontSize: `${docNamePx}px`, marginTop: `${sigSpacingPx}px`, textAlign: textAlign as any }}>{num === 1 ? (formData?.doc1Name || 'Doctor Name') : (formData?.doc2Name || 'Doctor Name')}</p>
            <p className="text-slate-600 leading-tight w-full" style={{ fontSize: `${docDesigPx}px`, marginTop: `${docNameSpacingPx}px`, textAlign: textAlign as any }}>{num === 1 ? (formData?.doc1Designation || 'Designation') : (formData?.doc2Designation || 'Designation')}</p>
        </div>
    );
    
    const renderQR = () => {
        if (!footerSettings?.showQrCode || footerSettings?.qrPlacement === 'header') return null;
        let displayText = footerSettings.qrText || "Scan to\nvalidate";
        if (displayText.toUpperCase().includes('DIGITAL COPY')) displayText = displayText.replace(/\s*DIGITAL COPY/i, '\nDIGITAL COPY');
        else if (displayText.toUpperCase().includes('SCAN TO VALIDATE')) displayText = displayText.replace(/SCAN TO VALIDATE/i, 'Scan to\nvalidate');
        
        return (
            <div key="qr" className="shrink-0 flex flex-col items-center justify-end gap-1 w-[64px]">
                {footerSettings.qrText !== 'None' && <span className="text-[8px] uppercase font-bold tracking-tight text-slate-500 text-center leading-[1.2] break-words w-full whitespace-pre-line">{displayText}</span>}
                <QRCodeSVG value="SMARTLAB PREVIEW" size={50} level="L" />
            </div>
        );
    };
    
    const renderBarcode = () => {
        if (!footerSettings?.showBarcode) return null;
        return (
            <div key="bar" className="shrink-0 flex flex-col items-center justify-end gap-1">
                {footerSettings.barcodeText === 'show_number' && <span className="text-[10px] font-mono font-bold tracking-widest text-slate-600">SL-123456789</span>}
                <div className="h-8 w-32 bg-slate-100 flex items-center justify-center border border-slate-300 text-[10px] tracking-widest font-mono text-slate-400">||| |||| || |||</div>
            </div>
        );
    };
    
    const renderPageNo = () => footerSettings?.showPageNumbers && <div key="page" className="font-bold text-[11px] text-slate-500 shrink-0 pb-1.5 flex flex-col justify-end">Page 1 of 1</div>;

    const renderFooterItems = () => {
        const style = footerSettings?.footerStyle || 'style1';
        const items = [];
        if (style === 'style1') items.push(renderQR(), renderBarcode(), renderSignature(1), renderSignature(2), renderPageNo());
        else if (style === 'style2') items.push(renderSignature(1), renderSignature(2), renderBarcode(), renderQR(), renderPageNo());
        else if (style === 'style3') items.push(renderSignature(1), renderQR(), renderBarcode(), renderSignature(2), renderPageNo());
        else items.push(renderQR(), renderBarcode(), renderSignature(1), renderSignature(2), renderPageNo());
        return items.filter(item => item !== null);
    };

    // --- DUMMY DATA FOR PREVIEW RESOLUTION ---
    const dummyPatient = {
        designation: 'Mr.',
        firstName: 'John',
        lastName: 'Doe',
        ageY: 35,
        gender: 'Male',
        patientId: 'SL-20260101-1234',
        uhid: 'UHID-9999',
        refDoctor: 'Self', // This tests the referral logic
        phone: '9876543210',
        email: 'john.doe@example.com',
        address: '123 Main Street',
        collectionAt: 'Lab'
    };
    
    const dummyBill = { billNumber: 'INV-123456' };
    const dummyDate = new Date().toLocaleDateString('en-GB');

    return (
        <div id="demo-report-content" className="relative bg-white shadow-xl shrink-0 mt-4 mb-4 overflow-hidden"
             style={{ 
                 width: `${paperWidth}px`, 
                 height: `${paperHeight}px`,
                 transform: 'scale(0.55)', 
                 transformOrigin: 'top center', 
                 marginBottom: `-${paperHeight * 0.45}px` 
             }}>
            
            {printHeaderFooter && activeImageBase64 ? (
                <img 
                    src={activeImageBase64} 
                    alt="Letterhead" 
                    className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none" 
                    style={{ objectFit: 'fill' }} 
                />
            ) : null}

            <div className={`absolute top-0 left-0 w-full h-full z-10 flex flex-col ${appliedFontClass}`} 
                 style={{ 
                     paddingTop: `${topPx}px`, 
                     paddingBottom: `${bottomPx + 85}px`,
                     paddingLeft: `${leftPx}px`, 
                     paddingRight: `${rightPx}px`, 
                     fontFamily: appliedCustomFont 
                 }}>
                
                {printHeaderFooter && !activeImageBase64 && (
                    <div className="text-center mb-6 shrink-0">
                        <h1 className="font-bold text-3xl text-[#9575cd] tracking-tight">{formData?.labName || 'SmartLab Diagnostics'}</h1>
                        {formData?.address && <p className="text-slate-600 mt-1 text-sm">{formData?.address}</p>}
                    </div>
                )}

                {/* --- HEADER --- */}
                <div className="mb-4 w-full shrink-0">
                    {previewRows.length > 0 ? (
                        <div className="flex w-full items-start">
                            <div className="flex-1">
                                {currentHeaderStyle === 'split' ? (
                                    <div className={`flex w-full justify-between gap-1.5 ${formData?.fontSize}`}>
                                        <table className="w-[49.5%] table-fixed" style={demoTableStyle}>
                                            <tbody>
                                                {previewRows.map((_, idx) => {
                                                    const field = leftColFields[idx];
                                                    const resolvedValue = field ? getFieldValue(field, dummyPatient, dummyBill, dummyDate, dummyDate) || '[ Data ]' : '';
                                                    return (
                                                        <tr key={`l-${idx}`}>
                                                            <td style={{ width: `${lLabelW}%`, ...demoTdStyle }} className={`px-2 break-words align-middle ${formData?.rowPadding} ${dynamicLabelClass}`}>{field ? (<div className="flex justify-between items-center gap-2"><span>{field.label}</span><span>:</span></div>) : ''}</td>
                                                            <td style={{ width: `${lDataW}%`, ...demoTdStyle }} className={`px-2 break-words align-middle ${formData?.rowPadding} ${dynamicDataClass}`}>{resolvedValue}</td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                        <table className="w-[49.5%] table-fixed" style={demoTableStyle}>
                                            <tbody>
                                                {previewRows.map((_, idx) => {
                                                    const field = rightColFields[idx];
                                                    const resolvedValue = field ? getFieldValue(field, dummyPatient, dummyBill, dummyDate, dummyDate) || '[ Data ]' : '';
                                                    return (
                                                        <tr key={`r-${idx}`}>
                                                            <td style={{ width: `${rLabelW}%`, ...demoTdStyle }} className={`px-2 break-words align-middle ${formData?.rowPadding} ${dynamicLabelClass}`}>{field ? (<div className="flex justify-between items-center gap-2"><span>{field.label}</span><span>:</span></div>) : ''}</td>
                                                            <td style={{ width: `${rDataW}%`, ...demoTdStyle }} className={`px-2 break-words align-middle ${formData?.rowPadding} ${dynamicDataClass}`}>{resolvedValue}</td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <table className={`w-full table-fixed ${formData?.fontSize}`} style={demoTableStyle}>
                                        <tbody>
                                            {previewRows.map((_, idx) => {
                                                const lField = leftColFields[idx];
                                                const rField = rightColFields[idx];
                                                const lVal = lField ? getFieldValue(lField, dummyPatient, dummyBill, dummyDate, dummyDate) || '[ Data ]' : '';
                                                const rVal = rField ? getFieldValue(rField, dummyPatient, dummyBill, dummyDate, dummyDate) || '[ Data ]' : '';
                                                return (
                                                    <tr key={idx}>
                                                        <td style={{ width: `${lLabelW / 2}%`, ...demoTdStyle }} className={`px-2 break-words align-middle ${formData?.rowPadding} ${dynamicLabelClass}`}>{lField ? (<div className="flex justify-between items-center gap-2"><span>{lField.label}</span><span>:</span></div>) : ''}</td>
                                                        <td style={{ width: `${lDataW / 2}%`, ...demoTdStyle }} className={`px-2 break-words align-middle ${formData?.rowPadding} ${dynamicDataClass}`}>{lVal}</td>
                                                        <td style={{ width: `${rLabelW / 2}%`, ...demoTdStyle }} className={`px-2 break-words align-middle ${formData?.rowPadding} ${dynamicLabelClass}`}>{rField ? (<div className="flex justify-between items-center gap-2"><span>{rField.label}</span><span>:</span></div>) : ''}</td>
                                                        <td style={{ width: `${rDataW / 2}%`, ...demoTdStyle }} className={`px-2 break-words align-middle ${formData?.rowPadding} ${dynamicDataClass}`}>{rVal}</td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 border-2 border-dashed border-slate-300/50 bg-white/50 text-center text-slate-400 text-xs">Demographics Table will appear here</div>
                    )}
                </div>

                {/* --- FLOWING BODY --- */}
                <div className={`w-full flex-grow flex flex-col overflow-hidden ${bodySettings?.bodyFontSize}`}>
                    
                    {bodySettings?.showDepartmentName !== false && (
                        <h3 className={`font-bold text-slate-600 uppercase mb-2 tracking-wide text-center ${bodySettings?.departmentNameSize}`}>Department of Pathology</h3>
                    )}
                    
                    {groupedDummyData.map((group, gIdx) => (
                        <div key={gIdx} className="mb-4">
                            {group.testName && (
                                <h2 className={`font-bold text-slate-800 mb-2 ${bodySettings?.testNameAlignment} ${bodySettings?.testNameSize} ${bodySettings?.testNameUnderline ? 'underline underline-offset-4' : ''}`}>
                                    {group.testName}
                                </h2>
                            )}
                            
                            <table className="w-full table-fixed" style={bodyTableStyle}>
                                <TableColGroup />
                                <thead>
                                    <tr>
                                        <th className={`${thClass} text-left pl-4`} style={thStyle}>Test Parameter</th>
                                        <th className={`${thClass} ${bodySettings?.bodyResultAlign}`} style={thStyle}>Result</th>
                                        {bodySettings?.showUnitCol && <th className={`${thClass} ${bodySettings?.bodyResultAlign}`} style={thStyle}>Units</th>}
                                        {bodySettings?.showRefRangeCol && <th className={`${thClass} ${bodySettings?.bodyResultAlign}`} style={thStyle}>Bio. Ref. Range</th>}
                                        {bodySettings?.showMethodCol && bodySettings?.methodDisplayStyle === 'column' && <th className={`${thClass} ${bodySettings?.bodyResultAlign}`} style={thStyle}>Method</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {group.items.map((row, i) => {
                                        if (row.isGroup) {
                                            return (
                                                <tr key={i} style={{ backgroundColor: '#ffffff' }}>
                                                    <td colSpan={totalCols} className={`font-bold ${bodySettings?.bodyColPadding} pt-2 pb-0.5 pl-4 uppercase tracking-wide ${bodySettings?.subheadingSize} break-words align-middle`} style={{ color: bodySettings?.subheadingColor, ...tdStyle }}>
                                                        {row.param}
                                                    </td>
                                                </tr>
                                            );
                                        }
                                        
                                        const rawHighlightSetting = bodySettings?.highlightAbnormalValues ?? bodySettings?.highlightAbnormal ?? formData?.highlightAbnormalValues ?? formData?.highlightAbnormal;
                                        const isHighlightEnabled = rawHighlightSetting === true || String(rawHighlightSetting).toLowerCase() === 'true' || rawHighlightSetting === 1 || String(rawHighlightSetting) === '1';
                                        const rowFlag = row.abnormal ?? row.isAbnormal ?? row.flag;
                                        const isRowAbnormal = rowFlag === true || String(rowFlag).toLowerCase() === 'true' || String(rowFlag).toUpperCase() === 'H' || String(rowFlag).toUpperCase() === 'L';
                                        const isAbnormal = isHighlightEnabled && isRowAbnormal;

                                        return (
                                            <tr key={i} style={{ backgroundColor: bodySettings?.stripedRows && i % 2 !== 0 ? '#f8fafc' : '#ffffff' }}>
                                                <td className={`${tdClass} text-black text-left pl-4`} style={tdStyle}>
                                                    <div className="font-medium">{row.param}</div>
                                                    {bodySettings?.showMethodCol && bodySettings?.methodDisplayStyle === 'beneath' && row.method && (
                                                        <div className="text-[0.85em] text-slate-700 mt-0.5">Method: {row.method}</div>
                                                    )}
                                                </td>
                                                <td className={`${tdClass} ${bodySettings?.bodyResultAlign} ${isAbnormal ? 'font-bold text-black' : 'text-black'}`} style={tdStyle}>
                                                    {row.result}{isAbnormal ? '*' : ''}
                                                </td>
                                                {bodySettings?.showUnitCol && <td className={`${tdClass} ${bodySettings?.bodyResultAlign} text-black`} style={tdStyle}>{row.unit}</td>}
                                                {bodySettings?.showRefRangeCol && <td className={`${tdClass} ${bodySettings?.bodyResultAlign} text-black`} style={tdStyle}>{row.ref}</td>}
                                                {bodySettings?.showMethodCol && bodySettings?.methodDisplayStyle === 'column' && <td className={`${tdClass} ${bodySettings?.bodyResultAlign} text-black text-[0.9em]`} style={tdStyle}>{row.method}</td>}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ))}

                    {bodySettings?.showEndOfReport !== false && (
                        <div className="text-center mt-6 text-[11px] text-slate-500 uppercase tracking-widest font-bold w-full">
                            *** End of Report ***
                        </div>
                    )}
                </div>
            </div>

            {/* --- 3. ABSOLUTE PINNED FOOTER --- */}
            <div className="absolute z-20 flex justify-between items-end"
                 style={{ 
                     bottom: `${bottomPx}px`, 
                     left: `${leftPx}px`, 
                     right: `${rightPx}px` 
                 }}>
                 {renderFooterItems()}
            </div>

        </div>
    );
}
// --- app/reports/components/PrintReportContent.tsx Block Close ---