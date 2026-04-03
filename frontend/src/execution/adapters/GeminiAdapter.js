const BaseAdapter = require('./BaseAdapter');
const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * GeminiAdapter - Adapter for Google Gemini API
 */
class GeminiAdapter extends BaseAdapter {
  constructor(config = {}) {
    super(config);
    this.apiKey = config.apiKey || process.env.GEMINI_API_KEY;
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY non trovata nella configurazione o in .env');
    }
    this.genAI = new GoogleGenerativeAI(this.apiKey);
  }

  /**
   * Chat interaction
   * @param {Array} messages - [{ role, content }]
   * @param {string} system - System prompt
   * @param {Object} options - { model: 'gemini-2.0-flash', maxTokens: 1000, tools: [], toolConfig: {} }
   */
  async chat(messages, system, options = {}) {
    const modelName = options.model || this.config.model || 'gemini-2.0-flash';
    const apiVer = 'v1beta';
    
    const modelConfig = { model: modelName };
    
    // Tools support
    if (options.tools && options.tools.length > 0) {
      // Gemini expects functionDeclarations inside a tools array
      modelConfig.tools = [{
        functionDeclarations: options.tools.map(t => ({
          name: t.name.replace(/:/g, '__'), // Gemini doesn't like colons in names
          description: t.description,
          parameters: t.parameters || t.input_schema
        }))
      }];
      
      if (options.toolConfig) {
        modelConfig.toolConfig = options.toolConfig;
      }
    }

    const model = this.genAI.getGenerativeModel(modelConfig, { apiVersion: apiVer });

    // Format messages
    let historyMessages = [...messages];
    
    // Inject system prompt
    if (system && historyMessages.length > 0) {
      // If the first message is a system message already, replace it, otherwise unshift
      if (historyMessages[0].role === 'system') {
        historyMessages[0].content = system;
      } else {
        historyMessages[0].content = `[SYSTEM INSTRUCTION]\n${system}\n\n[USER INPUT]\n${historyMessages[0].content}`;
      }
    }

    // Convert from ANIMA message format to Gemini format
    const history = historyMessages.slice(0, -1).map(m => {
      let role = 'user';
      if (m.role === 'assistant' || m.role === 'model') role = 'model';
      
      const parts = [];
      if (m.content) parts.push({ text: m.content });
      if (m.tool_calls) {
        parts.push(...m.tool_calls.map(tc => ({
          functionCall: {
            name: tc.name.replace(/:/g, '__'),
            args: tc.args
          }
        })));
      }
      if (m.role === 'tool') {
        role = 'user'; // Gemini expects tool results in 'user' role but with functionResponse part
        parts.push({
          functionResponse: {
            name: m.name.replace(/:/g, '__'),
            response: { content: m.content }
          }
        });
      }

      return { role, parts };
    });

    const lastMessage = historyMessages[historyMessages.length - 1];
    const lastMessageParts = [{ text: lastMessage.content }];
    
    const chatSession = model.startChat({ history });

    // Function for retries on 429/503
    const sendMessageWithRetry = async (parts, retries = 3, delay = 2000) => {
      try {
        return await chatSession.sendMessage(parts);
      } catch (err) {
        if ((err.message.includes('429') || err.message.includes('503')) && retries > 0) {
          console.log(`  [GeminiAdapter] Temporary Error (${err.message.includes('429') ? '429' : '503'}). Retrying in ${delay/1000}s... (${retries} left)`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return sendMessageWithRetry(parts, retries - 1, delay * 2);
        }
        throw err;
      }
    };

    const result = await sendMessageWithRetry(lastMessageParts);
    const response = result.response;
    const candidate = response.candidates[0];
    
    if (candidate.content && candidate.content.parts) {
      const parts = candidate.content.parts;
      const textPart = parts.find(p => p.text);
      const callParts = parts.filter(p => p.functionCall);

      const usage = response.usageMetadata || {};
      
      const standardizedUsage = {
        prompt_tokens: usage.promptTokenCount || 0,
        completion_tokens: usage.candidatesTokenCount || 0,
        total_tokens: usage.totalTokenCount || 0
      };

      if (callParts.length > 0) {
        return {
          content: textPart ? textPart.text : '',
          tool_calls: callParts.map(cp => ({
            name: cp.functionCall.name.replace(/__/g, ':'), // Restore original name
            args: cp.functionCall.args
          })),
          usage: standardizedUsage
        };
      }
      return {
        content: textPart ? textPart.text : '',
        usage: standardizedUsage
      };
    }

    const usage = response.usageMetadata || {};
    return {
      content: response.text(),
      usage: {
        prompt_tokens: usage.promptTokenCount || 0,
        completion_tokens: usage.candidatesTokenCount || 0,
        total_tokens: usage.totalTokenCount || 0
      }
    };
  }
}

module.exports = GeminiAdapter;
