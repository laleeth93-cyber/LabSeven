"use server";

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Fetch all packages (Tests where type === 'Package')
export async function getPackages() {
    try {
        const packages = await prisma.test.findMany({
            where: { type: 'Package' },
            include: {
                department: true,
                packageTests: {
                    include: {
                        test: {
                            select: { id: true, name: true, code: true, price: true }
                        }
                    }
                }
            },
            orderBy: { name: 'asc' }
        });
        return { success: true, data: packages };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

// Fetch available standalone tests that can be added to a package
export async function getAvailableTestsForPackage() {
    try {
        const tests = await prisma.test.findMany({
            where: { type: 'Test', isActive: true },
            select: { id: true, name: true, code: true, price: true, department: { select: { name: true } } },
            orderBy: { name: 'asc' }
        });
        return { success: true, data: tests };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

// Save the cart (update the tests inside a package)
export async function savePackageTests(packageId: number, testIds: number[]) {
    try {
        await prisma.$transaction(async (tx) => {
            // 1. Remove all old tests from this package
            await tx.packageTest.deleteMany({
                where: { packageId: packageId }
            });

            // 2. Add the newly selected tests
            if (testIds.length > 0) {
                const dataToInsert = testIds.map(testId => ({
                    packageId: packageId,
                    testId: testId
                }));
                await tx.packageTest.createMany({
                    data: dataToInsert
                });
            }
        });

        revalidatePath('/packages');
        return { success: true, message: "Package updated successfully!" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}