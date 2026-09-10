import { GoogleGenAI } from '@google/genai';
import { prisma } from '../lib/prismaClient';

export interface RagResponse {
  grounded: boolean;
  answer?: string;
  sourceKbIds?: string[];
  supportingEvidence?: Array<{ sourceKbId: string; text: string }>;
  reason?: string;
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

// Basic normalizer
function normalize(text: string) {
  return text.toLowerCase().replace(/[^\w\s]/gi, '');
}

export const processQuery = async (query: string, conversationId: string): Promise<RagResponse> => {
  const normQuery = normalize(query);
  const queryWords = normQuery.split(/\s+/).filter(w => w.length > 2);

  // 1. Retrieval
  // Fetch eligible KB entries
  const eligibleEntries = await prisma.knowledgeBaseEntry.findMany({
    where: {
      isActive: true,
      OR: [
        { validUntil: null },
        { validUntil: { gte: new Date() } }
      ]
    }
  });

  // Lexical scoring
  const scored = eligibleEntries.map(entry => {
    let score = 0;
    const normTitle = normalize(entry.title);
    const normContent = normalize(entry.content);
    const normCategory = normalize(entry.category);
    const normKeywords = entry.keywords.map(normalize);

    queryWords.forEach(word => {
      if (normTitle.includes(word)) score += 3;
      if (normCategory.includes(word)) score += 2;
      if (normKeywords.some(k => k.includes(word))) score += 3;
      if (normContent.includes(word)) score += 1;
    });

    return { entry, score };
  });

  const THRESHOLD = 1;
  const filtered = scored.filter(s => s.score >= THRESHOLD).sort((a, b) => b.score - a.score);

  if (filtered.length === 0) {
    return { grounded: false, reason: 'no_evidence' };
  }

  // Evidence Selection (Top-3)
  const topK = filtered.slice(0, 3);
  
  // 2. Context Construction
  const contextText = topK.map(item => `[KB:${item.entry.id}] ${item.entry.title}: ${item.entry.content}`).join('\n\n');

  // 3. Gemini Call
  const systemInstruction = `You are a school virtual assistant answering questions based ONLY on the provided evidence.
If the evidence is not sufficient to answer the query, DO NOT make up an answer.
Return a structured JSON response.

Example of sufficient evidence:
{
  "grounded": true,
  "answer": "Pendaftaran dibuka tanggal 12 Juli.",
  "sourceKbIds": ["123"],
  "supportingEvidence": [
    { "sourceKbId": "123", "text": "Pendaftaran dibuka tanggal 12 Juli." }
  ]
}

Example of insufficient evidence:
{
  "grounded": false,
  "reason": "insufficient_evidence"
}

EVIDENCE:
${contextText}
`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: query,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      }
    });

    const resultText = response.text;
    if (!resultText) {
      return { grounded: false, reason: 'technical_error' };
    }

    const parsed = JSON.parse(resultText) as RagResponse;

    // 4. Grounding Validation
    if (!parsed.grounded) {
      return { grounded: false, reason: parsed.reason || 'not_grounded' };
    }

    if (!parsed.answer || !parsed.sourceKbIds || parsed.sourceKbIds.length === 0 || !parsed.supportingEvidence || parsed.supportingEvidence.length === 0) {
      return { grounded: false, reason: 'invalid_schema' };
    }

    // Verify attribution
    for (const sourceId of parsed.sourceKbIds) {
      if (!topK.find(item => item.entry.id === sourceId)) {
        return { grounded: false, reason: 'invalid_source_id' };
      }
    }

    for (const ev of parsed.supportingEvidence) {
      if (!parsed.sourceKbIds.includes(ev.sourceKbId)) {
        return { grounded: false, reason: 'invalid_supporting_evidence' };
      }
      const source = topK.find(item => item.entry.id === ev.sourceKbId);
      if (!source) {
        return { grounded: false, reason: 'invalid_supporting_evidence' };
      }
      // Exact substring match check (trimmed)
      const trimmedEv = ev.text.trim();
      if (!source.entry.content.includes(trimmedEv)) {
        return { grounded: false, reason: 'invalid_supporting_evidence' };
      }
    }

    return parsed;
  } catch (err) {
    console.error('Gemini error:', err);
    return { grounded: false, reason: 'technical_error' };
  }
};
