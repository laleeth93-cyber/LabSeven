import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { billNumber, phone } = body;

        if (!billNumber || !phone) {
            return NextResponse.json({ error: 'Missing billNumber or phone' }, { status: 400 });
        }

        const bill = await prisma.bill.findFirst({
            where: { billNumber },
            include: { patient: true }
        });

        if (!bill || !bill.patientId) {
            return NextResponse.json({ error: 'Bill or patient not found' }, { status: 404 });
        }

        const updatedPatient = await prisma.patient.update({
            where: { id: bill.patientId },
            data: { phone }
        });

        return NextResponse.json({ success: true, patient: updatedPatient });
    } catch (error: any) {
        console.error('Update Phone Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
