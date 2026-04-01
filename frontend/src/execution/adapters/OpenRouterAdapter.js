const BaseAdapter = require('./BaseAdapter');
const OpenAI = require('openai');

/**
 * OpenRouterAdapter - Adapter for OpenRouter API (Cloud Open Source Models)
 */
class OpenRouterAdapter extends BaseAdapter {
  constructor(config = {}) {
    super(config);
    this.apiKey = config.apiKey || process.env.OPENROUTER_API_KEY;
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY non trovata nella configurazione o in .env');
    }
    
    // OpenRouter uses OpenAI SDK but with its own base URL
    this.client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: config.baseUrl || 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://anima-os.local', // Optional, per la dashboard OpenRouter
        'X-Title': 'ANIMA Agency OS',             // Optional
      }
    });
  }

  /**
   * Pulisce lo schema per i provider più rigidi (Gemini/Claude).
   * Converte 'number' in 'integer' per i parametri di conteggio e assicura 'required'.
   */
  cleanSchema(schema) {
    if (!schema || typeof schema !== 'object') return schema;
    
    const cleaned = { ...schema };
    
    // Assicurati che 'required' sia un array
    if (!cleaned.required) cleaned.required = [];
    
    // Fix Paperclip: Impedisci proprietà aggiuntive non dichiarate (richiesto da molti modelli Gemini/Claude)
    cleaned.additionalProperties = false;
    
    if (cleaned.properties) {
      for (const [key, prop] of Object.entries(cleaned.properties)) {
        // Se la proprietà è un oggetto, puliscilo ricorsivamente
        if (prop.type === 'object') {
          cleaned.properties[key] = this.cleanSchema(prop);
        }
        
        // Fix Paperclip: Gemini preferisce 'integer' per i parametri numerici di controllo
        if (prop.type === 'number' && (key.toLowerCase().includes('limit') || key.toLowerCase().includes('max') || key.toLowerCase().includes('results'))) {
          prop.type = 'integer';
        }
        
        // Rimuovi campi non standard che OpenRouter/Gemini potrebbero rifiutare
        delete prop.default;
        delete prop.example;
      }
    }
    
    return cleaned;
  }

  /**
   * Chat interaction
   * @param {Array} messages - [{ role, content }]
   * @param {string} system - System prompt
   * @param {Object} options - { model: 'deepseek/deepseek-r1', maxTokens: 1000 }
   */
  async chat(messages, system, options = {}) {
    const model = options.model || this.config.model || 'google/gemini-2.0-flash-001';
    
    // Paperclip Robust Messaging: Avoid duplicate system prompts
    let msgs = [...messages];
    if (system) {
      const hasSystem = msgs.some(m => m.role === 'system');
      if (!hasSystem) {
        msgs.unshift({ role: 'system', content: system });
      } else {
        // Update existing system message instead of adding new one
        msgs = msgs.map(m => m.role === 'system' ? { ...m, content: `${system}\n\n${m.content}` } : m);
      }
    }
    
    try {
      // 2. Coerenza Totale (v5): Sostituzione dei due punti con doppio underscore in TUTTA la history.
      // Questo evita che OpenRouter riceva messaggi passati con nomi non definiti nel payload attuale.
      const sanitizedMessages = msgs.map(m => {
        const newMsg = { ...m };
        
        // Se il messaggio ha tool_calls, rinominale
        if (newMsg.tool_calls) {
          newMsg.tool_calls = newMsg.tool_calls.map(tc => ({
            ...tc,
            function: {
              ...tc.function,
              name: tc.function.name.replace(/:/g, '__')
            }
          }));
        }
        
        // Se è un messaggio di tipo 'tool', rinomina il nome del tool
        if (newMsg.role === 'tool' && newMsg.name) {
          newMsg.name = newMsg.name.replace(/:/g, '__');
        }
        
        return newMsg;
      });

      const completionOptions = {
        model,
        max_tokens: options.max_tokens || options.maxTokens || 4000, // Esteso per missioni multi-agente
        messages: sanitizedMessages,
        temperature: options.temperature ?? 0.7,
      };

      // Supporto Tool Calling
      if (options.tools && options.tools.length > 0) {
        completionOptions.tools = options.tools.map(t => ({
          type: 'function',
          function: {
            name: t.name.replace(/:/g, '__'),
            description: t.description,
            parameters: this.cleanSchema(t.parameters || t.input_schema)
          }
        }));
      }

      // Payload Dumper for Debugging (v5)
      try {
        const fs = await import('fs');
        fs.writeFileSync('/tmp/last_openrouter_payload.json', JSON.stringify({ 
          timestamp: new Date().toISOString(),
          completionOptions 
        }, null, 2));
      } catch (e) {}

      const response = await this.client.chat.completions.create(completionOptions);
      const message = response.choices[0].message;

      // 3. Reversion (v5): Converti i nomi dei tool nella risposta da '__' a ':' 
      // per mantenere la compatibilità con l'executor di ANIMA.
      if (message.tool_calls) {
        message.tool_calls = message.tool_calls.map(tc => ({
          ...tc,
          function: {
            ...tc.function,
            name: tc.function.name.replace(/__/g, ':')
          }
        }));
      }

      return message;
    } catch (err) {
      console.error(`  [OpenRouterAdapter] Error:`, err.message);
      throw err;
    }
  }
}

module.exports = OpenRouterAdapter;
