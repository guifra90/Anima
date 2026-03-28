const { supabase } = require('./utils/supabase-client');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log("\n📦 ANIMA — Archiviazione Procedura (SOP)\n");

  try {
    const sopId = await question("ID della SOP (UUID): ");
    
    // 1. Verifica esistenza
    const { data: sop, error: fetchError } = await supabase
      .from('anima_sops')
      .select('title, version')
      .eq('id', sopId)
      .single();

    if (fetchError || !sop) {
        throw new Error(`SOP non trovata con ID: ${sopId}`);
    }

    console.log(`\nStai per archiviare: "${sop.title}" (V${sop.version})`);
    const confirm = await question("Sei sicuro? (s/n): ");

    if (confirm.toLowerCase() === 's') {
        // 2. Archivia
        const { error: updateError } = await supabase
          .from('anima_sops')
          .update({ status: 'archived' })
          .eq('id', sopId);

        if (updateError) throw updateError;

        // 3. Pulisci embedding (Rimosso dalla Knowledge Base attiva)
        await supabase
          .from('anima_knowledge')
          .delete()
          .eq('source_id', sopId);

        console.log("\n✅ SOP ARCHIVIATA CON SUCCESSO. La conoscenza associata è stata rimossa dal retrieval RAG.");
    } else {
        console.log("\nOperazione annullata.");
    }

  } catch (error) {
    console.error(`\n❌ ERRORE: ${error.message}`);
  } finally {
    rl.close();
  }
}

main();
