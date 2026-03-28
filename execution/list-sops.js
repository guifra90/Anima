const { supabase } = require('./utils/supabase-client');

async function main() {
  console.log("\n📋 ANIMA — Lista Procedure (SOPs) Attive\n");

  try {
    const { data: sops, error } = await supabase
      .from('anima_sops')
      .select('*')
      .eq('status', 'active')
      .order('department', { ascending: true });

    if (error) throw error;

    if (sops.length === 0) {
      console.log("Nessuna SOP attiva trovata nella Knowledge Base.");
      return;
    }

    sops.forEach(sop => {
      console.log(`[${sop.department}] ${sop.title}`);
      console.log(`   ID: ${sop.id}`);
      console.log(`   Owner: ${sop.owner} | Versione: ${sop.version}`);
      console.log(`   Ultimo Aggiornamento: ${new Date(sop.last_updated).toLocaleString()}\n`);
    });

  } catch (error) {
    console.error(`\n❌ ERRORE: ${error.message}`);
  }
}

main();
