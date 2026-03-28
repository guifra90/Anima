import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Servizio di Embedding per l'ambiente Next.js.
 * Utilizza Transformers.js per il calcolo locale o Gemini per il cloud.
 */

let transformersPipeline: any = null;

async function getLocalPipeline() {
  if (!transformersPipeline) {
    // Caricamento dinamico per evitare problemi di bundling pesante
    const { pipeline } = await import('@xenova/transformers');
    transformersPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return transformersPipeline;
}

export async function getEmbedding(text: string): Promise<number[]> {
  const provider = process.env.EMBEDDING_PROVIDER || 'local';

  try {
    if (provider === 'google') {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: "gemini-embedding-2-flash" }, { apiVersion: 'v1' });
      const result = await model.embedContent(text);
      return result.embedding.values;
    }

    // Default: Local
    const generateEmbedding = await getLocalPipeline();
    const output = await generateEmbedding(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);

  } catch (error: any) {
    console.error(`[EMBEDDING SERVICE ERROR] Provider: ${provider} |`, error.message);
    throw error;
  }
}
