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
      const body = {
        model,
        messages: msgs.map(m => {
          const msg = { role: m.role, content: m.content || "" };
          if (m.tool_calls) {
            msg.tool_calls = m.tool_calls.map(tc => ({
              type: 'function',
              function: {
                name: tc.name,
                arguments: typeof tc.args === 'string' ? tc.args : JSON.stringify(tc.args)
              }
            }));
          }
          return msg;
        }),
        stream: false,
        options: {
          num_predict: options.maxTokens || 1000
        }
      };

      // Supporto Tool Calling (Ollama v0.3.0+)
      if (options.tools && options.tools.length > 0) {
        body.tools = options.tools.map(t => ({
          type: 'function',
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters || t.input_schema
          }
        }));
      }

      const response = await fetch(`${this.endpoint}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Ollama API error: ${response.status} ${errText}`);
      }

      const data = await response.json();
      const message = data.message;

      // Se il modello restituisce tool_calls, li formattiamo per ANIMA
      if (message.tool_calls) {
        return {
          content: message.content || '',
          tool_calls: message.tool_calls.map(tc => ({
            name: tc.function.name,
            args: typeof tc.function.arguments === 'string' 
              ? JSON.parse(tc.function.arguments) 
              : tc.function.arguments
          }))
        };
      }

      return message.content;

    } catch (err) {
      console.error(`  [OllamaAdapter] Error:`, err.message);
      throw err;
    }
  }
}

module.exports = OllamaAdapter;
