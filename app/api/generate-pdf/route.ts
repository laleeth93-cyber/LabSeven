// --- BLOCK app/api/generate-pdf/route.ts OPEN ---
import puppeteer from 'puppeteer';

// ⚡ SPEED BOOST 1: Global Browser Cache. 
// This keeps Chrome "warm" across multiple rapid requests on the server, saving 1.5s - 2s of boot time!
let cachedBrowser: any = null;

export async function POST(req: Request) {
    try {
        const { html, paperSize, printOrientation, width, height } = await req.json();

        // If the browser isn't running yet (Cold Start), launch it with high-performance flags.
        if (!cachedBrowser) {
            cachedBrowser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox', 
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--no-zygote',       // ⚡ SPEED BOOST 2: Skips unnecessary process cloning
                    '--single-process'   // ⚡ SPEED BOOST 3: Reduces overhead
                ]
            });
        }

        const page = await cachedBrowser.newPage();
        
        // ⚡ SPEED BOOST 4: Disable JS execution inside the page. We only need to render HTML/CSS.
        await page.setJavaScriptEnabled(false);
        await page.emulateMediaType('screen');

        // ⚡ SPEED BOOST 5: 'load' is instantaneous once the HTML is parsed. 
        // We removed the slow 'networkidle0' and the arbitrary 500ms setTimeout!
        await page.setContent(html, { waitUntil: 'load', timeout: 8000 }); 

        const pdfOptions: any = {
            landscape: printOrientation === 'landscape',
            printBackground: true, 
            margin: { top: '0', right: '0', bottom: '0', left: '0' }
        };

        // --- BULLETPROOF DIMENSION CLEANER ---
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
        // -------------------------------------

        const pdfBuffer = await page.pdf(pdfOptions);
        
        // ⚡ SPEED BOOST 6: Close ONLY the page/tab, leaving the main browser alive for the next print job.
        await page.close(); 

        return new Response(pdfBuffer as any, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'inline; filename="SmartLab_Document.pdf"'
            }
        });
    } catch (error) {
        console.error('Puppeteer PDF Generation Error:', error);
        
        // If something crashes completely, kill the cached browser so it restarts fresh next time
        if (cachedBrowser) {
            await cachedBrowser.close().catch(() => {});
            cachedBrowser = null;
        }
        
        return new Response(JSON.stringify({ error: 'Failed to generate PDF', details: String(error) }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
// --- BLOCK app/api/generate-pdf/route.ts CLOSE ---