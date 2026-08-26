import { prisma } from '@/lib/prisma';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

export async function validatePhone(phone: string): Promise<string | null> {
    try {
        const phoneNumber = parsePhoneNumberFromString(phone, 'IN'); // Default to India for example, adjust as needed
        if (phoneNumber && phoneNumber.isValid()) {
            // Meta requires number without + but with country code
            return phoneNumber.format('E.164').replace('+', ''); 
        }
        
        // Fallback simple validation if libphonenumber fails but it's just digits
        const clean = phone.replace(/\D/g, '');
        if (clean.length >= 10 && clean.length <= 15) {
            return clean;
        }
        
        return null;
    } catch {
        return null;
    }
}

export async function validatePdfUrl(url: string): Promise<boolean> {
    try {
        const response = await fetch(url, { method: 'HEAD', redirect: 'follow' });
        if (!response.ok) return false;
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/pdf')) {
            return true;
        }
        return false;
    } catch {
        return false;
    }
}

export async function checkRateLimit(organizationId: number): Promise<boolean> {
    // Check if more than 100 messages were sent in the last minute
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const count = await prisma.whatsAppLog.count({
        where: {
            organizationId,
            createdAt: {
                gte: oneMinuteAgo
            }
        }
    });

    return count < 100;
}
