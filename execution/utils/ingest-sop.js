const { supabase } = require('./supabase-client');
const { GoogleGenerativeAI } = require("@google-ai/generativelanguage");

// Configurazione AI per gli embedding
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

/**
 * Divide il testo in chunk di circa maxTokens.
 * @param {string} text 
 * @param {number} maxTokens 
 * @returns {string[]}
 */
function chunkText(text, maxTokens = 500) {
  // Semplice chunking per parole come approssimazione per i token
  const words = text.split(/\s+/);
  const chunks = [];
  let currentChunk = [];
  let currentCount = 0;

  for (const word of words) {
    currentChunk.push(word);
    currentCount++;

    if (currentCount >= maxTokens) {
      chunks.push(currentChunk.join(' '));
      currentChunk = [];
      currentCount = 0;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  return chunks;
}

/**
 * Elabora una SOP, la divide in chunk e salva i vettori in Supabase.
 * @param {string} sopId 
 * @param {string} text 
 * @param {object} metadata 
 */
async function ingestSOP(sopId, text, metadata = {}) {
  try {
    console.log(`[INGEST] Iniziando ingestion della SOP: ${sopId}`);

    // 1. Pulizia vecchi chunk per questa SOP (per ri-embedding pulito)
    const { error: deleteError } = await supabase
      .from('anima_knowledge')
      .delete()
      .eq('source_type', 'sop')
      .eq('source_id', sopId);

    if (deleteError) throw deleteError;

    // 2. Chunking
    const chunks = chunkText(text);
    console.log(`[INGEST] Creati ${chunks.length} chunk.`);

    // 3. Generazione Embedding e salvataggio
    for (const [index, chunk] of chunks.entries()) {
      console.log(`[INGEST] Elaborazione chunk ${index + 1}/${chunks.length}...`);

      const result = await embeddingModel.embedContent(chunk);
      const embedding = result.embedding.values;

      const { error: insertError } = await supabase
        .from('anima_knowledge')
        .insert([{
          source_id: sopId,
          source_type: 'sop',
          content: chunk,
          embedding: embedding,
          metadata: {
            ...metadata,
            chunk_index: index,
            total_chunks: chunks.length
          }
        }]);

      if (insertError) throw insertError;
    }

    console.log(`[INGEST] Completato con successo per SOP ${sopId}`);
    return { success: true, chunks: chunks.length };

  } catch (error) {
    console.error(`[INGEST ERROR] Errore nell'ingestion della SOP ${sopId}:`, error.message);
    throw error;
  }
}

module.exports = { ingestSOP };
