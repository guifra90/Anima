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
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://anima-os.local', // Optional, per la dashboard OpenRouter
        'X-Title': 'ANIMA Agency OS',             // Optional
      }
    });
  }

  /**
   * Chat interaction
   * @param {Array} messages - [{ role, content }]
   * @param {string} system - System prompt
   * @param {Object} options - { model: 'deepseek/deepseek-r1', maxTokens: 1000 }
   */
  async chat(messages, system, options = {}) {
    const model = options.model || this.config.model || 'google/gemini-2.0-flash-001';
    const msgs = this.formatMessagesWithSystem(messages, system);
    
    try {
      const completionOptions = {
        model,
        max_tokens: options.max_tokens || options.maxTokens || 4000,
        messages: msgs,
      };

      // Supporto Tool Calling (OpenRouter supporta il formato OpenAI)
      if (options.tools && options.tools.length > 0) {
        completionOptions.tools = options.tools.map(t => ({
          type: 'function',
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters || t.input_schema
          }
        }));
        completionOptions.tool_choice = 'auto';
      }

      const response = await this.client.chat.completions.create(completionOptions);
      const message = response.choices[0].message;

      // Se il modello restituisce tool_calls, li formattiamo per ANIMA
      if (message.tool_calls) {
        return {
          content: message.content || '',
          tool_calls: message.tool_calls.map(tc => ({
            id: tc.id,
            name: tc.function.name,
            args: JSON.parse(tc.function.arguments)
          }))
        };
      }
      
      return message.content;
    } catch (err) {
      console.error(`  [OpenRouterAdapter] Error:`, err.message);
      throw err;
    }
  }
}

module.exports = OpenRouterAdapter;
