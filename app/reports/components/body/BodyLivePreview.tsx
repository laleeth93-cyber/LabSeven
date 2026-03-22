// --- app/reports/components/body/BodyLivePreview.tsx Block Open ---
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface BodyLivePreviewProps {
    formData: any;
    leftColFields: any[];
    rightColFields: any[];
    bodySettings: any;
    footerSettings: any;
}

const dummyCBPData = [
    { isGroup: true, param: 'COMPLETE BLOOD COUNT' },
    { param: 'Haemoglobin (Hb)', result: '10.5', unit: 'g/dL', ref: '13.0 - 17.0', method: 'Cyanmethaemoglobin', abnormal: true },
    { param: 'RBC Count', result: '4.8', unit: 'millions/cumm', ref: '4.5 - 5.5', method: 'Electrical Impedance', abnormal: false },
    { param: 'PCV (Hematocrit)', result: '38', unit: '%', ref: '40 - 50', method: 'Calculated', abnormal: true },
    { param: 'Mean Corpuscular Vol (MCV)', result: '82', unit: 'fL', ref: '83 - 101', method: 'Calculated', abnormal: true },
    { param: 'MCH', result: '28', unit: 'pg', ref: '27 - 32', method: 'Calculated', abnormal: false },
    { param: 'MCHC', result: '33', unit: 'g/dL', ref: '31.5 - 34.5', method: 'Calculated', abnormal: false },
    { param: 'RDW - CV', result: '13.5', unit: '%', ref: '11.6 - 14.0', method: 'Calculated', abnormal: false },
    { isGroup: true, param: 'WHITE BLOOD CELLS' },
    { param: 'Total WBC Count', result: '7500', unit: 'cells/cumm', ref: '4000 - 10000', method: 'Electrical Impedance', abnormal: false },
    { isGroup: true, param: 'DIFFERENTIAL LEUKOCYTE COUNT (DLC)' },
    { param: 'Neutrophils', result: '65', unit: '%', ref: '40 - 80', method: 'VCS Technology', abnormal: false },
    { param: 'Lymphocytes', result: '28', unit: '%', ref: '20 - 40', method: 'VCS Technology', abnormal: false },
    { param: 'Eosinophils', result: '4', unit: '%', ref: '01 - 06', method: 'VCS Technology', abnormal: false },
    { param: 'Monocytes', result: '3', unit: '%', ref: '02 - 10', method: 'VCS Technology', abnormal: false },
    { param: 'Basophils', result: '0', unit: '%', ref: '00 - 02', method: 'VCS Technology', abnormal: false },
    { isGroup: true, param: 'PLATELETS' },
    { param: 'Platelet Count', result: '2.5', unit: 'lakhs/cumm', ref: '1.5 - 4.5', method: 'Electrical Impedance', abnormal: false },
    { isGroup: true, param: 'LIVER FUNCTION TEST (LFT)' },
    { param: 'Total Bilirubin', result: '1.2', unit: 'mg/dL', ref: '0.2 - 1.2', method: 'Diazo', abnormal: false },
    { param: 'Direct Bilirubin', result: '0.3', unit: 'mg/dL', ref: '0.0 - 0.3', method: 'Diazo', abnormal: false },
    { param: 'Indirect Bilirubin', result: '0.9', unit: 'mg/dL', ref: '0.2 - 0.9', method: 'Calculated', abnormal: false },
    { param: 'SGOT (AST)', result: '45', unit: 'U/L', ref: '5 - 40', method: 'IFCC', abnormal: true },
    { param: 'SGPT (ALT)', result: '50', unit: 'U/L', ref: '7 - 56', method: 'IFCC', abnormal: true },
    { param: 'Alkaline Phosphatase', result: '120', unit: 'U/L', ref: '44 - 147', method: 'PNPP', abnormal: false },
];

export default function BodyLivePreview({ formData, leftColFields, rightColFields, bodySettings, footerSettings }: BodyLivePreviewProps) {
    
    const activeStyle = (formData.letterheadStyle && formData.letterheadStyle.startsWith('custom')) ? formData.letterheadStyle : 'custom1';
    const currentMargins = formData.marginSettings?.[activeStyle] || { top: 120, bottom: 80, left: 40, right: 40 };
    const t = currentMargins.top; const b = currentMargins.bottom; const l = currentMargins.left; const r = currentMargins.right;

    const bw = bodySettings?.gridLineThickness === '2' ? '2px' : bodySettings?.gridLineThickness === '4' ? '3px' : '1px';
    const bColor = "black";

    const maxRows = Math.max(leftColFields.length, rightColFields.length);
    const previewRows = maxRows > 0 ? Array.from({ length: maxRows }) : [];
    const currentHeaderStyle = formData.tableStyle || 'grid';
    const dynamicLabelClass = `${formData.labelBold ? 'font-bold' : 'font-medium'} text-slate-800`;
    const dynamicDataClass = `${formData.dataBold ? 'font-bold' : 'font-medium'} text-slate-700`;
    const lSplit = (formData.leftColWidth || "35 65").split(' ');
    const rSplit = (formData.rightColWidth || "35 65").split(' ');
    const lLabelW = Number(lSplit[0]); const lDataW = Number(lSplit[1]);
    const rLabelW = Number(rSplit[0]); const rDataW = Number(rSplit[1]);
    
    let demoTableStyle: React.CSSProperties = { borderCollapse: 'collapse', borderSpacing: 0 };
    let demoTdStyle: React.CSSProperties = {};

    if (currentHeaderStyle === 'grid') {
        demoTableStyle = { borderCollapse: 'separate', borderSpacing: bw, backgroundColor: bColor, border: 'none' };
        demoTdStyle = { backgroundColor: '#ffffff', border: 'none' };
    } else if (currentHeaderStyle === 'horizontal') {
        demoTableStyle = { borderCollapse: 'collapse', borderTop: `${bw} solid ${bColor}`, borderBottom: `${bw} solid ${bColor}` };
        demoTdStyle = { borderBottom: `${bw} solid ${bColor}` };
    } else if (currentHeaderStyle === 'outer' || currentHeaderStyle === 'split') {
        demoTableStyle = { borderCollapse: 'collapse', border: `${bw} solid ${bColor}` };
    }

    const isTailwindFont = bodySettings.bodyFontFamily.startsWith('font-');
    const appliedFontClass = isTailwindFont ? bodySettings.bodyFontFamily : '';
    const appliedCustomFont = !isTailwindFont ? bodySettings.bodyFontFamily : undefined;
    
    let bodyTableStyle: React.CSSProperties = { borderCollapse: 'collapse', borderSpacing: 0 };
    let thStyle: React.CSSProperties = { backgroundColor: bodySettings.bodyHeaderBgColor || '#ffffff', color: bodySettings.bodyHeaderTextColor || '#000000' };
    let tdStyle: React.CSSProperties = {};

    if (bodySettings.bodyTableStyle === 'grid') {
        bodyTableStyle = { borderCollapse: 'separate', borderSpacing: bw, backgroundColor: bColor, border: 'none' };
        thStyle = { ...thStyle, border: 'none' };
        tdStyle = { border: 'none' };
    } else if (bodySettings.bodyTableStyle === 'horizontal') {
        bodyTableStyle = { borderCollapse: 'collapse', borderTop: `${bw} solid ${bColor}`, borderBottom: `${bw} solid ${bColor}` };
        thStyle = { ...thStyle, borderBottom: `${bw} solid ${bColor}` };
        tdStyle = { borderBottom: `${bw} solid ${bColor}` };
    } else if (bodySettings.bodyTableStyle === 'outer') {
        bodyTableStyle = { borderCollapse: 'collapse', border: `${bw} solid ${bColor}` };
    }

    const hFont = bodySettings.headerFontSize || 'text-xs';
    const hWeight = bodySettings.headerFontWeight || 'font-bold';
    const hPad = bodySettings.headerRowHeight || 'py-1.5';
    const thClass = `${hPad} ${bodySettings.bodyColPadding || 'px-2'} ${hFont} ${hWeight} break-words align-middle`;
    const tdClass = `${bodySettings.bodyRowHeight || 'py-1.5'} ${bodySettings.bodyColPadding || 'px-2'} break-words align-top`;

    let totalCols = 2; 
    if (bodySettings.showUnitCol) totalCols++;
    if (bodySettings.showRefRangeCol) totalCols++;
    if (bodySettings.showMethodCol && bodySettings.methodDisplayStyle === 'column') totalCols++;

    const TableColGroup = () => {
        
        // 100% SAFEGUARD VALIDATION
        const pW = parseFloat(bodySettings.colWidthParam) || 0;
        const rW = parseFloat(bodySettings.colWidthResult) || 0;
        const uW = bodySettings.showUnitCol ? (parseFloat(bodySettings.colWidthUnit) || 0) : 0;
        const refW = bodySettings.showRefRangeCol ? (parseFloat(bodySettings.colWidthRef) || 0) : 0;
        const mW = (bodySettings.showMethodCol && bodySettings.methodDisplayStyle === 'column') ? (parseFloat(bodySettings.colWidthMethod) || 0) : 0;
        
        const isCustomValid = (pW + rW + uW + refW + mW) === 100;

        const defParam = totalCols === 5 ? '40%' : totalCols === 4 ? '40%' : totalCols === 3 ? '50%' : '70%';
        const defRem = totalCols === 5 ? '15%' : totalCols === 4 ? '20%' : totalCols === 3 ? '25%' : '30%';

        return (
            <colgroup>
                <col style={{ width: isCustomValid ? `${pW}%` : defParam }} />
                <col style={{ width: isCustomValid ? `${rW}%` : defRem }} />
                {bodySettings.showUnitCol && <col style={{ width: isCustomValid ? `${uW}%` : defRem }} />}
                {bodySettings.showRefRangeCol && <col style={{ width: isCustomValid ? `${refW}%` : defRem }} />}
                {bodySettings.showMethodCol && bodySettings.methodDisplayStyle === 'column' && <col style={{ width: isCustomValid ? `${mW}%` : defRem }} />}
            </colgroup>
        );
    };

    const FIRST_PAGE_LIMIT = 11;
    const SUBSEQUENT_PAGE_LIMIT = 18;
    const pages: any[][] = [];
    let currentChunk: any[] = [];
    
    dummyCBPData.forEach((row, i) => {
        currentChunk.push(row);
        const currentLimit = pages.length === 0 ? FIRST_PAGE_LIMIT : SUBSEQUENT_PAGE_LIMIT;
        if (currentChunk.length === currentLimit || i === dummyCBPData.length - 1) {
            pages.push(currentChunk);
            currentChunk = [];
        }
    });

    const renderSignature = (num: number) => (
        <div key={`sig${num}`} className="text-center w-32 shrink-0">
            <div className="h-10 border-b border-dashed border-slate-300 w-full mb-1 mx-auto"></div>
            <p className="font-bold text-slate-800 text-xs">{num === 1 ? (formData.doc1Name || 'Dr. Signature 1') : (formData.doc2Name || 'Dr. Signature 2')}</p>
            <p className="text-slate-500 text-[10px] mt-0.5">{num === 1 ? (formData.doc1Designation || 'Designation') : (formData.doc2Designation || 'Designation')}</p>
        </div>
    );

    const renderQR = () => {
        if (!footerSettings.showQrCode || footerSettings.qrPlacement === 'header') return null;
        return (
            <div key="qr" className="shrink-0 flex flex-col items-center justify-end gap-1 w-[64px]">
                {footerSettings.qrText !== 'None' && (
                    <span className="text-[8px] uppercase font-bold tracking-tight text-slate-500 text-center leading-[1.2] break-words w-full">
                        {footerSettings.qrText || 'Scan to validate'}
                    </span>
                )}
                <QRCodeSVG value="SMARTLAB" size={64} level="L" />
            </div>
        );
    };

    const renderBarcode = () => {
        if (!footerSettings.showBarcode) return null;
        return (
            <div key="bar" className="shrink-0 flex flex-col items-center justify-end gap-1">
                {footerSettings.barcodeText === 'show_number' && (
                    <span className="text-[10px] font-mono font-bold tracking-widest text-slate-600">SL-123456789</span>
                )}
                <div className="h-8 w-32 bg-slate-100 flex items-center justify-center border border-slate-300 text-[10px] tracking-widest font-mono text-slate-400">
                    ||| |||| || |||
                </div>
            </div>
        );
    };

    const renderPageNo = (pageIndex: number, totalPages: number) => {
        if (!footerSettings.showPageNumbers) return null;
        return (
            <div key="page" className="font-bold text-[11px] text-slate-500 shrink-0 pb-1.5">
                Page {pageIndex + 1} of {totalPages}
            </div>
        );
    };

    const renderFooterItems = (pageIndex: number, totalPages: number) => {
        const style = footerSettings.footerStyle || 'style1';
        const items = [];
        if (style === 'style1') items.push(renderQR(), renderBarcode(), renderSignature(1), renderSignature(2), renderPageNo(pageIndex, totalPages));
        else if (style === 'style2') items.push(renderSignature(1), renderSignature(2), renderBarcode(), renderQR(), renderPageNo(pageIndex, totalPages));
        else if (style === 'style3') items.push(renderSignature(1), renderQR(), renderBarcode(), renderSignature(2), renderPageNo(pageIndex, totalPages));
        else items.push(renderQR(), renderBarcode(), renderSignature(1), renderSignature(2), renderPageNo(pageIndex, totalPages));

        return items.filter(item => item !== null);
    };

    return (
        <div className="w-full bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col overflow-hidden">
            <div className="border-b border-slate-100 pb-3 mb-4 shrink-0 flex justify-between items-end">
                <div>
                    <h3 className="font-bold text-slate-800 text-sm">Full Report Canvas Preview</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Visualizes layout, fonts, and A4 page breaks.</p>
                </div>
                <div className="text-[10px] font-bold text-[#9575cd] bg-purple-50 px-2 py-1 rounded">
                    {pages.length} Pages Generated
                </div>
            </div>
            
            <div className="flex-1 overflow-auto bg-slate-200/50 p-6 rounded-xl border border-slate-200 flex flex-col items-center gap-8 custom-scrollbar">
                {pages.map((pageData, pageIndex) => (
                    <div 
                        key={pageIndex} 
                        className="w-full max-w-[794px] min-w-[700px] shrink-0 bg-white shadow-md border border-slate-300 min-h-[1122px] flex flex-col relative font-sans text-xs transition-all hover:shadow-xl"
                        style={{
                            paddingTop: `${t}px`,
                            paddingBottom: `${b}px`,
                            paddingLeft: `${l}px`,
                            paddingRight: `${r}px`
                        }}
                    >
                        
                        <div className="text-center mb-4 shrink-0">
                            <h1 className="font-bold text-2xl text-[#9575cd]">{formData.labName || 'SmartLab Diagnostics'}</h1>
                            {formData.address && <p className="text-slate-600 mt-0.5">{formData.address}</p>}
                        </div>

                        {pageIndex === 0 && (
                            <div className="mb-4 w-full opacity-90 shrink-0">
                                {previewRows.length > 0 ? (
                                    <div className="flex w-full items-start">
                                        <div className="flex-1">
                                            {currentHeaderStyle === 'split' ? (
                                                <div className={`flex w-full justify-between gap-3 ${formData.fontFamily} ${formData.fontSize}`}>
                                                    <table className="w-[49%] table-fixed" style={demoTableStyle}>
                                                        <tbody>
                                                            {previewRows.map((_, idx) => (
                                                                <tr key={`l-${idx}`}>
                                                                    <td style={{ width: `${lLabelW}%`, ...demoTdStyle }} className={`px-2 break-words align-middle ${formData.rowPadding} ${dynamicLabelClass}`}>{leftColFields[idx] ? (<div className="flex justify-between items-center gap-2"><span>{leftColFields[idx].label}</span><span>:</span></div>) : ''}</td>
                                                                    <td style={{ width: `${lDataW}%`, ...demoTdStyle }} className={`px-2 break-words align-middle ${formData.rowPadding} ${dynamicDataClass}`}>{leftColFields[idx] ? '[ Data ]' : ''}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                    <table className="w-[49%] table-fixed" style={demoTableStyle}>
                                                        <tbody>
                                                            {previewRows.map((_, idx) => (
                                                                <tr key={`r-${idx}`}>
                                                                    <td style={{ width: `${rLabelW}%`, ...demoTdStyle }} className={`px-2 break-words align-middle ${formData.rowPadding} ${dynamicLabelClass}`}>{rightColFields[idx] ? (<div className="flex justify-between items-center gap-2"><span>{rightColFields[idx].label}</span><span>:</span></div>) : ''}</td>
                                                                    <td style={{ width: `${rDataW}%`, ...demoTdStyle }} className={`px-2 break-words align-middle ${formData.rowPadding} ${dynamicDataClass}`}>{rightColFields[idx] ? '[ Data ]' : ''}</td>
                                                                    {footerSettings?.showQrCode && footerSettings?.qrPlacement === 'header' && idx === 0 && (
                                                                        <td rowSpan={maxRows} className="w-[80px] text-center align-middle p-2" style={{ ...demoTdStyle, borderLeft: currentHeaderStyle === 'horizontal' || currentHeaderStyle === 'outer' ? `${bw} solid ${bColor}` : undefined }}>
                                                                            <div className="flex flex-col items-center justify-center gap-1 w-[64px] mx-auto">
                                                                                {footerSettings.qrText !== 'None' && (
                                                                                    <span className="text-[8px] uppercase font-bold tracking-tight text-slate-500 text-center leading-[1.2] break-words w-full">
                                                                                        {footerSettings.qrText || 'Scan to validate'}
                                                                                </span>
                                                                                )}
                                                                                <QRCodeSVG value="SMARTLAB" size={64} level="L" />
                                                                            </div>
                                                                        </td>
                                                                    )}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <table className={`w-full table-fixed ${formData.fontFamily} ${formData.fontSize}`} style={demoTableStyle}>
                                                    <tbody>
                                                        {previewRows.map((_, idx) => (
                                                            <tr key={idx}>
                                                                <td style={{ width: `${lLabelW / 2}%`, ...demoTdStyle }} className={`px-2 break-words align-middle ${formData.rowPadding} ${dynamicLabelClass}`}>{leftColFields[idx] ? (<div className="flex justify-between items-center gap-2"><span>{leftColFields[idx].label}</span><span>:</span></div>) : ''}</td>
                                                                <td style={{ width: `${lDataW / 2}%`, ...demoTdStyle }} className={`px-2 break-words align-middle ${formData.rowPadding} ${dynamicDataClass}`}>{leftColFields[idx] ? '[ Data ]' : ''}</td>
                                                                <td style={{ width: `${rLabelW / 2}%`, ...demoTdStyle }} className={`px-2 break-words align-middle ${formData.rowPadding} ${dynamicLabelClass}`}>{rightColFields[idx] ? (<div className="flex justify-between items-center gap-2"><span>{rightColFields[idx].label}</span><span>:</span></div>) : ''}</td>
                                                                <td style={{ width: `${rDataW / 2}%`, ...demoTdStyle }} className={`px-2 break-words align-middle ${formData.rowPadding} ${dynamicDataClass}`}>{rightColFields[idx] ? '[ Data ]' : ''}</td>
                                                                
                                                                {footerSettings?.showQrCode && footerSettings?.qrPlacement === 'header' && idx === 0 && (
                                                                    <td rowSpan={maxRows} className={`w-[80px] text-center align-middle p-2`} style={{ ...demoTdStyle, borderLeft: currentHeaderStyle === 'horizontal' || currentHeaderStyle === 'outer' ? `${bw} solid ${bColor}` : undefined }}>
                                                                        <div className="flex flex-col items-center justify-center gap-1 w-[64px] mx-auto">
                                                                            {footerSettings.qrText !== 'None' && (
                                                                                <span className="text-[8px] uppercase font-bold tracking-tight text-slate-500 text-center leading-[1.2] break-words w-full">
                                                                                    {footerSettings.qrText || 'Scan to validate'}
                                                                                </span>
                                                                            )}
                                                                            <QRCodeSVG value="SMARTLAB" size={64} level="L" />
                                                                        </div>
                                                                    </td>
                                                                )}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-3 border border-dashed border-slate-300 text-center text-slate-400">Header Demographics</div>
                                )}
                            </div>
                        )}

                        <div className={`flex-1 flex flex-col pb-8 ${appliedFontClass} ${bodySettings.bodyFontSize}`} style={{ fontFamily: appliedCustomFont }}>
                            {bodySettings.showDepartmentName && (
                                <h3 className={`font-bold text-slate-600 uppercase mb-1 tracking-wide text-center ${bodySettings.departmentNameSize}`}>Department of Pathology</h3>
                            )}
                            <h2 className={`font-bold text-slate-800 mb-3 ${bodySettings.testNameAlignment} ${bodySettings.testNameSize} ${bodySettings.testNameUnderline ? 'underline underline-offset-4' : ''}`}>
                                Master Health Profile {pageIndex > 0 ? '(Continued)' : ''}
                            </h2>
                            
                            <table className="w-full table-fixed" style={bodyTableStyle}>
                                <TableColGroup />
                                <thead>
                                    <tr>
                                        <th className={`${thClass} text-left`} style={thStyle}>Test Parameter</th>
                                        <th className={`${thClass} ${bodySettings.bodyResultAlign}`} style={thStyle}>Result</th>
                                        {bodySettings.showUnitCol && <th className={`${thClass} ${bodySettings.bodyResultAlign}`} style={thStyle}>Units</th>}
                                        {bodySettings.showRefRangeCol && <th className={`${thClass} ${bodySettings.bodyResultAlign}`} style={thStyle}>Bio. Ref. Range</th>}
                                        {bodySettings.showMethodCol && bodySettings.methodDisplayStyle === 'column' && (
                                            <th className={`${thClass} ${bodySettings.bodyResultAlign}`} style={thStyle}>Method</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {pageData.map((row, i) => {
                                        if (row.isGroup) {
                                            return (
                                                <tr key={i} style={{ backgroundColor: '#ffffff' }}>
                                                    <td colSpan={totalCols} className={`font-bold ${bodySettings.bodyColPadding} pt-2 pb-0.5 uppercase tracking-wide ${bodySettings.subheadingSize} break-words align-middle`} style={{ color: bodySettings.subheadingColor, ...tdStyle }}>{row.param}</td>
                                                </tr>
                                            );
                                        }
                                        return (
                                            <tr key={i} style={{ backgroundColor: bodySettings.stripedRows && i % 2 !== 0 ? '#f8fafc' : '#ffffff' }}>
                                                <td className={`${tdClass} text-black text-left pl-4`} style={tdStyle}>
                                                    <div className="font-medium">{row.param}</div>
                                                    {bodySettings.showMethodCol && bodySettings.methodDisplayStyle === 'beneath' && (<div className="text-[0.85em] text-black mt-0.5">Method: {row.method}</div>)}
                                                </td>
                                                <td className={`${tdClass} ${bodySettings.bodyResultAlign} ${bodySettings.highlightAbnormal && row.abnormal ? 'font-bold text-black' : 'text-black'}`} style={tdStyle}>{row.result} {bodySettings.highlightAbnormal && row.abnormal && '*'}</td>
                                                {bodySettings.showUnitCol && <td className={`${tdClass} ${bodySettings.bodyResultAlign} text-black`} style={tdStyle}>{row.unit}</td>}
                                                {bodySettings.showRefRangeCol && <td className={`${tdClass} ${bodySettings.bodyResultAlign} text-black`} style={tdStyle}>{row.ref}</td>}
                                                {bodySettings.showMethodCol && bodySettings.methodDisplayStyle === 'column' && <td className={`${tdClass} ${bodySettings.bodyResultAlign} text-black text-[0.9em]`} style={tdStyle}>{row.method}</td>}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {pageIndex === pages.length - 1 && (
                                <>
                                    <div className="mt-6 text-slate-800 text-[0.95em]">
                                        <h4 className="font-bold mb-1 underline underline-offset-2">Interpretation / Remarks:</h4>
                                        <p className="leading-snug"><strong>Mild Anemia:</strong> Haemoglobin and PCV are slightly below the biological reference interval. Clinical correlation is recommended.<br/><strong>Liver Function:</strong> Transaminases (SGOT/SGPT) are slightly elevated indicating mild hepatic stress.</p>
                                    </div>
                                    {footerSettings.showEndOfReport && (
                                        <div className="mt-12 text-center font-bold text-slate-400 uppercase tracking-widest text-[0.85em]">*** End of Report ***</div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="mt-auto shrink-0 w-full pt-4 opacity-80 pointer-events-none">
                            <div className="flex justify-between items-end w-full border-t border-slate-300 pt-6 mt-4">
                                {renderFooterItems(pageIndex, pages.length)}
                            </div>
                        </div>

                    </div>
                ))}
            </div>
        </div>
    );
}
// --- app/reports/components/body/BodyLivePreview.tsx Block Close ---