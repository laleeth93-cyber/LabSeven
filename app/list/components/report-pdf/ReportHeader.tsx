// --- app/list/components/report-pdf/ReportHeader.tsx Block Open ---
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
        // ---------------------------------------------

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
                
                // If it is completely empty, ALWAYS hide it so labels don't print blank.
                if (!val || String(val).trim() === '') {
                    return false; 
                }
                
                // Also hide Hospital/Lab if they somehow equal 'self' (only Doc should say Self)
                if ((k === 'showRefHospital' || k === 'showRefLab') && String(val).toLowerCase() === 'self') {
                    return false; 
                }
            }
            return true; // Keep everything else
        });
    };

    leftFields = filterEmptyReferrals(leftFields);
    rightFields = filterEmptyReferrals(rightFields);
    // ------------------------

    const leftSplit = (reportSettings?.leftColWidth || "35 65").split(" ");
    const rightSplit = (reportSettings?.rightColWidth || "35 65").split(" ");

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
        let st: any = { paddingLeft: 4, paddingRight: 4, paddingTop: rowSpacing, paddingBottom: rowSpacing, justifyContent: 'center' };
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
                    <View style={[getTableContainerStyle(), { width: '49%' }]}>
                        {previewRows.map((_, idx) => (
                            <View key={`l-${idx}`} style={{ flexDirection: 'row', width: '100%' }}>
                                {renderLabelCell(leftFields[idx], `${leftSplit[0]}%`, idx === maxRows - 1, false)}
                                {renderDataCell(leftFields[idx], `${leftSplit[1]}%`, idx === maxRows - 1, true)}
                            </View>
                        ))}
                    </View>
                    <View style={[getTableContainerStyle(), { width: '49%' }]}>
                        {previewRows.map((_, idx) => (
                            <View key={`r-${idx}`} style={{ flexDirection: 'row', width: '100%' }}>
                                {renderLabelCell(rightFields[idx], `${rightSplit[0]}%`, idx === maxRows - 1, false)}
                                {renderDataCell(rightFields[idx], `${rightSplit[1]}%`, idx === maxRows - 1, true)}
                            </View>
                        ))}
                    </View>
                </View>
            ) : (
                <View style={getTableContainerStyle()}>
                    {previewRows.map((_, idx) => (
                        <View key={`row-${idx}`} style={{ flexDirection: 'row', width: '100%' }}>
                            {renderLabelCell(leftFields[idx], `${Number(leftSplit[0]) / 2}%`, idx === maxRows - 1, false)}
                            {renderDataCell(leftFields[idx], `${Number(leftSplit[1]) / 2}%`, idx === maxRows - 1, false)}
                            {renderLabelCell(rightFields[idx], `${Number(rightSplit[0]) / 2}%`, idx === maxRows - 1, false)}
                            {renderDataCell(rightFields[idx], `${Number(rightSplit[1]) / 2}%`, idx === maxRows - 1, true)}
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
}
// --- app/list/components/report-pdf/ReportHeader.tsx Block Close ---