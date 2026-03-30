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
    const model = options.model || this.config.model || 'deepseek/deepseek-r1';
    const msgs = this.formatMessagesWithSystem(messages, system);
    
    try {
      const response = await this.client.chat.completions.create({
        model,
        max_tokens: options.maxTokens || 8000,
        messages: msgs,
        // OpenRouter non supporta sempre system_fingerprint o altri parametri OpenAI specifici
      });
      
      return response.choices[0].message.content;
    } catch (err) {
      console.error(`  [OpenRouterAdapter] Error:`, err.message);
      throw err;
    }
  }
}

module.exports = OpenRouterAdapter;
