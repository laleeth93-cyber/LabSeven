// --- BLOCK app/api/generate-pdf/route.ts OPEN ---
import { NextResponse } from 'next/server';
import puppeteerCore from 'puppeteer-core';

export const runtime = 'nodejs';
export const maxDuration = 30; 

let cachedBrowser: any = null;

export async function POST(req: Request) {
    try {
        const { html, paperSize, printOrientation, width, height, enableJs } = await req.json();

        // Check if we are running locally or on Vercel
        const isLocal = !process.env.VERCEL && process.env.NODE_ENV === 'development';

        if (!cachedBrowser) {
            if (isLocal) {
                // LOCAL: Use puppeteer-core but point it to your computer's Chrome
                // NOTE: Change this path if you are on a Mac or Linux!
                const localChromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
                
                cachedBrowser = await puppeteerCore.launch({
                    headless: true,
                    executablePath: localChromePath,
                    args: [
                        '--no-sandbox', 
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-gpu'
                    ]
                });
            } else {
                // VERCEL: Use @sparticuz/chromium
                const chromium = (await import('@sparticuz/chromium')).default as any;
                
                cachedBrowser = await puppeteerCore.launch({
                    args: chromium.args,
                    defaultViewport: chromium.defaultViewport,
                    executablePath: await chromium.executablePath(),
                    headless: chromium.headless,
                    // ignoreHTTPSErrors removed to satisfy strict TypeScript rules
                });
            }
        }

        const page = await cachedBrowser.newPage();
        
        await page.emulateMediaType('screen');

        if (enableJs) {
            await page.setJavaScriptEnabled(true);
            await page.setContent(html, { waitUntil: 'networkidle0', timeout: 15000 }); 
        } else {
            await page.setJavaScriptEnabled(false);
            await page.setContent(html, { waitUntil: 'load', timeout: 8000 }); 
        }

        const pdfOptions: any = {
            landscape: printOrientation === 'landscape',
            printBackground: true, 
            margin: { top: '0', right: '0', bottom: '0', left: '0' }
        };

        const cleanDimension = (dim: any) => {
            if (!dim) return undefined;
            const str = String(dim).trim().toLowerCase();
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

        const pdfBuffer = await page.pdf(pdfOptions);
        
        await page.close(); 

        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'inline; filename="SmartLab_Document.pdf"'
            }
        });
    } catch (error) {
        console.error('Puppeteer PDF Generation Error:', error);
        
        if (cachedBrowser) {
            await cachedBrowser.close().catch(() => {});
            cachedBrowser = null;
        }
        
        return NextResponse.json(
            { error: 'Failed to generate PDF', details: String(error) },
            { status: 500 }
        );
    }
}
// --- BLOCK app/api/generate-pdf/route.ts CLOSE ---