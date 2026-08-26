import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';

export const runtime = 'nodejs';
export const maxDuration = 30;

let browserInstance: any = null;

async function getBrowser() {
  if (browserInstance) {
    return browserInstance;
  }

  const isLocal =
    process.env.NODE_ENV === 'development' &&
    !process.env.VERCEL;

  if (isLocal) {
    browserInstance = await puppeteer.launch({
      executablePath:
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    return browserInstance;
  }

  const chromium: any =
    (await import('@sparticuz/chromium')).default;

  browserInstance = await puppeteer.launch({
    executablePath: await chromium.executablePath(),
    args: chromium.args,
    headless: true
  });

  return browserInstance;
}

export async function POST(req: Request) {
  try {
    const {
      html,
      paperSize,
      printOrientation,
      width,
      height,
      enableJs
    } = await req.json();

    const browser = await getBrowser();

    const page = await browser.newPage();

    await page.emulateMediaType('screen');

    if (enableJs) {
      await page.setJavaScriptEnabled(true);

      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 15000
      });
    } else {
      await page.setJavaScriptEnabled(false);

      await page.setContent(html, {
        waitUntil: 'load',
        timeout: 8000
      });
    }

    const pdfOptions: any = {
      landscape: printOrientation === 'landscape',
      printBackground: true,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0'
      }
    };

    const cleanDimension = (dim: any) => {
      if (!dim) return undefined;

      const str = String(dim).trim().toLowerCase();

      if (
        str.endsWith('mm') ||
        str.endsWith('cm') ||
        str.endsWith('in') ||
        str.endsWith('px')
      ) {
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
        'Content-Disposition':
          'inline; filename="SmartLab_Document.pdf"'
      }
    });
  } catch (error) {
    console.error('PDF Generation Error:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : String(error)
      },
      {
        status: 500
      }
    );
  }
}