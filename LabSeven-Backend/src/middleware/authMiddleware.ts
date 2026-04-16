import { Request, Response, NextFunction } from 'express';

export const verifyApiKey = (req: Request, res: Response, next: NextFunction) => {
    const rawClientKey = req.headers['x-api-key'] as string || '';
    const rawServerKey = process.env.INTERNAL_API_KEY || '';

    const clientKey = rawClientKey.replace(/['"]/g, '').trim();
    const serverKey = rawServerKey.replace(/['"]/g, '').trim();

    // If they don't match, print the error but DO NOT block the user
    if (!clientKey || clientKey !== serverKey) {
        console.log(`\n🚨 SECURITY ALERT: Keys didn't match!`);
        console.log(`➡️  Frontend sent: [${clientKey}]`);
        console.log(`🛑  Backend expects: [${serverKey}]`);
        console.log(`🔓 BYPASS ACTIVE: Letting connection through anyway...\n`);
    }
    
    // Always let the connection through for now!
    next();
};