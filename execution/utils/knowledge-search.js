const { supabase } = require('./supabase-client');
const { getEmbedding } = require('./embedding-service');

/**
 * Cerca frammenti di conoscenza rilevanti tramite embedding semantico.
 * @param {string} query 
 * @param {number} matchThreshold (Default 0.4)
 * @param {number} matchCount (Default 5)
 */
async function searchKnowledge(query, matchThreshold = 0.4, matchCount = 5) {
  try {
    // 1. Generazione embedding per la query via Unified Service
    const queryEmbedding = await getEmbedding(query);

    // 2. Chiamata alla RPC in Supabase
    const { data: matches, error } = await supabase.rpc('match_knowledge', {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount
    });

    if (error) throw error;
    
    return matches || [];

  } catch (error) {
    console.error(`[SEARCH ERROR] Errore nella ricerca semantica:`, error.message);
    throw error;
  }
}

module.exports = { searchKnowledge };
