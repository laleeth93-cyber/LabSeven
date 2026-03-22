// --- app/api/generate-pdf/route.ts Block Open ---
import puppeteer from 'puppeteer';

export async function POST(req: Request) {
    let browser = null;
    try {
        const { html, paperSize, printOrientation, width, height } = await req.json();

        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();
        await page.emulateMediaType('screen');

        await page.setContent(html, { waitUntil: 'networkidle0', timeout: 15000 }); 
        
        await new Promise(resolve => setTimeout(resolve, 500));

        const pdfOptions: any = {
            landscape: printOrientation === 'landscape',
            printBackground: true, 
            margin: { top: '0', right: '0', bottom: '0', left: '0' }
        };

        // --- BULLETPROOF DIMENSION CLEANER ---
        const cleanDimension = (dim: any) => {
            if (!dim) return undefined;
            const str = String(dim).trim().toLowerCase();
            // If it already has a valid unit, keep it. Otherwise, force px.
            if (str.endsWith('mm') || str.endsWith('cm') || str.endsWith('in') || str.endsWith('px')) {
                return str;
            }
            return `${str}px`; 
        };

        if (width || height) {
            if (width) pdfOptions.width = cleanDimension(width);
            if (height) pdfOptions.height = cleanDimension(height);
        } else {
            pdfOptions.format = paperSize || 'A4';
        }
        // -------------------------------------

        const pdfBuffer = await page.pdf(pdfOptions);
        await browser.close(); 

        return new Response(pdfBuffer as any, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'inline; filename="SmartLab_Barcode.pdf"'
            }
        });
    } catch (error) {
        console.error('Puppeteer PDF Generation Error:', error);
        if (browser) {
            await browser.close().catch(() => {});
        }
        return new Response(JSON.stringify({ error: 'Failed to generate PDF', details: String(error) }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
// --- app/api/generate-pdf/route.ts Block Close ---