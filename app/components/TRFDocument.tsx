// --- BLOCK app/components/TRFDocument.tsx OPEN ---
const getSampleType = (testName: string) => {
    const name = testName.toLowerCase();
    if (name.includes('cbc') || name.includes('hb')) return 'EDTA WB';
    if (name.includes('sugar') || name.includes('glucose')) return 'Fluoride';
    if (name.includes('urine')) return 'Urine';
    return 'Serum';
};
  
const getDepartment = (testName: string) => {
    const name = testName.toLowerCase();
    if (name.includes('cbc')) return 'HAEMATOLOGY';
    if (name.includes('urine')) return 'CLINICAL PATHOLOGY';
    return 'BIOCHEMISTRY';
};

export interface TRFData {
    billId: string;
    patientName: string;
    ageGender: string;
    date: string;
    phone?: string;
    referredBy?: string;
    items: { name: string; price: number }[];
}

export const generateTRFHtml = (data: TRFData) => {
    const shortBillId = String(data.billId || '').slice(-4);
    
    const rows = data.items.map((item) => `
        <tr style="border-bottom: 1px solid #000; height: 35px;">
        <td style="border-right: 1px solid #000; padding: 8px;">${getDepartment(item.name)}</td>
        <td style="border-right: 1px solid #000; padding: 8px; font-weight: 600;">${item.name}</td>
        <td style="border-right: 1px solid #000; padding: 8px;">${getSampleType(item.name)}</td>
        <td style="border-right: 1px solid #000; padding: 8px; text-align: center; font-family: monospace; font-size: 14px;">${shortBillId}</td>
        <td style="padding: 8px;"></td>
        </tr>
    `).join('');

    return `
        <div style="padding: 40px; font-family: system-ui, -apple-system, sans-serif; color: #000; position: relative; min-height: 100vh;">
        
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 25px;">
            <h1 style="font-size: 32px; font-weight: 900; text-transform: uppercase; margin: 0 0 5px 0; letter-spacing: 1px;">Smart Lab</h1>
            <p style="font-size: 12px; margin: 0 0 15px 0; color: #333;">123, Medical District, Health City - 500001 | Ph: +91 98765 43210</p>
            <h2 style="font-size: 18px; font-weight: bold; text-transform: uppercase; margin: 0 0 5px 0; text-decoration: underline; text-underline-offset: 4px;">Test Requisition Form (TRF)</h2>
            <p style="font-size: 12px; color: #555; margin: 0; font-weight: 500; letter-spacing: 0.5px;">Lab Copy / Phlebotomy Copy</p>
        </div>

        <div style="border: 2px solid #000; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
            <div style="display: flex; margin-bottom: 10px;">
            <div style="width: 50%; display: flex;"><span style="width: 100px; font-weight: 700; font-size: 13px;">Patient Name</span><span style="width: 15px;">:</span><span style="flex: 1; font-size: 13px; font-weight: 500;">${data.patientName}</span></div>
            <div style="width: 50%; display: flex;"><span style="width: 100px; font-weight: 700; font-size: 13px;">Patient ID</span><span style="width: 15px;">:</span><span style="flex: 1; font-size: 13px; font-weight: 500;">${shortBillId}</span></div>
            </div>
            <div style="display: flex; margin-bottom: 10px;">
            <div style="width: 50%; display: flex;"><span style="width: 100px; font-weight: 700; font-size: 13px;">Age/Gender</span><span style="width: 15px;">:</span><span style="flex: 1; font-size: 13px; font-weight: 500;">${data.ageGender}</span></div>
            <div style="width: 50%; display: flex;"><span style="width: 100px; font-weight: 700; font-size: 13px;">Billing Date</span><span style="width: 15px;">:</span><span style="flex: 1; font-size: 13px; font-weight: 500;">${data.date}</span></div>
            </div>
            <div style="display: flex;">
            <div style="width: 50%; display: flex;"><span style="width: 100px; font-weight: 700; font-size: 13px;">Phone No.</span><span style="width: 15px;">:</span><span style="flex: 1; font-size: 13px; font-weight: 500;">${data.phone || 'N/A'}</span></div>
            <div style="width: 50%; display: flex;"><span style="width: 100px; font-weight: 700; font-size: 13px;">Referred By</span><span style="width: 15px;">:</span><span style="flex: 1; font-size: 13px; font-weight: 500;">${data.referredBy || 'Self'}</span></div>
            </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; font-size: 13px;">
            <thead>
            <tr style="background-color: #f1f5f9; border-bottom: 2px solid #000;">
                <th style="text-align: left; padding: 10px 8px; border-right: 1px solid #000; width: 20%; font-weight: 700; text-transform: uppercase;">Department</th>
                <th style="text-align: left; padding: 10px 8px; border-right: 1px solid #000; width: 35%; font-weight: 700; text-transform: uppercase;">Investigation</th>
                <th style="text-align: left; padding: 10px 8px; border-right: 1px solid #000; width: 15%; font-weight: 700; text-transform: uppercase;">Sample Type</th>
                <th style="text-align: center; padding: 10px 8px; border-right: 1px solid #000; width: 15%; font-weight: 700; text-transform: uppercase;">Barcode</th>
                <th style="text-align: left; padding: 10px 8px; width: 15%; font-weight: 700; text-transform: uppercase;">Patient Sign</th>
            </tr>
            </thead>
            <tbody>
            ${rows}
            </tbody>
        </table>

        <div style="position: absolute; bottom: 40px; left: 40px; right: 40px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #cbd5e1; padding-top: 15px; font-weight: 500;">
            Generated by Smart Lab System • ${new Date().toLocaleString()}
        </div>
        
        </div>
    `;
};
// --- BLOCK app/components/TRFDocument.tsx CLOSE ---