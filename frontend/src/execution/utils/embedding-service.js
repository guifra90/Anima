const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * ANIMA Embedding Service — Unifica l'accesso ai modelli di embedding.
 * Gestisce sia il fallback locale (gratuito) che il futuro passaggio a Google.
 */

let transformersPipeline = null;

/**
 * Inizializza il motore locale se necessario.
 */
async function getLocalPipeline() {
  if (!transformersPipeline) {
    const { pipeline } = await import('@xenova/transformers');
    transformersPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return transformersPipeline;
}

/**
 * Genera un embedding per il testo fornito.
 * @param {string} text 
 * @returns {Promise<number[]>}
 */
async function getEmbedding(text) {
  const provider = process.env.EMBEDDING_PROVIDER || 'local';

  try {
    if (provider === 'google') {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-embedding-2-flash" }, { apiVersion: 'v1' });
      const result = await model.embedContent(text);
      return result.embedding.values;
    } 
    
    // Default: Local (Transformers.js)
    const generateEmbedding = await getLocalPipeline();
    const output = await generateEmbedding(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);

  } catch (error) {
    console.error(`[EMBEDDING ERROR] Provider: ${provider} |`, error.message);
    throw error;
  }
}

module.exports = { getEmbedding };
