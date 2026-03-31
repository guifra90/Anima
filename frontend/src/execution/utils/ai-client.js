// execution/utils/ai-client.js
// Scopo: client AI unificato — cambia provider senza toccare gli agenti
// Versione 2: Gestito tramite Adapters e Registry

const adapterRegistry = require('../adapters/registry');
require('dotenv').config();

/**
 * Chat unificata via adapters
 * @param {Array|Object} arg1 - Messaggi (nuova firma) o oggetto config (vecchia firma)
 * @param {string} [arg2] - System prompt (nuova firma)
 * @param {Object} [arg3] - Opzioni extra (nuova firma)
 */
async function chat(arg1, arg2, arg3) {
  let messages, system, options;

  // Gestione firma flessibile per compatibilità
  if (Array.isArray(arg1)) {
    // Nuova firma: chat(messages, system, options)
    messages = arg1;
    system = arg2;
    options = arg3 || {};
  } else if (arg1 && typeof arg1 === 'object') {
    // Vecchia firma: chat({ system, messages, maxTokens })
    system = arg1.system;
    messages = arg1.messages;
    options = { maxTokens: arg1.maxTokens, model: process.env.AI_MODEL, provider: process.env.AI_PROVIDER };
  } else {
    throw new Error('Firma chat non valida. Usa chat(messages, system, options) o chat({system, messages})');
  }

  // Provider e Modello di default da .env se non specificati
  const provider = options.provider || process.env.AI_PROVIDER || 'gemini';
  
  // Recupero l'adapter dal registro
  // L'adapter_config può essere passato nelle opzioni (es. da anima_agents.adapter_config)
  const adapter = adapterRegistry.getAdapter(provider, options.adapter_config || {});

  try {
    return await adapter.chat(messages, system, options);
  } catch (err) {
    console.error(`[AI Client Error] Provider: ${provider}, Errore: ${err.message}`);
    throw err;
  }
}

module.exports = { chat };
