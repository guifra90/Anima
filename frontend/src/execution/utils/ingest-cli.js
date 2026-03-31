/**
 * ANIMA RAG CLI — Batch Ingestion
 * Uso: node execution/utils/ingest-cli.js
 */

const { ingestAllSOPs } = require('./ingest-sop');

async function main() {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║       ANIMA — RAG Batch Ingestion        ║');
  console.log('╚══════════════════════════════════════════╝\n');

  try {
    const result = await ingestAllSOPs();
    console.log(`\n✅ Successo! Processate ${result.processed} SOP.`);
    process.exit(0);
  } catch (err) {
    console.error(`\n❌ Errore critico: ${err.message}`);
    process.exit(1);
  }
}

main();
