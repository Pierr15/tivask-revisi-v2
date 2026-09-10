import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prismaClient';
import { z } from 'zod';

const createKbSchema = z.object({
  category: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(1),
  validUntil: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  keywords: z.array(z.string()).optional(),
});

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, isActive } = req.query;
    
    let where: any = {};
    if (category) {
      where.category = category;
    }
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const data = await prisma.knowledgeBaseEntry.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createKbSchema.parse(req.body);

    const data = await prisma.knowledgeBaseEntry.create({
      data: {
        category: parsed.category,
        title: parsed.title,
        content: parsed.content,
        validUntil: parsed.validUntil ? new Date(parsed.validUntil) : null,
        isActive: parsed.isActive ?? true,
        keywords: parsed.keywords ?? [],
      }
    });

    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const parsed = createKbSchema.partial().parse(req.body);

    const existing = await prisma.knowledgeBaseEntry.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Entry not found' } });
    }

    const data = await prisma.knowledgeBaseEntry.update({
      where: { id },
      data: {
        category: parsed.category,
        title: parsed.title,
        content: parsed.content,
        validUntil: parsed.validUntil !== undefined ? (parsed.validUntil ? new Date(parsed.validUntil) : null) : undefined,
        isActive: parsed.isActive,
        keywords: parsed.keywords,
      }
    });

    res.json({ data });
  } catch (err) {
    next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const existing = await prisma.knowledgeBaseEntry.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Entry not found' } });
    }

    // Usually we soft disable
    await prisma.knowledgeBaseEntry.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
