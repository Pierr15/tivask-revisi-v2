import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prismaClient';
import { logoutWhatsApp } from '../whatsapp/whatsappService';

export const getStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await prisma.whatsAppSession.findFirst();
    if (!session) {
      return res.json({ status: 'disconnected', qrDataUrl: null, phoneNumber: null });
    }
    
    // the QR data URL might be stored in memory in a robust app, but for simplicity here
    // let's assume we can get it from the service
    const { qrDataUrl } = require('../whatsapp/whatsappService');

    res.json({
      status: session.status,
      qrDataUrl: session.status === 'pairing' ? qrDataUrl : null,
      phoneNumber: session.phoneNumber
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const success = await logoutWhatsApp();
    if (!success) {
      return res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to logout WhatsApp' } });
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
