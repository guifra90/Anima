const { supabase } = require('./utils/supabase-client');
const { ingestSOP } = require('./utils/ingest-sop');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log("\n📘 ANIMA — Aggiunta Procedura (SOP) alla Knowledge Base\n");

  try {
    const title = await question("Titolo della SOP: ");
    const unitsInput = await question("Unità operative (es: Strategy, Creative - separate da virgola): ");
    const units = unitsInput.split(',').map(u => u.trim()).filter(u => u !== '');
    const owner = await question("Owner (Nome e Cognome): ");
    
    console.log("\n--- Contenuto della SOP ---");
    console.log("Puoi incollare il percorso di un file .md/.txt oppure incollare il testo direttamente.");
    const inputType = await question("Vuoi caricare da (f)ile o inserire (t)esto? ");

    let content = "";
    if (inputType.toLowerCase() === 'f') {
      const filePath = await question("Percorso del file: ");
      const absolutePath = path.resolve(process.cwd(), filePath);
      if (!fs.existsSync(absolutePath)) {
        throw new Error(`File non trovato: ${absolutePath}`);
      }
      content = fs.readFileSync(absolutePath, 'utf8');
    } else {
      console.log("Incolla il testo qui sotto (termina con una riga vuota e poi Ctrl+C o premi Invio due volte):");
      content = await question("> ");
    }

    if (!content.trim()) {
      throw new Error("Il contenuto della SOP non può essere vuoto.");
    }

    // 1. Salva la SOP nel database relazionale
    console.log("\n⏳ Salvataggio metadata su Supabase...");
    const { data: sop, error: sopError } = await supabase
      .from('anima_sops')
      .insert([{
        title,
        units,
        owner,
        content,
        status: 'active'
      }])
      .select()
      .single();

    if (sopError) throw sopError;

    // 2. Avvia l'ingestion vettoriale
    console.log("✅ Metadata salvati. Avvio Ingestion Engine per RAG...");
    const { chunks } = await ingestSOP(sop.id, content, { units, title });

    console.log(`\n🎉 SOP SALVATA E INDICIZZATA CON SUCCESSO!`);
    console.log(`ID: ${sop.id}`);
    console.log(`Versione: 1.0.0`);
    console.log(`Chunk vettoriali creati: ${chunks}\n`);

  } catch (error) {
    console.error(`\n❌ ERRORE: ${error.message}`);
  } finally {
    rl.close();
  }
}

main();
