"use server";

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

export async function getClientThreads() {
  try {
    const { orgId } = await requireAuth();
    return await prisma.supportThread.findMany({
      where: { organizationId: orgId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
      orderBy: { updatedAt: 'desc' }
    });
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getSuperAdminThreads() {
  try {
    const { orgId } = await requireAuth();
    if (orgId !== 1) throw new Error("Unauthorized");

    return await prisma.supportThread.findMany({
      include: { 
        // 🚨 UPDATED: Now fetches the ID, Email, and Phone for the Super Admin view!
        organization: { select: { id: true, name: true, email: true, phone: true } },
        messages: { orderBy: { createdAt: 'asc' } } 
      },
      orderBy: { updatedAt: 'desc' }
    });
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function createThread(title: string, type: string, initialMessage: string) {
  try {
    const { orgId } = await requireAuth();
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    
    await prisma.supportThread.create({
      data: {
        organizationId: orgId,
        title: title,
        type: type,
        messages: {
          create: {
            senderName: org?.name || "Clinic Admin",
            content: initialMessage,
            isFromSuperAdmin: false
          }
        }
      }
    });
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to create ticket." };
  }
}

export async function replyToThread(threadId: number, content: string) {
  try {
    const { orgId } = await requireAuth();
    const isSuperAdmin = orgId === 1;
    const senderName = isSuperAdmin ? "Master HQ" : "Clinic Admin";

    await prisma.supportMessage.create({
      data: {
        threadId, senderName, isFromSuperAdmin: isSuperAdmin, content
      }
    });

    await prisma.supportThread.update({
      where: { id: threadId },
      data: { updatedAt: new Date(), status: isSuperAdmin ? "Answered" : "Open" }
    });
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to send message." };
  }
}