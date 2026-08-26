const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const queues = await prisma.whatsAppQueue.findMany({
        orderBy: { id: 'desc' },
        take: 3
    });
    console.log("QUEUES:", JSON.stringify(queues, null, 2));

    const logs = await prisma.whatsAppLog.findMany({
        orderBy: { id: 'desc' },
        take: 3
    });
    console.log("LOGS:", JSON.stringify(logs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
