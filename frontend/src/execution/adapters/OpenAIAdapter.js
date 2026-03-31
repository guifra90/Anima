const BaseAdapter = require('./BaseAdapter');
const OpenAI = require('openai');

/**
 * OpenAIAdapter - Adapter for OpenAI API (GPT-4, GPT-4o, etc.)
 */
class OpenAIAdapter extends BaseAdapter {
  constructor(config = {}) {
    super(config);
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY non trovata nella configurazione o in .env');
    }
    this.client = new OpenAI({ apiKey: this.apiKey });
  }

  /**
   * Chat interaction
   * @param {Array} messages - [{ role, content }]
   * @param {string} system - System prompt
   * @param {Object} options - { model: 'gpt-4o', maxTokens: 1000 }
   */
  async chat(messages, system, options = {}) {
    const model = options.model || this.config.model || 'gpt-4o-mini';
    const msgs = this.formatMessagesWithSystem(messages, system);
    
    const response = await this.client.chat.completions.create({
      model,
      max_tokens: options.maxTokens || 1000,
      messages: msgs,
    });
    return response.choices[0].message.content;
  }
}

module.exports = OpenAIAdapter;
