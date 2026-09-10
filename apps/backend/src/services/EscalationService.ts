import { prisma } from '../lib/prismaClient';

export const createOrGetPendingEscalation = async (conversationId: string, reason: string) => {
  return await prisma.$transaction(async (tx) => {
    // Check if there is an existing pending escalation
    const existing = await tx.escalation.findFirst({
      where: {
        conversationId,
        status: 'pending'
      }
    });

    if (existing) {
      // Ensure conversation is escalated
      await tx.conversation.update({
        where: { id: conversationId },
        data: { status: 'escalated' }
      });
      return { escalation: existing, created: false };
    }

    // Create new pending escalation
    const escalation = await tx.escalation.create({
      data: {
        conversationId,
        reason,
        status: 'pending'
      }
    });

    // Update conversation status
    await tx.conversation.update({
      where: { id: conversationId },
      data: { status: 'escalated' }
    });

    return { escalation, created: true };
  });
};
