const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const acc = await prisma.whatsAppAccount.findFirst();
    console.log(JSON.stringify(acc, null, 2));
}
main();
