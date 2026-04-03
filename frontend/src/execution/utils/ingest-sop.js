const { supabase } = require('./supabase-client');
const { getEmbedding } = require('./embedding-service');

/**
 * Divide il testo in chunk di circa maxTokens con un overlap definito.
 * @param {string} text 
 * @param {number} maxTokens 
 * @param {number} overlapTokens 
 * @returns {string[]}
 */
function chunkText(text, maxTokens = 500, overlapTokens = 50) {
  const words = text.split(/\s+/);
  const chunks = [];
  
  for (let i = 0; i < words.length; i += (maxTokens - overlapTokens)) {
    const chunk = words.slice(i, i + maxTokens).join(' ');
    chunks.push(chunk);
    if (i + maxTokens >= words.length) break;
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

      const embedding = await getEmbedding(chunk);

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

/**
 * Ingerisce tutte le SOP attive dal database.
 */
async function ingestAllSOPs() {
  try {
    console.log('[INGEST] Recupero tutte le SOP attive...');
    const { data: sops, error } = await supabase
      .from('anima_sops')
      .select('*')
      .eq('status', 'active');

    if (error) throw error;

    console.log(`[INGEST] Trovate ${sops.length} SOP da elaborare.`);

    for (const sop of sops) {
      await ingestSOP(sop.id, sop.content, {
        title: sop.title,
        units: sop.units,
        version: sop.version
      });
    }

    console.log('[INGEST] Batch ingestion completata con successo.');
    return { success: true, processed: sops.length };
  } catch (error) {
    console.error('[INGEST ERROR] Errore nel batch processing:', error.message);
    throw error;
  }
}

module.exports = { ingestSOP, ingestAllSOPs };
