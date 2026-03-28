// execution/utils/ai-client.js
// Scopo: client AI unificato — cambia provider senza toccare gli agenti
// Provider supportati: gemini, anthropic, openai
// Configurazione: AI_PROVIDER e AI_MODEL in .env

require('dotenv').config();

const PROVIDER = process.env.AI_PROVIDER || 'gemini';
const MODEL    = process.env.AI_MODEL    || 'gemini-2.0-flash';

async function chat({ system, messages, maxTokens = 1000 }) {

  // ── Google Gemini ──────────────────────────────────────────────────
  if (PROVIDER === 'gemini') {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY non trovata in .env');
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: MODEL,
      systemInstruction: system || '',
    });

    // Converte il formato messaggi ANIMA → formato Gemini
    const history = messages.slice(0, -1).map(m => ({
      role:  m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
    const lastMessage = messages[messages.length - 1].content;

    const chatSession = model.startChat({ history });
    const result      = await chatSession.sendMessage(lastMessage);
    return result.response.text();
  }

  // ── Anthropic Claude ───────────────────────────────────────────────
  if (PROVIDER === 'anthropic') {
    const Anthropic = require('@anthropic-ai/sdk');
    if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY non trovata in .env');
    }
    const client    = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response  = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system:     system || '',
      messages,
    });
    return response.content[0].text;
  }

  // ── OpenAI ─────────────────────────────────────────────────────────
  if (PROVIDER === 'openai') {
    const OpenAI = require('openai');
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY non trovata in .env');
    }
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const msgs   = system
      ? [{ role: 'system', content: system }, ...messages]
      : messages;
    const response = await client.chat.completions.create({
      model: MODEL,
      max_tokens: maxTokens,
      messages: msgs,
    });
    return response.choices[0].message.content;
  }

  throw new Error(`Provider AI non supportato: ${PROVIDER}`);
}

module.exports = { chat };
