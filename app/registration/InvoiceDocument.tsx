// FILE: app/components/InvoiceDocument.tsx
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { 
    padding: 40, 
    fontSize: 9, 
    fontFamily: 'Helvetica', 
    color: '#334155', 
    backgroundColor: '#ffffff' 
  },
  mainContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 2, 
    borderBottomColor: '#1e293b', 
    paddingBottom: 20,
    marginBottom: 20
  },
  brandColumn: { flexDirection: 'row', alignItems: 'center', width: '60%' },
  brandName: { 
    fontSize: 26, 
    fontWeight: 'black', 
    textTransform: 'uppercase', 
    color: '#0f172a', 
    lineHeight: 1
  },
  brandSub: { 
    fontSize: 9, 
    fontWeight: 'bold', 
    textTransform: 'uppercase', 
    color: '#64748b', 
    letterSpacing: 2, 
    marginTop: 4 
  },
  contactColumn: { width: '40%', alignItems: 'flex-end' },
  addressLine: { 
    fontSize: 9, 
    color: '#64748b', 
    marginBottom: 2, 
    textAlign: 'right' 
  },
  grid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  col: { width: '46%' },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    borderBottomWidth: 1, 
    borderBottomColor: '#f1f5f9', 
    paddingBottom: 3, 
    marginBottom: 3 
  },
  label: { 
    fontSize: 9, 
    color: '#64748b', 
    fontWeight: 'bold' 
  },
  value: { 
    fontSize: 9, 
    fontWeight: 'bold', 
    color: '#334155', 
    textAlign: 'right'
  },
  table: { width: '100%', marginBottom: 10 },
  tableHeader: { 
    flexDirection: 'row', 
    backgroundColor: '#1e293b', 
    paddingVertical: 8, 
    paddingHorizontal: 8,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2
  },
  th: { 
    fontSize: 9, 
    fontWeight: 'bold', 
    color: '#ffffff', 
    textTransform: 'uppercase' 
  },
  tableRow: { 
    flexDirection: 'row', 
    paddingVertical: 8, 
    paddingHorizontal: 8, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f1f5f9' 
  },
  col1: { width: '75%', textAlign: 'left' },
  col2: { width: '25%', textAlign: 'right' },
  td: { fontSize: 10, color: '#334155', fontWeight: 'medium' }, 
  tdAmount: { fontSize: 10, fontWeight: 'bold', color: '#1e293b' }, 
  totalsContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 10, 
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9' 
  },
  barcodeBox: { width: '50%', justifyContent: 'flex-end', paddingBottom: 5 },
  totalsBox: { width: '45%' },
  totalRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 6,
    paddingHorizontal: 2
  },
  netAmountRow: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#0f172a', 
    marginBottom: 8
  },
  badgeRow: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginBottom: 4
  },
  totalLabel: { fontSize: 9, color: '#64748b' }, 
  totalValue: { fontSize: 9, color: '#1e293b', fontWeight: 'bold' }, 
  netLabel: { fontSize: 11, fontWeight: 'bold', color: '#0f172a' }, 
  netValue: { fontSize: 11, fontWeight: 'bold', color: '#0f172a' },
  signatureBox: {
    alignSelf: 'flex-end',
    width: 140,
    textAlign: 'center',
    marginBottom: 40 
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#94a3b8', 
    borderBottomStyle: 'dashed',
    marginBottom: 4
  },
  signatureText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#475569', 
    textTransform: 'uppercase'
  },
  footer: { 
    position: 'absolute', 
    bottom: 30, 
    left: 40, 
    right: 40, 
    borderTopWidth: 1, 
    borderTopColor: '#e2e8f0', 
    paddingTop: 10 
  },
  termTitle: { fontSize: 8, fontWeight: 'bold', marginBottom: 2, color: '#334155' },
  termText: { fontSize: 7, color: '#64748b', marginBottom: 1 }
});

export interface InvoiceItem { id: number; name: string; price: number; }
export interface InvoiceData {
  billId: string; billDate: string; patientName: string; ageGender: string;
  referredBy: string; paymentType: string; items: InvoiceItem[];
  subTotal: number; discount: number; totalAmount: number;
  paidAmount: number; balanceDue: number;
  barcodeUrl?: string; qrUrl?: string; note?: string; noteImage?: string; 
  labProfile?: any;
}

export const InvoiceDocument = ({ data }: { data: InvoiceData }) => {
  const getCleanText = (html: string | undefined) => {
    if (!html) return '';
    let text = html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n');
    text = text.replace(/<[^>]+>/g, ''); 
    return text.trim();
  };
  const cleanNote = getCleanText(data.note);

  return (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.mainContainer}>

        {/* 1. DYNAMIC HEADER */}
        <View style={styles.headerContainer}>
            <View style={styles.brandColumn}>
                {data.labProfile?.logoUrl && (
                    <Image src={data.labProfile.logoUrl} style={{ width: 45, height: 45, marginRight: 12 }} />
                )}
                <View style={{ flexDirection: 'column' }}>
                    <Text style={styles.brandName}>{data.labProfile?.name || 'Smart Lab'}</Text>
                    <Text style={styles.brandSub}>{data.labProfile?.tagline || 'Pathology & Diagnostics'}</Text>
                </View>
            </View>
            <View style={styles.contactColumn}>
                {data.labProfile?.address ? (
                    <Text style={styles.addressLine}>{data.labProfile.address}</Text>
                ) : (
                    <>
                        <Text style={styles.addressLine}>123, Health Avenue, Medical District</Text>
                        <Text style={styles.addressLine}>City - 500010, State</Text>
                    </>
                )}
                <Text style={styles.addressLine}>Ph: {data.labProfile?.phone || '+91 98765 43210'}</Text>
            </View>
        </View>

        {/* 2. PATIENT GRID */}
        <View style={styles.grid}>
            <View style={styles.col}>
            <View style={styles.row}><Text style={styles.label}>Bill ID:</Text><Text style={styles.value}>{data.billId}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Patient:</Text><Text style={styles.value}>{data.patientName}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Age/Gender:</Text><Text style={styles.value}>{data.ageGender}</Text></View>
            </View>
            <View style={styles.col}>
            <View style={styles.row}><Text style={styles.label}>Date:</Text><Text style={styles.value}>{data.billDate}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Referred By:</Text><Text style={styles.value}>{data.referredBy}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Mode:</Text><Text style={styles.value}>{data.paymentType}</Text></View>
            </View>
        </View>

        {/* 3. ITEMS TABLE */}
        <View style={styles.table}>
            <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.col1]}>Test Description</Text>
            <Text style={[styles.th, styles.col2]}>Amount (Rs)</Text>
            </View>
            {data.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
                <Text style={[styles.td, styles.col1]}>{item.name}</Text>
                <Text style={[styles.tdAmount, styles.col2]}>{item.price.toFixed(2)}</Text>
            </View>
            ))}
        </View>

        {/* 4. FINANCIALS */}
        <View style={styles.totalsContainer}>
            
            {/* 🚨 FIX: Added QR Code container inside the Barcode Box */}
            <View style={styles.barcodeBox}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                    {data.barcodeUrl && (
                        <View style={{ alignItems: 'center', marginRight: 20 }}>
                            <Image src={data.barcodeUrl} style={{ width: 80, height: 20 }} />
                            {/* 🚨 FIX: Force only the last 4 digits beneath the barcode to match the HTML preview exactly! */}
                            <Text style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>{String(data.billId || '').slice(-4)}</Text>
                        </View>
                    )}
                    {data.qrUrl && (
                        <View style={{ alignItems: 'center' }}>
                            <View style={{ padding: 2, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 2 }}>
                                <Image src={data.qrUrl} style={{ width: 35, height: 35 }} />
                            </View>
                            <Text style={{ fontSize: 6, color: '#64748b', marginTop: 2, textTransform: 'uppercase' }}>Scan to Verify</Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.totalsBox}>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Sub Total</Text>
                    <Text style={styles.totalValue}>{data.subTotal.toFixed(2)}</Text>
                </View>
                {data.discount > 0 && (
                    <View style={styles.totalRow}>
                        <Text style={[styles.totalLabel, { color: '#ef4444' }]}>Discount</Text>
                        <Text style={[styles.totalValue, { color: '#ef4444' }]}>- {data.discount.toFixed(2)}</Text>
                    </View>
                )}
                <View style={styles.netAmountRow}>
                    <Text style={styles.netLabel}>Net Amount</Text>
                    <Text style={styles.netValue}>Rs. {data.totalAmount.toFixed(2)}</Text>
                </View>
                <View style={[styles.badgeRow, { backgroundColor: '#f0fdf4' }]}> 
                    <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#16a34a' }}>Paid Amount</Text>
                    <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#16a34a' }}>{data.paidAmount.toFixed(2)}</Text>
                </View>
                {data.balanceDue > 0 && (
                    <View style={[styles.badgeRow, { backgroundColor: '#fef2f2' }]}>
                        <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#dc2626' }}>Balance Due</Text>
                        <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#dc2626' }}>{data.balanceDue.toFixed(2)}</Text>
                    </View>
                )}
            </View>
        </View>

        {/* NOTE SECTION */}
        {data.noteImage ? (
            <View style={{ marginTop: 10, marginBottom: 10 }}>
                <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Note / Instructions:</Text>
                <Image src={data.noteImage} style={{ width: '100%' }} />
            </View>
        ) : cleanNote ? (
            <View style={{ marginTop: 10, marginBottom: 10, padding: 8, backgroundColor: '#f8fafc', borderRadius: 4, borderWidth: 1, borderColor: '#e2e8f0' }}>
                <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Note:</Text>
                <Text style={{ fontSize: 9, color: '#334155' }}>{cleanNote}</Text>
            </View>
        ) : null}

        <View style={{ flex: 1 }} />

        {/* 5. SIGNATURE */}
        <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureText}>Authorized Signatory</Text>
        </View>

      </View>

      {/* 6. FIXED FOOTER (Terms) */}
      <View style={styles.footer} fixed>
         <View>
            <Text style={styles.termTitle}>Terms & Conditions:</Text>
            <Text style={styles.termText}>1. Results are for clinical reference only.</Text>
            <Text style={styles.termText}>2. Please collect reports within 30 days.</Text>
            <Text style={styles.termText}>3. Valid only with authorized signature.</Text>
         </View>
      </View>

    </Page>
  </Document>
  );
};