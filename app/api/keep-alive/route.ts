import { NextResponse } from "next/server";

// ⚡ Connect to your V8 Engine
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export async function GET() {
    try {
        // Ping the backend engine to keep both the frontend and backend warm!
        const res = await fetch(`${BACKEND_URL}/health`, { 
            method: 'GET',
            cache: 'no-store' 
        });
        
        const backendData = await res.json();

        return NextResponse.json({ 
            status: "awake", 
            engine: backendData.status || "awake",
            time: new Date().toISOString() 
        });
    } catch (error) {
        console.error("Keep-Alive Ping Failed:", error);
        // We still return 200 OK so the frontend doesn't crash if the backend is restarting
        return NextResponse.json({ 
            status: "frontend_awake", 
            engine: "unreachable",
            time: new Date().toISOString()
        });
    }
}