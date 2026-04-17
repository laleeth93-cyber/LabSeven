// --- BLOCK app/api/keep-alive/route.ts OPEN ---
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        // A microscopic, instant query to keep the Database connection warm!
        await prisma.$queryRaw`SELECT 1`;
        return NextResponse.json({ status: "awake", time: new Date().toISOString() });
    } catch (error) {
        return NextResponse.json({ status: "error" }, { status: 500 });
    }
}
// --- BLOCK app/api/keep-alive/route.ts CLOSE ---