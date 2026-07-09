import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { getFieldValue } from './reportUtils';

export default function ReportHeader({ reportSettings, realData, collectedDate, reportedDate, styles }: any) {
    const patient = realData?.patient || {};
    
    let leftFields: any[] = [];
    let rightFields: any[] = [];
    try {
        if (reportSettings?.leftColFields) leftFields = typeof reportSettings.leftColFields === 'string' ? JSON.parse(reportSettings.leftColFields) : reportSettings.leftColFields;
        if (reportSettings?.rightColFields) rightFields = typeof reportSettings.rightColFields === 'string' ? JSON.parse(reportSettings.rightColFields) : reportSettings.rightColFields;

        // --- INTERCEPT AND FIX OLD DATABASE LABELS ---
        const fixLabels = (arr: any[]) => arr.map(item => {
            if (item?.key === 'showReceivedDate') return { ...item, label: 'Received Date' };
            if (item?.key === 'showReportedDate') return { ...item, label: 'Reported Date' };
            return item;
        });

        leftFields = fixLabels(leftFields);
        rightFields = fixLabels(rightFields);
    } catch (e) { console.error("Error parsing header fields", e); }

    if (!leftFields || leftFields.length === 0) leftFields = [ 
        { key: 'showName', label: 'Patient Name' }, 
        { key: 'showAgeGender', label: 'Age & Gender' }, 
        { key: 'showPatientId', label: 'Patient ID' }, 
        { key: 'showRefDoc', label: 'Ref. Doctor' }
    ];
    if (!rightFields || rightFields.length === 0) rightFields = [ 
        { key: 'showBillNumber', label: 'Bill Number' }, 
        { key: 'showReceivedDate', label: 'Received Date' }, 
        { key: 'showReportedDate', label: 'Reported Date' } 
    ];

    // --- SMART HIDE LOGIC ---
    const filterEmptyReferrals = (fields: any[]) => {
        return fields.filter(f => {
            if (!f) return false;
            
            const k = f.key || '';
            if (k === 'showRefHospital' || k === 'showRefLab' || k === 'showRefDoc' || k === 'showReferringDoc' || k === 'showReferredBy' || k === 'refDoctor') {
                const val = getFieldValue(f, patient, realData, collectedDate, reportedDate);
                if (!val || String(val).trim() === '') return false; 
                if ((k === 'showRefHospital' || k === 'showRefLab') && String(val).toLowerCase() === 'self') return false; 
            }
            return true; 
        });
    };

    leftFields = filterEmptyReferrals(leftFields);
    rightFields = filterEmptyReferrals(rightFields);


    // 🚨 ABSOLUTE MATH LOCK: Keeps Label boundaries frozen on the PDF!
    const gapPercent = parseFloat(reportSettings?.headerColumnGap || "2");
    const blockWidth = 50 - (gapPercent / 2);

    const leftSplitNums = (reportSettings?.leftColWidth || "35 65").split(" ").map(Number);
    const rightSplitNums = (reportSettings?.rightColWidth || "35 65").split(" ").map(Number);

    const leftSplitL = leftSplitNums[0] || 35;
    const rightSplitL = rightSplitNums[0] || 35;

    // Locks the absolute width of the labels relative to a 50% block
    const absLeftLabelW = 50 * (leftSplitL / 100);
    const absRightLabelW = 50 * (rightSplitL / 100);

    const absLeftDataW = blockWidth - absLeftLabelW;
    const absRightDataW = blockWidth - absRightLabelW;

    // For Single Table Layout
    const singleLeftL = `${absLeftLabelW}%`;
    const singleLeftD = `${absLeftDataW}%`;
    const singleRightL = `${absRightLabelW}%`;
    const singleRightD = `${absRightDataW}%`;
    const gapW = `${gapPercent}%`;

    // For Split Table Layout
    const splitLeftL = `${(absLeftLabelW / blockWidth) * 100}%`;
    const splitLeftD = `${(absLeftDataW / blockWidth) * 100}%`;
    const splitRightL = `${(absRightLabelW / blockWidth) * 100}%`;
    const splitRightD = `${(absRightDataW / blockWidth) * 100}%`;

    let rowSpacing = 4; 
    if (reportSettings?.rowPadding === 'py-0.5') rowSpacing = 2; 
    if (reportSettings?.rowPadding === 'py-2.5') rowSpacing = 7; 

    const tableStyleType = reportSettings?.tableStyle || 'grid';
    
    let bw = 0.75;
    if (reportSettings?.gridLineThickness === '1.5') bw = 0.85;
    else if (reportSettings?.gridLineThickness === '1.75') bw = 1.0;
    else if (reportSettings?.gridLineThickness === '2.0' || reportSettings?.gridLineThickness === '2') bw = 1.25;
    else if (reportSettings?.gridLineThickness === '2.25') bw = 1.5;
    else if (reportSettings?.gridLineThickness === '4') bw = 2.0;

    const maxRows = Math.max(leftFields.length, rightFields.length);
    const previewRows = maxRows > 0 ? Array.from({ length: maxRows }) : [];

    const getTableContainerStyle = () => {
        let st: any = { flexDirection: 'column' };
        if (tableStyleType === 'grid' || tableStyleType === 'outer' || tableStyleType === 'split') {
            return { ...st, borderWidth: bw, borderColor: '#000000', borderStyle: 'solid' };
        }
        if (tableStyleType === 'horizontal') {
            return { ...st, borderTopWidth: bw, borderBottomWidth: bw, borderColor: '#000000', borderStyle: 'solid' };
        }
        return st;
    };

    const getCellStyle = (isLastRow: boolean, isLastCol: boolean) => {
        let st: any = { paddingLeft: 4, paddingRight: 4, paddingTop: rowSpacing, paddingBottom: rowSpacing, justifyContent: 'center', overflow: 'hidden' };
        if (tableStyleType === 'grid') {
            st.borderBottomWidth = isLastRow ? 0 : bw;
            st.borderRightWidth = isLastCol ? 0 : bw;
            st.borderColor = '#000000';
            st.borderStyle = 'solid';
        } else if (tableStyleType === 'horizontal') {
            st.borderBottomWidth = isLastRow ? 0 : bw;
            st.borderColor = '#000000';
            st.borderStyle = 'solid';
        }
        return st;
    };

    const renderLabelCell = (field: any, width: string, isLastRow: boolean, isLastCol: boolean) => {
        if (!field) return <View style={[getCellStyle(isLastRow, isLastCol), { width }]} />;
        const cleanLabel = field.label.replace(/\s*:\s*$/, '');
        return (
            <View style={[getCellStyle(isLastRow, isLastCol), { width, flexDirection: 'row', justifyContent: 'space-between' }]}>
                <Text style={styles.labelText}>{cleanLabel}</Text>
                <Text style={styles.colonText}>:</Text>
            </View>
        );
    };

    const renderDataCell = (field: any, width: string, isLastRow: boolean, isLastCol: boolean) => {
        if (!field) return <View style={[getCellStyle(isLastRow, isLastCol), { width }]} />;
        return (
            <View style={[getCellStyle(isLastRow, isLastCol), { width }]}>
                <Text style={styles.valText}>{getFieldValue(field, patient, realData, collectedDate, reportedDate) || ' '}</Text>
            </View>
        );
    };

    return (
        <View fixed style={{ marginBottom: 10 }}>
            {tableStyleType === 'split' ? (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={[getTableContainerStyle(), { width: `${blockWidth}%` }]}>
                        {previewRows.map((_, idx) => (
                            <View key={`l-${idx}`} style={{ flexDirection: 'row', width: '100%' }}>
                                {renderLabelCell(leftFields[idx], splitLeftL, idx === maxRows - 1, false)}
                                {renderDataCell(leftFields[idx], splitLeftD, idx === maxRows - 1, true)}
                            </View>
                        ))}
                    </View>
                    <View style={[getTableContainerStyle(), { width: `${blockWidth}%` }]}>
                        {previewRows.map((_, idx) => (
                            <View key={`r-${idx}`} style={{ flexDirection: 'row', width: '100%' }}>
                                {renderLabelCell(rightFields[idx], splitRightL, idx === maxRows - 1, false)}
                                {renderDataCell(rightFields[idx], splitRightD, idx === maxRows - 1, true)}
                            </View>
                        ))}
                    </View>
                </View>
            ) : (
                <View style={getTableContainerStyle()}>
                    {previewRows.map((_, idx) => (
                        <View key={`row-${idx}`} style={{ flexDirection: 'row', width: '100%' }}>
                            {renderLabelCell(leftFields[idx], singleLeftL, idx === maxRows - 1, false)}
                            {renderDataCell(leftFields[idx], singleLeftD, idx === maxRows - 1, false)}
                            
                            {/* Empty invisible column to force the Gap spacing in single-table formats */}
                            {gapPercent > 0 && (
                                <View style={[
                                    getCellStyle(idx === maxRows - 1, false), 
                                    { width: gapW, borderRightWidth: 0, borderTopWidth: 0, borderBottomWidth: 0 }
                                ]} />
                            )}

                            {renderLabelCell(rightFields[idx], singleRightL, idx === maxRows - 1, false)}
                            {renderDataCell(rightFields[idx], singleRightD, idx === maxRows - 1, true)}
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
}