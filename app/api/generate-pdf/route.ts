const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const API_KEY = process.env.INTERNAL_API_KEY || "labseven_secret_key_2025";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // ⚡ Proxy the generation request to our high-performance Node engine
        const response = await fetch(`${BACKEND_URL}/api/pdf/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Backend PDF generation failed: ${errorText}`);
        }

        // Retrieve the generated PDF buffer from the backend
        const pdfBuffer = await response.arrayBuffer();

        // Serve it directly to the browser
        return new Response(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'inline; filename="SmartLab_Document.pdf"'
            }
        });
    } catch (error) {
        console.error('Next.js API Proxy PDF Error:', error);
        return new Response(JSON.stringify({ error: 'Failed to generate PDF via Proxy', details: String(error) }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}