const { ingestAllSOPs } = require('./utils/ingest-sop');

(async () => {
  console.log('🚀 [ANIMA-SYNC] Iniziando sincronizzazione Knowledge Base...');
  try {
    const result = await ingestAllSOPs();
    console.log(`✅ [ANIMA-SYNC] Successo! SOP elaborate: ${result.processed}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ [ANIMA-SYNC] Fallimento:', err.message);
    process.exit(1);
  }
})();
