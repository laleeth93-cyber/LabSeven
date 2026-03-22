// --- BLOCK app/list/components/report-pdf/ReportFooter.tsx OPEN ---
import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';

export default function ReportFooter({ reportSettings, realData, qrDataUrl, barcodeUrl, styles }: any) {
    
    // Dynamic Signature Styles
    const sigSize = reportSettings?.sigSize || 40;
    const sigSpacing = reportSettings?.sigSpacing ?? 4;
    const docNameSize = reportSettings?.docNameSize || 10;
    const docDesigSize = reportSettings?.docDesigSize || 8;
    const docNameSpacing = reportSettings?.docNameSpacing ?? 2;
    
    const rawAlign = reportSettings?.sigAlignment || 'center';
    let textAlign = 'center';
    if (rawAlign === 'flex-start') textAlign = 'left';
    if (rawAlign === 'flex-end') textAlign = 'right';

    const dynamicStyles = StyleSheet.create({
        sigImage: { height: sigSize, width: 120, objectFit: 'contain', marginBottom: 0 },
        sigEmpty: { height: sigSize, width: 120, marginBottom: 0 },
        docName: { fontSize: docNameSize, fontFamily: styles.docName.fontFamily, color: '#0f172a', textAlign: textAlign as any, width: '100%', marginTop: sigSpacing },
        docDesig: { fontSize: docDesigSize, color: '#475569', marginTop: docNameSpacing, fontFamily: styles.docDesig.fontFamily, textAlign: textAlign as any, width: '100%' },
        sigBlockWrapper: { alignItems: rawAlign as any, justifyContent: 'flex-end', width: 120 }
    });

    // EXTRACT ONLY THE LAST 4 DIGITS FOR THE BARCODE TEXT
    const shortBarcodeText = String(realData?.billNumber || '').slice(-4);

    const renderQRBlock = () => {
        if (reportSettings?.showQrCode === false || reportSettings?.qrPlacement === 'header' || !qrDataUrl) return null;
        let displayText = reportSettings?.qrText || 'Scan to\nvalidate';
        if (displayText.toUpperCase().includes('DIGITAL COPY')) displayText = displayText.replace(/\s*DIGITAL COPY/i, '\nDIGITAL COPY');
        else if (displayText.toUpperCase().includes('SCAN TO VALIDATE')) displayText = displayText.replace(/SCAN TO VALIDATE/i, 'Scan to\nvalidate');

        return (
            <View style={styles.qrBlock} key="qr">
                {reportSettings?.qrText !== 'None' && <Text style={styles.qrText}>{displayText}</Text>}
                <Image src={qrDataUrl} style={{ width: 45, height: 45 }} />
            </View>
        );
    };

    const renderBarcodeBlock = () => {
        if (reportSettings?.showBarcode === false || !barcodeUrl) return null;
        return (
            <View style={styles.barcodeBlock} key="barcode">
                {/* USE shortBarcodeText INSTEAD OF THE FULL BILL NUMBER */}
                {reportSettings?.barcodeText === 'show_number' && (
                    <Text style={{ fontSize: 9, fontFamily: 'Courier', fontWeight: 'bold', marginBottom: 2 }}>
                        {shortBarcodeText}
                    </Text>
                )}
                <Image src={barcodeUrl} style={{ width: 100, height: 26 }} />
            </View>
        );
    };

    const renderSig1Block = () => {
        return (
            <View style={dynamicStyles.sigBlockWrapper} key="sig1">
                {reportSettings?.doc1SignUrl ? (
                    <Image src={reportSettings.doc1SignUrl} style={dynamicStyles.sigImage} />
                ) : (
                    <View style={dynamicStyles.sigEmpty} />
                )}
                
                <View style={{ width: '100%', height: 1, backgroundColor: '#333', marginBottom: 0 }} />
                
                <Text style={dynamicStyles.docName}>{reportSettings?.doc1Name || 'Authorized Signatory'}</Text>
                {reportSettings?.doc1Designation && (
                    <Text style={dynamicStyles.docDesig}>{reportSettings?.doc1Designation}</Text>
                )}
            </View>
        );
    };

    const renderSig2Block = () => {
        const name1 = (reportSettings?.doc1Name || '').trim();
        const name2 = (reportSettings?.doc2Name || '').trim();
        const url2 = (reportSettings?.doc2SignUrl || '').trim();

        if (!name2 && !url2) return null;
        if (name1 && name2 && name1 === name2) return null;

        return (
            <View style={dynamicStyles.sigBlockWrapper} key="sig2">
                {url2 ? (
                    <Image src={url2} style={dynamicStyles.sigImage} />
                ) : (
                    <View style={dynamicStyles.sigEmpty} />
                )}

                <View style={{ width: '100%', height: 1, backgroundColor: '#333', marginBottom: 0 }} />

                <Text style={dynamicStyles.docName}>{reportSettings?.doc2Name}</Text>
                {reportSettings?.doc2Designation && (
                    <Text style={dynamicStyles.docDesig}>{reportSettings?.doc2Designation}</Text>
                )}
            </View>
        );
    };

    const renderPageNoBlock = () => {
        if (reportSettings?.showPageNumbers === false) return null;
        return (
            <View key="pageno" style={styles.pageNumberBlock}>
                <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (`Page ${pageNumber} of ${totalPages}`)} fixed />
            </View>
        );
    };

    const buildFooterElements = () => {
        const style = reportSettings?.footerStyle || 'style1';
        const items = [];
        if (style === 'style1') items.push(renderQRBlock(), renderBarcodeBlock(), renderSig1Block(), renderSig2Block(), renderPageNoBlock());
        else if (style === 'style2') items.push(renderSig1Block(), renderSig2Block(), renderBarcodeBlock(), renderQRBlock(), renderPageNoBlock());
        else if (style === 'style3') items.push(renderSig1Block(), renderQRBlock(), renderBarcodeBlock(), renderSig2Block(), renderPageNoBlock());
        else items.push(renderQRBlock(), renderBarcodeBlock(), renderSig1Block(), renderSig2Block(), renderPageNoBlock());
        return items.filter(item => item !== null);
    };

    return (
        <View fixed style={styles.footer}>
            {buildFooterElements()}
        </View>
    );
}
// --- BLOCK app/list/components/report-pdf/ReportFooter.tsx CLOSE ---