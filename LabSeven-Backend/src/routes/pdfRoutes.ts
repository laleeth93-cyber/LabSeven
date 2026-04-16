import express from 'express';
import puppeteer from 'puppeteer';

const router = express.Router();

// ⚡ Global Browser Cache for lightning-fast warm starts
let cachedBrowser: any = null;

router.post('/generate', async (req, res) => {
    try {
        const { html, paperSize, printOrientation, width, height } = req.body;

        if (!cachedBrowser) {
            cachedBrowser = await puppeteer.launch({
                headless: true,
                // 🚨 UNCOMMENT THE LINE BELOW ONLY IF YOU USED "PLAN B" TO SKIP THE PUPPETEER DOWNLOAD
                // executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 
                args: [
                    '--no-sandbox', 
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--no-zygote',       
                    '--single-process'   
                ]
            });
        }

        const page = await cachedBrowser.newPage();
        
        // ⚡ Disable JS execution inside the page. We only need to render HTML/CSS.
        await page.setJavaScriptEnabled(false);
        await page.emulateMediaType('screen');

        await page.setContent(html, { waitUntil: 'load', timeout: 8000 }); 

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

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="SmartLab_Document.pdf"');
        res.status(200).send(pdfBuffer);

    } catch (error: any) {
        console.error('Puppeteer PDF Generation Error:', error);
        
        if (cachedBrowser) {
            await cachedBrowser.close().catch(() => {});
            cachedBrowser = null;
        }
        
        res.status(500).json({ error: 'Failed to generate PDF', details: String(error) });
    }
});

export default router;