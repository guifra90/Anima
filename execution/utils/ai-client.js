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
    // Usiamo v1beta per i modelli 'latest' e '2.0', v1 per gli altri
    const apiVer = (MODEL.includes('latest') || MODEL.includes('2.0') || MODEL.includes('2.5')) ? 'v1beta' : 'v1';
    const model = genAI.getGenerativeModel({ model: MODEL }, { apiVersion: apiVer });

    // Copia i messaggi per non mutare l'originale
    let historyMessages = [...messages];
    
    // Se c'è un system prompt, lo inseriamo nel primo messaggio utente per massima compatibilità
    if (system && historyMessages.length > 0) {
      historyMessages[0].content = `[SYSTEM INSTRUCTION]\n${system}\n\n[USER INPUT]\n${historyMessages[0].content}`;
    }

    // Converte il formato messaggi ANIMA → formato Gemini
    const history = historyMessages.slice(0, -1).map(m => ({
      role:  m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
    const lastMessage = historyMessages[historyMessages.length - 1].content;

    const chatSession = model.startChat({ history });
    
    // Funzione interna per il retry in caso di 429
    const sendMessageWithRetry = async (msg, retries = 3, delay = 2000) => {
      try {
        return await chatSession.sendMessage(msg);
      } catch (err) {
        if ((err.message.includes('429') || err.message.includes('503')) && retries > 0) {
          console.log(`  [AI Client] Errore temporaneo (${err.message.includes('429') ? '429' : '503'}). Riprovo tra ${delay/1000}s... (${retries} tentativi rimasti)`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return sendMessageWithRetry(msg, retries - 1, delay * 2);
        }
        throw err;
      }
    };

    const result = await sendMessageWithRetry(lastMessage);
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
