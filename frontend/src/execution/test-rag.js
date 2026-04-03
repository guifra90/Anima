const { supabase } = require('./utils/supabase-client');
const { ingestSOP } = require('./utils/ingest-sop');
const { searchKnowledge } = require('./utils/knowledge-search');

async function testRAG() {
  console.log("🧪 AVVIO TEST RAG (Retrieval Augmented Generation)\n");

  try {
    // 1. Creazione SOP di test
    const testSop = {
      title: "Protocollo Mirror per il Colore Neon",
      units: ["Creative"],
      owner: "Test Script",
      content: "Mirror Agency utilizza sempre il Neon Cyan (#22d3ee) per gli accenti di interfaccia. Questo colore rappresenta l'anima tecnologica e specchiante del brand. Non usare mai il rosso per i pulsanti di azione, ma solo varianti di ciano."
    };

    console.log("1. Caricamento SOP di test...");
    const { data: sop, error } = await supabase
      .from('anima_sops')
      .insert([testSop])
      .select()
      .single();

    if (error) throw error;
    console.log(`✅ SOP creata con ID: ${sop.id}`);

    // 2. Ingestion
    console.log("2. Esecuzione Ingestion (Embedding)...");
    await ingestSOP(sop.id, testSop.content, { title: testSop.title, units: testSop.units });
    console.log("✅ Ingestione completata.");

    // 3. Ricerca Semantica
    const query = "Quale colore devo usare per i pulsanti?";
    console.log(`3. Ricerca Semantica per: "${query}"`);
    const results = await searchKnowledge(query);

    console.log(`\n🔎 RISULTATI TROVATI: ${results.length}`);
    results.forEach((res, i) => {
      console.log(`[${i+1}] Similarity: ${(res.similarity * 100).toFixed(2)}%`);
      console.log(`    Contenuto: ${res.content.substring(0, 100)}...`);
    });

    if (results.length > 0 && results[0].similarity > 0.4) {
      console.log("\n✨ TEST SUPERATO: La ricerca semantica ha trovato i dati corretti!");
    } else {
      console.log("\n⚠️ TEST FALLITO: La ricerca non è stata abbastanza accurata.");
    }

  } catch (err) {
    console.error("\n❌ ERRORE DURANTE IL TEST:", err.message);
  }
}

testRAG();
