import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prismaClient';

export const resolve = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Resolve pending escalation and update conversation status to active atomically
    // Transaction to ensure atomicity
    const data = await prisma.$transaction(async (tx) => {
      const escalation = await tx.escalation.findUnique({ where: { id } });
      if (!escalation) {
        throw new Error('NOT_FOUND');
      }

      if (escalation.status === 'handled') {
        return escalation; // already handled
      }

      // Lock conversation (PostgreSQL specific: SELECT ... FOR UPDATE, 
      // but Prisma doesn't have an explicit FOR UPDATE yet in $transaction easily unless raw query. 
      // We'll rely on Prisma's sequential execution in transaction for now, or raw query.)
      await tx.$executeRaw`SELECT * FROM "Conversation" WHERE id = ${escalation.conversationId} FOR UPDATE`;

      const updatedEsc = await tx.escalation.update({
        where: { id },
        data: {
          status: 'handled',
          resolvedAt: new Date()
        }
      });

      await tx.conversation.update({
        where: { id: escalation.conversationId },
        data: { status: 'active' }
      });

      return updatedEsc;
    });

    res.json({ data });
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Escalation not found' } });
    }
    next(err);
  }
};
