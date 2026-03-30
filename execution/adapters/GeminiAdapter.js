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
   * @param {Object} options - { model: 'gemini-2.0-flash', maxTokens: 1000 }
   */
  async chat(messages, system, options = {}) {
    const modelName = options.model || this.config.model || 'gemini-2.0-flash';
    
    // Gemini handles v1beta for latest models and it's generally more reliable
    const apiVer = 'v1beta';
    
    const model = this.genAI.getGenerativeModel({ model: modelName }, { apiVersion: apiVer });

    // Format messages
    let historyMessages = [...messages];
    
    // Integration logic from original ai-client: inject system prompt into first message if needed
    if (system && historyMessages.length > 0) {
      historyMessages[0].content = `[SYSTEM INSTRUCTION]\n${system}\n\n[USER INPUT]\n${historyMessages[0].content}`;
    }

    // Convert from ANIMA message format to Gemini format
    const history = historyMessages.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
    const lastMessage = historyMessages[historyMessages.length - 1].content;

    const chatSession = model.startChat({ history });

    // Function for retries on 429/503
    const sendMessageWithRetry = async (msg, retries = 3, delay = 2000) => {
      try {
        return await chatSession.sendMessage(msg);
      } catch (err) {
        if ((err.message.includes('429') || err.message.includes('503')) && retries > 0) {
          console.log(`  [GeminiAdapter] Temporary Error (${err.message.includes('429') ? '429' : '503'}). Retrying in ${delay/1000}s... (${retries} left)`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return sendMessageWithRetry(msg, retries - 1, delay * 2);
        }
        throw err;
      }
    };

    const result = await sendMessageWithRetry(lastMessage);
    return result.response.text();
  }
}

module.exports = GeminiAdapter;
