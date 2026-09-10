import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prismaClient';
import { z } from 'zod';

const createMenuSchema = z.object({
  label: z.string().min(1),
  order: z.number().int(),
  categoryRef: z.string().min(1),
  isActive: z.boolean().optional(),
});

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await prisma.menuItem.findMany({
      orderBy: { order: 'asc' },
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createMenuSchema.parse(req.body);

    const categoryExists = await prisma.knowledgeBaseEntry.findFirst({
      where: { category: parsed.categoryRef }
    });

    if (!categoryExists) {
      return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Category reference does not exist in Knowledge Base' } });
    }

    const data = await prisma.menuItem.create({
      data: {
        label: parsed.label,
        order: parsed.order,
        categoryRef: parsed.categoryRef,
        isActive: parsed.isActive ?? true,
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
    const parsed = createMenuSchema.partial().parse(req.body);

    const existing = await prisma.menuItem.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Menu item not found' } });
    }

    if (parsed.categoryRef) {
      const categoryExists = await prisma.knowledgeBaseEntry.findFirst({
        where: { category: parsed.categoryRef }
      });
      if (!categoryExists) {
        return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Category reference does not exist in Knowledge Base' } });
      }
    }

    const data = await prisma.menuItem.update({
      where: { id },
      data: parsed
    });

    res.json({ data });
  } catch (err) {
    next(err);
  }
};
