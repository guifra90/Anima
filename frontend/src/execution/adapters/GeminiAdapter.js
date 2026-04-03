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
   * Internal helper to prepare the model and formatted history
   */
  _prepareChat(messages, system, options) {
    const modelName = options.model || this.config.model || 'gemini-2.0-flash';
    const apiVer = 'v1beta';
    
    const modelConfig = { model: modelName };
    
    if (options.tools && options.tools.length > 0) {
      modelConfig.tools = [{
        functionDeclarations: options.tools.map(t => ({
          name: t.name.replace(/:/g, '__'),
          description: t.description,
          parameters: t.parameters || t.input_schema
        }))
      }];
      
      if (options.toolConfig) {
        modelConfig.toolConfig = options.toolConfig;
      }
    }

    const model = this.genAI.getGenerativeModel({
      ...modelConfig,
      systemInstruction: system ? { text: system } : undefined
    }, { apiVersion: apiVer });

    const formattedHistory = [];
    let lastRoleAdded = null;
    const filteredMessages = messages.filter(m => m.role !== 'system');

    for (let i = 0; i < filteredMessages.length - 1; i++) {
        const m = filteredMessages[i];
        let role = (m.role === 'assistant' || m.role === 'model') ? 'model' : 'user';
        
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
            role = 'user';
            parts.push({
                functionResponse: {
                    name: m.name.replace(/:/g, '__'),
                    response: { content: m.content }
                }
            });
        }

        if (lastRoleAdded === role) {
            formattedHistory[formattedHistory.length - 1].parts.push(...parts);
        } else {
            formattedHistory.push({ role, parts });
            lastRoleAdded = role;
        }
    }

    const lastMessage = filteredMessages[filteredMessages.length - 1];
    const lastMessageParts = [{ text: lastMessage.content || "" }];
    
    if (formattedHistory.length > 0 && lastRoleAdded === 'user') {
      const popped = formattedHistory.pop();
      lastMessageParts.unshift(...popped.parts);
    }
    
    if (formattedHistory.length > 0 && formattedHistory[0].role !== 'user') {
       formattedHistory.shift();
    }

    return { model, formattedHistory, lastMessageParts };
  }

  async chat(messages, system, options = {}) {
    const { model, formattedHistory, lastMessageParts } = this._prepareChat(messages, system, options);
    const chatSession = model.startChat({ history: formattedHistory });

    const sendMessageWithRetry = async (parts, retries = 3, delay = 2000) => {
      try { return await chatSession.sendMessage(parts); } 
      catch (err) {
        if ((err.message.includes('429') || err.message.includes('503')) && retries > 0) {
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
            name: cp.functionCall.name.replace(/__/g, ':'),
            args: cp.functionCall.args
          })),
          usage: standardizedUsage
        };
      }
      return { content: textPart ? textPart.text : '', usage: standardizedUsage };
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

  async chatStream(messages, system, options = {}, onToken) {
    const { model, formattedHistory, lastMessageParts } = this._prepareChat(messages, system, options);
    const chatSession = model.startChat({ history: formattedHistory });

    const result = await chatSession.sendMessageStream(lastMessageParts);
    
    let fullText = "";
    let toolCalls = null;

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        fullText += chunkText;
        if (onToken) onToken(chunkText);
      }
      
      const candidate = chunk.candidates?.[0];
      if (candidate?.content?.parts) {
        const calls = candidate.content.parts.filter(p => p.functionCall);
        if (calls.length > 0) {
           toolCalls = toolCalls || [];
           toolCalls.push(...calls.map(cp => ({
             name: cp.functionCall.name.replace(/__/g, ':'),
             args: cp.functionCall.args
           })));
        }
      }
    }

    const response = await result.response;
    const usage = response.usageMetadata || {};
    
    return {
      content: fullText,
      tool_calls: toolCalls,
      usage: {
        prompt_tokens: usage.promptTokenCount || 0,
        completion_tokens: usage.candidatesTokenCount || 0,
        total_tokens: usage.totalTokenCount || 0
      }
    };
  }
}

module.exports = GeminiAdapter;
