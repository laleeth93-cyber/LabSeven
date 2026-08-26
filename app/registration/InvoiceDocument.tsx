import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { fontSize: 9, fontFamily: 'Helvetica', color: '#334155', backgroundColor: '#ffffff' },
  mainContainer: { flex: 1, flexDirection: 'column' },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 2, borderBottomColor: '#0f172a', paddingBottom: 16, marginBottom: 20 },
  brandColumn: { flexDirection: 'row', alignItems: 'center', width: '60%' },
  brandName: { fontSize: 24, fontWeight: 'black', textTransform: 'uppercase', color: '#0f172a', lineHeight: 1 },
  brandSub: { fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase', color: '#64748b', letterSpacing: 2, marginTop: 4 },
  contactColumn: { width: '40%', alignItems: 'flex-end' },
  addressLine: { fontSize: 8, color: '#64748b', marginBottom: 2, textAlign: 'right' },
  grid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  col: { width: '48%' },
  row: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 4, marginBottom: 4 },
  label: { fontSize: 9, color: '#64748b', fontWeight: 'bold' },
  value: { fontSize: 9, fontWeight: 'bold', color: '#334155', textAlign: 'right' },
  table: { width: '100%', marginBottom: 15 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1e293b', paddingVertical: 6, paddingHorizontal: 8, borderRadius: 2 },
  th: { fontSize: 9, fontWeight: 'bold', color: '#ffffff', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  col1: { width: '75%', textAlign: 'left' },
  col2: { width: '25%', textAlign: 'right' },
  td: { fontSize: 10, color: '#334155', fontWeight: 'medium' }, 
  tdAmount: { fontSize: 10, fontWeight: 'bold', color: '#1e293b' }, 
  totalsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  barcodeBox: { width: '50%', flexDirection: 'row', alignItems: 'flex-end', gap: 15, paddingBottom: 5 },
  totalsBox: { width: '45%' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, paddingHorizontal: 2 },
  netAmountRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#0f172a', marginBottom: 6 },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, paddingHorizontal: 6, borderRadius: 4, marginBottom: 4 },
  totalLabel: { fontSize: 9, color: '#64748b' }, 
  totalValue: { fontSize: 9, color: '#1e293b', fontWeight: 'bold' }, 
  netLabel: { fontSize: 10, fontWeight: 'bold', color: '#0f172a' }, 
  netValue: { fontSize: 10, fontWeight: 'bold', color: '#0f172a' },
  signatureBox: { alignSelf: 'flex-end', width: 140, textAlign: 'center', marginTop: 'auto', paddingTop: 20 },
  signatureLine: { borderBottomWidth: 1, borderBottomColor: '#94a3b8', borderBottomStyle: 'dashed', marginBottom: 4, width: 100, alignSelf: 'center' },
  signatureText: { fontSize: 8, fontWeight: 'bold', color: '#475569', textTransform: 'uppercase' }
});

export interface InvoiceItem { id: number; name: string; price: number; }
export interface InvoiceData {
  billId: string; billDate: string; patientName: string; ageGender: string;
  referredBy: string; paymentType: string; items: InvoiceItem[];
  subTotal: number; discount: number; totalAmount: number;
  paidAmount: number; balanceDue: number;
  barcodeUrl?: string; qrUrl?: string; note?: string; noteImage?: string; 
  labProfile?: any;
  authorSign?: any;
}

export const InvoiceDocument = ({ data }: { data: InvoiceData }) => {
  const getCleanText = (html: string | undefined) => {
    if (!html) return '';
    let text = html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n');
    text = text.replace(/<[^>]+>/g, ''); 
    return text.trim();
  };
  const cleanNote = getCleanText(data.note);

  // SECURELY GRAB PROFILE FROM INJECTED DATA
  const profile = data?.labProfile || {};
  const hasLetterhead = profile?.letterheadUrl && 
                        profile.letterheadUrl !== 'null' && 
                        profile.letterheadUrl !== 'undefined' && 
                        profile.letterheadUrl.trim() !== '';

  return (
  <Document>
    <Page size="A4" style={{
        ...styles.page,
        paddingTop: hasLetterhead ? Number(profile.lhMt || 120) : 40,
        paddingBottom: hasLetterhead ? Number(profile.lhMb || 80) : 40,
        paddingLeft: hasLetterhead ? Number(profile.lhMl || 40) : 40,
        paddingRight: hasLetterhead ? Number(profile.lhMr || 40) : 40,
    }}>
        
      {/* BACKGROUND LETTERHEAD LAYER */}
      {hasLetterhead && (
          <Image 
              src={profile.letterheadUrl} 
              fixed 
              style={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  width: profile.lhWidth ? Number(profile.lhWidth) : '100%',
                  height: profile.lhHeight ? Number(profile.lhHeight) : '100%',
                  objectFit: profile.lhWidth || profile.lhHeight ? 'contain' : 'fill',
                  objectPosition: 'top center',
                  zIndex: -1 
              }} 
          />
      )}

      <View style={styles.mainContainer}>

        {/* DEFAULT HEADER IF NO LETTERHEAD */}
        {!hasLetterhead && (
            <View style={styles.headerContainer}>
                <View style={styles.brandColumn}>
                    {profile?.logoUrl && (
                        <Image src={profile.logoUrl} style={{ width: 50, height: 50, marginRight: 12, objectFit: 'contain' }} />
                    )}
                    <View style={{ flexDirection: 'column' }}>
                        <Text style={styles.brandName}>{profile?.name || 'Smart Lab'}</Text>
                        <Text style={styles.brandSub}>{profile?.tagline || 'Pathology & Diagnostics'}</Text>
                    </View>
                </View>
                <View style={styles.contactColumn}>
                    {profile?.address ? (
                        <Text style={styles.addressLine}>{profile.address}</Text>
                    ) : (
                        <>
                            <Text style={styles.addressLine}>123, Health Avenue, Medical District</Text>
                            <Text style={styles.addressLine}>City - 500010, State</Text>
                        </>
                    )}
                    <Text style={styles.addressLine}>Ph: {profile?.phone || '+91 98765 43210'}</Text>
                </View>
            </View>
        )}

        {/* PATIENT & BILL METADATA GRID */}
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

        {/* TEST ITEMS TABLE */}
        <View style={styles.table}>
            <View style={styles.tableHeader}>
                <Text style={[styles.th, styles.col1]}>TEST DESCRIPTION</Text>
                <Text style={[styles.th, styles.col2]}>AMOUNT (Rs)</Text>
            </View>
            {data.items.map((item, index) => (
                <View key={index} style={styles.tableRow}>
                    <Text style={[styles.td, styles.col1]}>{item.name}</Text>
                    <Text style={[styles.tdAmount, styles.col2]}>{Number(item.price || 0).toFixed(2)}</Text>
                </View>
            ))}
        </View>

        {/* BARCODES & TOTALS */}
        <View style={styles.totalsContainer}>
            <View style={styles.barcodeBox}>
                {data.barcodeUrl && (
                    <View style={{ alignItems: 'center' }}>
                        <Image src={data.barcodeUrl} style={{ width: 80, height: 20 }} />
                        <Text style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>{String(data.billId || '').slice(-4)}</Text>
                    </View>
                )}
                {data.qrUrl && (
                    <View style={{ alignItems: 'center' }}>
                        <View style={{ padding: 2, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 2 }}>
                            <Image src={data.qrUrl} style={{ width: 32, height: 32 }} />
                        </View>
                        <Text style={{ fontSize: 6, color: '#64748b', marginTop: 2, textTransform: 'uppercase' }}>Scan to Verify</Text>
                    </View>
                )}
            </View>

            <View style={styles.totalsBox}>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Sub Total</Text>
                    <Text style={styles.totalValue}>{Number(data.subTotal || 0).toFixed(2)}</Text>
                </View>
                {Number(data.discount || 0) > 0 && (
                    <View style={styles.totalRow}>
                        <Text style={[styles.totalLabel, { color: '#ef4444' }]}>Discount</Text>
                        <Text style={[styles.totalValue, { color: '#ef4444' }]}>- {Number(data.discount || 0).toFixed(2)}</Text>
                    </View>
                )}
                <View style={styles.netAmountRow}>
                    <Text style={styles.netLabel}>Net Amount</Text>
                    <Text style={styles.netValue}>Rs. {Number(data.totalAmount || 0).toFixed(2)}</Text>
                </View>
                <View style={[styles.badgeRow, { backgroundColor: '#f0fdf4' }]}> 
                    <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#16a34a' }}>Paid Amount</Text>
                    <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#16a34a' }}>{Number(data.paidAmount || 0).toFixed(2)}</Text>
                </View>
                {Number(data.balanceDue || 0) > 0 && (
                    <View style={[styles.badgeRow, { backgroundColor: '#fef2f2' }]}>
                        <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#dc2626' }}>Balance Due</Text>
                        <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#dc2626' }}>{Number(data.balanceDue || 0).toFixed(2)}</Text>
                    </View>
                )}
            </View>
        </View>

        {/* NOTES SECTION */}
        {cleanNote ? (
            <View style={{ marginTop: 10, marginBottom: 10, padding: 8, backgroundColor: '#f8fafc', borderRadius: 4, borderWidth: 1, borderColor: '#e2e8f0' }}>
                <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Note:</Text>
                <Text style={{ fontSize: 9, color: '#334155' }}>{cleanNote}</Text>
            </View>
        ) : null}

        {/* SIGNATURE SECTION */}
        <View style={styles.signatureBox}>
            {data.authorSign ? (
                <View style={{ alignItems: 'center' }}>
                    {data.authorSign.signatureUrl ? (
                        <Image src={data.authorSign.signatureUrl} style={{ height: 35, width: 80, objectFit: 'contain', marginBottom: 2 }} />
                    ) : (
                        <View style={styles.signatureLine} />
                    )}
                    <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#1e293b' }}>{data.authorSign.name}</Text>
                    {data.authorSign.designation && <Text style={{ fontSize: 7, color: '#64748b', marginTop: 2 }}>{data.authorSign.designation}</Text>}
                </View>
            ) : (
                <View>
                    <View style={styles.signatureLine} />
                    <Text style={styles.signatureText}>Authorized Signatory</Text>
                </View>
            )}
        </View>

      </View>
    </Page>
  </Document>
  );
};

export default InvoiceDocument;