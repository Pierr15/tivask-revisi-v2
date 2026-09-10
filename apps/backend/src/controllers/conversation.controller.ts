import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prismaClient';
import { z } from 'zod';
import { sendTextMessage } from '../whatsapp/whatsappService';

const replySchema = z.object({
  content: z.string().min(1),
});

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    
    let where: any = {};
    if (status && typeof status === 'string') {
      where.status = status;
    }

    const data = await prisma.conversation.findMany({
      where,
      orderBy: { lastMessageAt: 'desc' },
      include: {
        escalations: {
          where: { status: 'pending' },
          take: 1
        }
      }
    });

    // map to ConversationSummary
    const summary = data.map(c => ({
      id: c.id,
      contactPhone: c.contactPhone,
      contactName: c.contactName,
      status: c.status,
      lastMessageAt: c.lastMessageAt,
      pendingEscalationId: c.escalations.length > 0 ? c.escalations[0].id : null
    }));

    res.json({ data: summary });
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        escalations: { orderBy: { createdAt: 'asc' } }
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Conversation not found' } });
    }

    const pendingEscalation = conversation.escalations.find(e => e.status === 'pending');

    res.json({
      data: {
        conversation: {
          id: conversation.id,
          contactPhone: conversation.contactPhone,
          contactName: conversation.contactName,
          status: conversation.status,
          lastMessageAt: conversation.lastMessageAt,
        },
        messages: conversation.messages,
        escalations: conversation.escalations,
        pendingEscalationId: pendingEscalation ? pendingEscalation.id : null,
      }
    });
  } catch (err) {
    next(err);
  }
};

export const reply = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { content } = replySchema.parse(req.body);

    const conversation = await prisma.conversation.findUnique({ where: { id } });
    if (!conversation) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Conversation not found' } });
    }

    // Try sending WA message first
    const sent = await sendTextMessage(conversation.contactPhone, content);
    if (!sent) {
      return res.status(400).json({ error: { code: 'WHATSAPP_ERROR', message: 'Failed to send WhatsApp message. Ensure session is connected.' } });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        sender: 'admin',
        content,
      }
    });

    await prisma.conversation.update({
      where: { id },
      data: { lastMessageAt: new Date() }
    });

    res.json({ data: message });
  } catch (err) {
    next(err);
  }
};
