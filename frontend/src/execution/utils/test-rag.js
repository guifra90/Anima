/**
 * ANIMA RAG Verification Tool
 * Uso: node execution/utils/test-rag.js "la tua query"
 */

const { searchKnowledge } = require('./knowledge-search');

async function main() {
  const query = process.argv[2] || "Quali sono le linee guida per il brand luxury?";
  
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║       ANIMA — RAG Verification Tool      ║');
  console.log('╚══════════════════════════════════════════╝\n');
  
  console.log(`🔍 Query: "${query}"\n`);

  try {
    const results = await searchKnowledge(query, 0.3, 3); // Soglia più bassa per test

    if (results.length === 0) {
      console.log('❌ Nessun risultato trovato.');
      return;
    }

    console.log(`✅ Trovati ${results.length} frammenti rilevanti:\n`);

    results.forEach((res, i) => {
      console.log(`[${i + 1}] Similarity: ${(res.similarity * 100).toFixed(2)}%`);
      console.log(`    SOP: ${res.metadata.title || 'N/A'}`);
      console.log(`    Content: ${res.content.substring(0, 150)}...`);
      console.log('    ' + '─'.repeat(40) + '\n');
    });

  } catch (err) {
    console.error(`\n❌ Errore: ${err.message}`);
  }
}

main();
