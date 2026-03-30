const BaseAdapter = require('./BaseAdapter');

/**
 * OllamaAdapter - Adapter for local Ollama API
 */
class OllamaAdapter extends BaseAdapter {
  constructor(config = {}) {
    super(config);
    this.endpoint = config.endpoint || process.env.OLLAMA_ENDPOINT || 'http://localhost:11434';
  }

  /**
   * Chat interaction
   * @param {Array} messages - [{ role, content }]
   * @param {string} system - System prompt
   * @param {Object} options - { model: 'llama3.1:8b', maxTokens: 1000 }
   */
  async chat(messages, system, options = {}) {
    const model = options.model || this.config.model || 'llama3.1:8b';
    const msgs = this.formatMessagesWithSystem(messages, system);

    try {
      const response = await fetch(`${this.endpoint}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: msgs.map(m => ({
            role: m.role,
            content: m.content
          })),
          stream: false,
          options: {
            num_predict: options.maxTokens || 1000
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Ollama API error: ${response.status} ${errText}`);
      }

      const data = await response.json();
      return data.message.content;

    } catch (err) {
      console.error(`  [OllamaAdapter] Error:`, err.message);
      throw err;
    }
  }
}

module.exports = OllamaAdapter;
