// --- BLOCK app/list/components/report-pdf/reportUtils.ts OPEN ---
export const parseMargin = (val: any, defaultVal: number) => {
    if (val === undefined || val === null || val === '') return defaultVal;
    const num = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? defaultVal : num;
};

export const getPdfFontName = (rawFont: string, isBold: boolean) => {
    let pdfFont = 'Helvetica'; 
    if (rawFont?.toLowerCase().includes('serif') || rawFont?.toLowerCase().includes('times')) pdfFont = 'Times-Roman';
    else if (rawFont?.toLowerCase().includes('mono') || rawFont?.toLowerCase().includes('courier')) pdfFont = 'Courier';

    if (pdfFont === 'Times-Roman') return isBold ? 'Times-Bold' : 'Times-Roman';
    if (pdfFont === 'Courier') return isBold ? 'Courier-Bold' : 'Courier';
    return isBold ? 'Helvetica-Bold' : 'Helvetica';
};

export const getFieldValue = (field: any, patient: any, realData: any, collectedDate: any, reportedDate: any) => {
    if (!field) return '';
    const exactKey = field.key || '';
    const searchString = (String(exactKey) + String(field.label || '')).toLowerCase().replace(/[^a-z0-9]/g, '');
    
    const namePrefix = patient?.designation ? patient.designation + ' ' : '';
    const fullName = `${namePrefix}${patient?.firstName || ''} ${patient?.lastName || ''}`.trim();
    const ageSex = patient?.ageY !== undefined ? `${patient.ageY}Y ${patient.ageM ? patient.ageM + 'M ' : ''}/ ${patient.gender || ''}` : '';

    if (searchString.includes('age') && (searchString.includes('gender') || searchString.includes('sex'))) return ageSex;
    if (searchString.includes('patientid') || searchString.includes('pid')) return patient?.patientId || '';
    if (searchString.includes('uhid') || searchString.includes('mrn')) return patient?.uhid || '';
    if (searchString.includes('name') || searchString.includes('patientname') || searchString.includes('fullname')) return fullName;
    if (searchString === 'age' || searchString === 'patientage') return `${patient?.ageY || ''}${patient?.ageY ? 'Y' : ''} ${patient?.ageM ? patient.ageM + 'M' : ''}`.trim();
    if (searchString === 'gender' || searchString === 'sex' || searchString === 'patientgender') return patient?.gender || '';
    
    // ==========================================
    // ULTRA-STRICT REFERRAL PARSER
    // ==========================================
    const docName = patient?.refDoctor || '';
    
    let extractedDoc = '';
    let extractedHosp = '';
    let extractedLab = '';

    if (docName && docName.toLowerCase() !== 'self') {
        let tempStr = String(docName);
        
        const hospMatch = tempStr.match(/\(([^)]+)\)/);
        if (hospMatch) {
            extractedHosp = hospMatch[1].trim();
            tempStr = tempStr.replace(hospMatch[0], '');
        }
        
        const labMatch = tempStr.match(/-\s*(.+)$/);
        if (labMatch) {
            extractedLab = labMatch[1].trim();
            tempStr = tempStr.replace(labMatch[0], '');
        }
        
        extractedDoc = tempStr.trim();
    }

    const isSelf = !extractedDoc && !extractedHosp && !extractedLab;

    if (exactKey === 'showReferringDoc' || exactKey === 'showReferredBy') return isSelf ? 'Self' : ''; 
    if (exactKey === 'showRefDoc') return extractedDoc ? extractedDoc : ''; 
    if (exactKey === 'showRefHospital' || searchString.includes('hospital')) return extractedHosp || ''; 
    if (exactKey === 'showRefLab' || searchString.includes('lab') || searchString.includes('outsource')) return extractedLab || ''; 
    
    // ==========================================
    // BILLING & BARCODES (SHORTENED TO 4 DIGITS)
    // ==========================================
    const shortBillId = String(realData?.billNumber || '').slice(-4);
    
    if (searchString.includes('bill') || searchString.includes('invoice') || searchString.includes('order')) {
        return shortBillId;
    }
    if (searchString.includes('barcode')) {
        return shortBillId;
    }
    
    // ==========================================
    // DATES & TIMES (Ultra-Robust Matching)
    // ==========================================
    
    // 1. Reported Date
    if (searchString.includes('report')) {
        return reportedDate || '';
    }

    // 2. Received Date (Bill Date + Exactly 5 Minutes)
    if (searchString.includes('receive')) {
        if (realData?.date) {
            const receivedTime = new Date(new Date(realData.date).getTime() + 5 * 60000); // 5 minutes added
            return receivedTime.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).replace(',', '');
        }
        return '';
    }

    // 3. Collection At (Location/Center)
    if (searchString.includes('collectionat') || searchString.includes('center')) {
        return patient?.collectionAt || 'Lab';
    }

    // 4. Collection / Sample / Registered Date (Exact Bill Date & Time)
    if (searchString.includes('collect') || searchString.includes('register') || searchString.includes('sample') || searchString.includes('date') || searchString.includes('time')) {
        if (realData?.date) {
            return new Date(realData.date).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).replace(',', '');
        }
        return collectedDate || '';
    }

    // ==========================================
    // MISC CONTACT & BIO
    // ==========================================
    if (searchString.includes('phone') || searchString.includes('mobile')) return patient?.phone || '';
    if (searchString.includes('email')) return patient?.email || '';
    if (searchString.includes('address')) return patient?.address || '';
    if (searchString.includes('passport')) return patient?.passport || '';
    if (searchString.includes('aadhaar') || searchString.includes('adhar')) return patient?.aadhaar || '';
    if (searchString.includes('height')) return patient?.height ? `${patient.height}` : '';
    if (searchString.includes('weight')) return patient?.weight ? `${patient.weight}` : '';
    
    return '';
};

export const cleanBasicHTML = (html: string) => {
    if (!html) return '';
    let text = String(html).replace(/\n/g, ' ');
    text = text.replace(/<li[^>]*>/gi, ' • ');
    text = text.replace(/<\/li>/gi, '\n');
    text = text.replace(/<\/p>/gi, '\n'); 
    text = text.replace(/<\/div>/gi, '\n');
    text = text.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<[^>]+>/g, '');
    text = text.replace(/&nbsp;/g, ' ')
               .replace(/&amp;/g, '&')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&quot;/g, '"')
               .replace(/&#39;/g, "'");
    text = text.replace(/\n{3,}/g, '\n\n');
    return text.trim();
};

export const parseInterpretation = (html: string) => {
    if (!html) return [];
    
    const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
    const blocks: any[] = [];
    let lastIndex = 0;
    let match;

    const parseTextChunks = (textHtml: string) => {
        const blockRegex = /<(p|div|h[1-6])([^>]*)>([\s\S]*?)<\/\1>/gi;
        let lastIdx = 0;
        let blockMatch;

        while ((blockMatch = blockRegex.exec(textHtml)) !== null) {
            if (blockMatch.index > lastIdx) {
                const raw = cleanBasicHTML(textHtml.substring(lastIdx, blockMatch.index));
                if (raw) blocks.push({ type: 'text', content: raw, lineHeight: 1.4 });
            }

            const attrs = blockMatch[2] || '';
            const innerHtml = blockMatch[3] || '';
            let lh = 1.4; 
            
            const lhMatch = attrs.match(/line-height:\s*([\d.]+)/);
            if (lhMatch && !isNaN(parseFloat(lhMatch[1]))) {
                lh = parseFloat(lhMatch[1]);
            }

            const cleanText = cleanBasicHTML(innerHtml);
            if (cleanText) {
                blocks.push({ type: 'text', content: cleanText, lineHeight: lh });
            }

            lastIdx = blockRegex.lastIndex;
        }

        if (lastIdx < textHtml.length) {
            const raw = cleanBasicHTML(textHtml.substring(lastIdx));
            if (raw) blocks.push({ type: 'text', content: raw, lineHeight: 1.4 });
        }
    };

    while ((match = tableRegex.exec(html)) !== null) {
        if (match.index > lastIndex) {
            parseTextChunks(html.substring(lastIndex, match.index));
        }

        const tableContent = match[1];
        const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
        const rows: string[][] = [];
        let rowMatch;

        while ((rowMatch = rowRegex.exec(tableContent)) !== null) {
            const cellRegex = /<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;
            const cells: string[] = [];
            let cellMatch;
            while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
                cells.push(cleanBasicHTML(cellMatch[1]));
            }
            if (cells.length > 0) rows.push(cells);
        }

        if (rows.length > 0) blocks.push({ type: 'table', rows });
        lastIndex = tableRegex.lastIndex;
    }

    if (lastIndex < html.length) {
        parseTextChunks(html.substring(lastIndex));
    }

    return blocks;
};

export const groupDisplayData = (displayData: any[], realData?: any) => {
    const groupedData: { testName: string, items: any[], interpretationBlocks: any[], noteBlocks: any[] }[] = [];
    let currentGroup = { testName: '', items: [] as any[], interpretationBlocks: [] as any[], noteBlocks: [] as any[] };

    displayData?.forEach((row: any) => {
        if (row.isGroup && !row.isSubHeading) {
            if (currentGroup.items.length > 0 || currentGroup.testName) {
                groupedData.push(currentGroup);
            }
            
            let foundInterpretation = '';
            let foundNotes = '';
            
            if (realData && realData.items) {
                const matchingItem = realData.items.find((item: any) => 
                    item.test?.name === row.param || item.test?.displayName === row.param
                );
                
                if (matchingItem) {
                    if (matchingItem.test?.isInterpretationNeeded && matchingItem.test?.interpretation) {
                        foundInterpretation = matchingItem.test.interpretation;
                    }
                    if (matchingItem.notes) {
                        foundNotes = matchingItem.notes;
                    }
                }
            }

            if (!foundInterpretation && row.interpretation) {
                foundInterpretation = row.interpretation;
            }

            currentGroup = { 
                testName: row.param, 
                items: [],
                interpretationBlocks: parseInterpretation(foundInterpretation),
                noteBlocks: parseInterpretation(foundNotes)
            };
        } else {
            currentGroup.items.push(row);
        }
    });
    
    if (currentGroup.items.length > 0 || currentGroup.testName) {
        groupedData.push(currentGroup);
    }
    return groupedData;
};
// --- BLOCK app/list/components/report-pdf/reportUtils.ts CLOSE ---