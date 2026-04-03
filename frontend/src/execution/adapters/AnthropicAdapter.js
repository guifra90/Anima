const BaseAdapter = require('./BaseAdapter');
const Anthropic = require('@anthropic-ai/sdk');

/**
 * AnthropicAdapter - Adapter for Claude API
 */
class AnthropicAdapter extends BaseAdapter {
  constructor(config = {}) {
    super(config);
    this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY non trovata nella configurazione o in .env');
    }
    this.client = new Anthropic({ apiKey: this.apiKey });
  }

  /**
   * Chat interaction
   * @param {Array} messages - [{ role, content }]
   * @param {string} system - System prompt
   * @param {Object} options - { model: 'claude-3-5-sonnet-20240620', maxTokens: 1000 }
   */
  async chat(messages, system, options = {}) {
    const model = options.model || this.config.model || 'claude-3-5-sonnet-latest';
    const response = await this.client.messages.create({
      model,
      max_tokens: options.maxTokens || 1000,
      system: system || '',
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    });

    return {
      content: response.content[0].text,
      usage: {
        prompt_tokens: response.usage?.input_tokens || 0,
        completion_tokens: response.usage?.output_tokens || 0,
        total_tokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)
      }
    };
  }
}

module.exports = AnthropicAdapter;
