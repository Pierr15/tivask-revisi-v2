import { prisma } from '../lib/prismaClient';
import { processQuery } from './RagService';
import { createOrGetPendingEscalation } from './EscalationService';
import { sendTextMessage } from '../whatsapp/whatsappService';

const SENSITIVE_KEYWORDS = ['komplain', 'nomor pendaftaran', 'data pribadi'];

export const handleIncomingMessage = async (
  contactPhone: string,
  contactName: string | undefined,
  body: string,
  externalMessageId: string
) => {
  // Check duplicate via unique constraint logic manually here or rely on DB constraint
  const existingMsg = await prisma.message.findUnique({
    where: { externalMessageId }
  });
  if (existingMsg) {
    console.log('Duplicate message ignored:', externalMessageId);
    return;
  }

  // Find or create conversation
  let conversation = await prisma.conversation.findFirst({
    where: { contactPhone }
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        contactPhone,
        contactName,
        status: 'active'
      }
    });
  }

  // Insert message
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      sender: 'user',
      content: body,
      externalMessageId
    }
  });

  // If escalated, do not auto reply
  if (conversation.status === 'escalated') {
    return;
  }

  const trimmedBody = body.trim().toLowerCase();

  // Check sensitive keywords first
  if (SENSITIVE_KEYWORDS.some(kw => trimmedBody.includes(kw))) {
    const { created } = await createOrGetPendingEscalation(conversation.id, 'sensitive_keyword');
    if (created) {
      await sendTextMessage(contactPhone, 'Pertanyaan Anda mengandung informasi sensitif dan telah diteruskan ke panitia. Mohon tunggu balasan.');
    }
    return;
  }

  // Very basic deterministic menu check (Menu / 0 or numbers)
  // Proper Menu logic involves tracking snapshot and categories, but for hackathon a simplified approach:
  const menuMatch = trimmedBody.match(/^(?:(?:nomor|menu)\s+)?([0-9]+)\.?$/);
  
  if (menuMatch) {
    const num = parseInt(menuMatch[1], 10);
    if (num === 0 || trimmedBody === 'menu') {
      // Send main menu
      await sendMainMenu(contactPhone, conversation.id);
      return;
    }

    // Handle sub-menu or item selection
    await handleMenuSelection(contactPhone, conversation.id, num);
    return;
  }

  // Otherwise, it's free text. Process with RAG.
  const ragResult = await processQuery(body, conversation.id);

  if (ragResult.grounded && ragResult.answer) {
    const primarySourceId = ragResult.sourceKbIds?.[0]; // Simplified tie-break
    
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        sender: 'bot',
        content: ragResult.answer,
        matchedKbId: primarySourceId,
        groundingStatus: 'grounded'
      }
    });
    await sendTextMessage(contactPhone, ragResult.answer);
  } else {
    // Fallback
    const { created } = await createOrGetPendingEscalation(conversation.id, ragResult.reason || 'not_grounded');
    
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        sender: 'bot',
        content: 'Fallback triggered',
        groundingStatus: 'fallback'
      }
    });

    if (created) {
      await sendTextMessage(contactPhone, 'Maaf, informasi tidak ditemukan atau belum tersedia. Pertanyaan Anda telah diteruskan ke panitia.');
    }
  }
};

const sendMainMenu = async (contactPhone: string, conversationId: string) => {
  const menus = await prisma.menuItem.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' }
  });

  if (menus.length === 0) {
    await sendTextMessage(contactPhone, 'Menu belum tersedia.');
    return;
  }

  let text = 'Halo! Berikut adalah Menu Utama:\n\n';
  menus.forEach((m, idx) => {
    text += `${idx + 1}. ${m.label}\n`;
  });
  text += '\nBalas dengan angka pilihan Anda.';

  // Save snapshot to conversation
  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      menuState: {
        level: 'main',
        options: menus.map((m, idx) => ({ number: idx + 1, targetId: m.id, categoryRef: m.categoryRef }))
      }
    }
  });

  await sendTextMessage(contactPhone, text);
};

const handleMenuSelection = async (contactPhone: string, conversationId: string, choice: number) => {
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation || !conversation.menuState) {
    await sendMainMenu(contactPhone, conversationId);
    return;
  }

  const state = conversation.menuState as any;
  const option = state.options?.find((o: any) => o.number === choice);

  if (!option) {
    await sendTextMessage(contactPhone, 'Pilihan tidak valid. Ketik "0" atau "menu" untuk kembali ke awal.');
    return;
  }

  if (state.level === 'main') {
    // Show sub-menu
    const entries = await prisma.knowledgeBaseEntry.findMany({
      where: {
        category: option.categoryRef,
        isActive: true,
        OR: [
          { validUntil: null },
          { validUntil: { gte: new Date() } }
        ]
      },
      orderBy: { title: 'asc' }
    });

    if (entries.length === 0) {
      await sendTextMessage(contactPhone, 'Informasi untuk kategori ini belum tersedia.');
      return;
    }

    let text = `Pilih informasi mengenai ${option.categoryRef}:\n\n`;
    entries.forEach((e, idx) => {
      text += `${idx + 1}. ${e.title}\n`;
    });
    
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        menuState: {
          level: 'entries',
          options: entries.map((e, idx) => ({ number: idx + 1, targetId: e.id }))
        }
      }
    });

    await sendTextMessage(contactPhone, text);
  } else if (state.level === 'entries') {
    // Show content
    const entry = await prisma.knowledgeBaseEntry.findUnique({
      where: { id: option.targetId }
    });

    if (!entry || !entry.isActive || (entry.validUntil && entry.validUntil < new Date())) {
      await sendTextMessage(contactPhone, 'Informasi sudah tidak tersedia.');
      return;
    }

    await prisma.message.create({
      data: {
        conversationId: conversationId,
        sender: 'bot',
        content: entry.content,
        matchedKbId: entry.id,
        groundingStatus: 'n_a'
      }
    });

    await sendTextMessage(contactPhone, entry.content);
  }
};
