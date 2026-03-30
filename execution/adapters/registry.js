const GeminiAdapter = require('./GeminiAdapter');
const AnthropicAdapter = require('./AnthropicAdapter');
const OpenAIAdapter = require('./OpenAIAdapter');
const OllamaAdapter = require('./OllamaAdapter');
const OpenRouterAdapter = require('./OpenRouterAdapter');

/**
 * AdapterRegistry - Manages and instantiates LLM adapters
 */
class AdapterRegistry {
  constructor() {
    this.adapters = {
      gemini: GeminiAdapter,
      anthropic: AnthropicAdapter,
      openai: OpenAIAdapter,
      ollama: OllamaAdapter,
      openrouter: OpenRouterAdapter
    };
    this.instances = new Map();
  }

  /**
   * Retrieves an adapter instance for the given provider
   * @param {string} provider - 'gemini', 'anthropic', 'openai', 'ollama'
   * @param {Object} config - Configuration for the adapter (apiKey, endpoint)
   * @returns {BaseAdapter}
   */
  getAdapter(provider, config = {}) {
    const providerLower = provider.toLowerCase();
    const AdapterClass = this.adapters[providerLower];

    if (!AdapterClass) {
      throw new Error(`Provider AI non supportato: ${provider}`);
    }

    // We create a unique key based on provider and config to cache instances if needed,
    // but since config can contain sensitive data, we'll just instantiate for now.
    // Or we can cache by agent_id if we have it.
    
    return new AdapterClass(config);
  }
}

module.exports = new AdapterRegistry();
