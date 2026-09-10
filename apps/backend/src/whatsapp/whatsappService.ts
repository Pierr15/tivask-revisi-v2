import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import qrcode from 'qrcode';
import { prisma } from '../lib/prismaClient';
import { handleIncomingMessage } from '../services/ChatService';

export let qrDataUrl: string | null = null;
let client: Client | null = null;

export const initWhatsAppClient = () => {
  client = new Client({
    authStrategy: new LocalAuth({ dataPath: '.wwebjs_auth' }),
    puppeteer: {
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  });

  client.on('qr', async (qr) => {
    qrDataUrl = await qrcode.toDataURL(qr);
    console.log('QR Code generated. Please scan it.');
    await updateSession('pairing', null);
  });

  client.on('ready', async () => {
    qrDataUrl = null;
    console.log('WhatsApp Client is ready!');
    const info = client?.info;
    await updateSession('connected', info?.wid?.user || null);
  });

  client.on('authenticated', () => {
    console.log('WhatsApp Authenticated');
  });

  client.on('auth_failure', async (msg) => {
    console.error('WhatsApp Auth failure', msg);
    await updateSession('disconnected', null);
  });

  client.on('disconnected', async (reason) => {
    console.log('WhatsApp Disconnected:', reason);
    await updateSession('disconnected', null);
    client?.initialize(); // Attempt to reconnect or regenerate QR
  });

  client.on('message', async (message: Message) => {
    try {
      // PRD filters: self, group, broadcast, stale, empty, media
      if (message.fromMe || message.isStatus || message.broadcast) return;
      if (message.from.includes('@g.us')) return; // ignore groups

      // Stale check (5 mins)
      const now = Math.floor(Date.now() / 1000);
      if (now - message.timestamp > 300) return; 

      if (message.hasMedia) {
        await sendTextMessage(message.from.split('@')[0], 'Saat ini asisten hanya dapat merespons pesan berupa teks. Silakan ketik pertanyaan Anda.');
        return;
      }

      const body = message.body?.trim();
      if (!body) return;

      if (body.length > 1000) {
        await sendTextMessage(message.from.split('@')[0], 'Pesan Anda terlalu panjang. Mohon persingkat.');
        return;
      }

      const contactPhone = message.from.split('@')[0];
      const contact = await message.getContact();
      const contactName = contact?.pushname || contact?.name || undefined;
      const externalMessageId = message.id._serialized;

      await handleIncomingMessage(contactPhone, contactName, body, externalMessageId);
    } catch (err) {
      console.error('Error processing message:', err);
    }
  });

  client.initialize();
};

const updateSession = async (status: string, phoneNumber: string | null) => {
  const session = await prisma.whatsAppSession.findFirst();
  if (session) {
    await prisma.whatsAppSession.update({
      where: { id: session.id },
      data: { status, phoneNumber }
    });
  } else {
    await prisma.whatsAppSession.create({
      data: { status, phoneNumber }
    });
  }
};

export const logoutWhatsApp = async (): Promise<boolean> => {
  try {
    if (client) {
      await client.logout();
      await updateSession('disconnected', null);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Logout failed', error);
    return false;
  }
};

export const sendTextMessage = async (phoneNumber: string, content: string): Promise<boolean> => {
  if (!client || !client.info) return false;
  try {
    const chatId = `${phoneNumber}@c.us`;
    await client.sendMessage(chatId, content);
    return true;
  } catch (error) {
    console.error('Failed to send WA message', error);
    return false;
  }
};
