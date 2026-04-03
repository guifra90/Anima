/**
 * BaseAdapter - Abstract interface for LLM Adapters
 * All adapters must implement the 'chat' method.
 */
class BaseAdapter {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Chat interaction
   * @param {Array} messages - Array of { role, content } objects
   * @param {string} system - System prompt
   * @param {Object} options - Additional options (model, maxTokens, tools, etc.)
   * @returns {Promise<string|Object>} - The AI response text or tool call result
   */
  async chat(messages, system, options = {}) {
    throw new Error('Method "chat" must be implemented by concrete adapters.');
  }

  /**
   * Streaming chat interaction
   * @param {Array} messages 
   * @param {string} system 
   * @param {Object} options 
   * @param {Function} onToken - Callback for ciascun chunk di testo
   */
  async chatStream(messages, system, options = {}, onToken) {
    const result = await this.chat(messages, system, options);
    const text = typeof result === 'string' ? result : (result.content || "");
    if (onToken && text) onToken(text);
    return result;
  }

  /**
   * Utility to format messages for providers that allow a system message in the array
   * @param {Array} messages 
   * @param {string} system 
   * @returns {Array}
   */
  formatMessagesWithSystem(messages, system) {
    if (!system) return messages;
    return [{ role: 'system', content: system }, ...messages];
  }
}

module.exports = BaseAdapter;
