const { createClient } = require('@supabase/supabase-js');
const { chat } = require('./utils/ai-client');
require('dotenv').config();

// Configurazione Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Errore: Credenziali Supabase mancanti nel file .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * HEARTBEAT ENGINE - ANIMA v2
 * Ispirato alla logica di Paperclip.
 */
async function heartbeat() {
  console.log(`💓 Heartbeat: ${new Date().toISOString()} - Controllo task...`);

  try {
    // 1. Leggi la configurazione (heartbeat_mode)
    const { data: configRows } = await supabase.from('anima_config').select('*');
    const config = Object.fromEntries(configRows.map(r => [r.key, r.value]));
    
    const isManual = config.heartbeat_mode === 'manual';
    if (isManual && process.env.HEARTBEAT_FORCE !== 'true') {
      console.log("⏸️ Heartbeat in modalità MANUALE. Saltando ciclo automatico.");
      return;
    }

    // 2. Cerca task "queued" o "pending"
    const { data: tasks, error: taskError } = await supabase
      .from('anima_tasks')
      .select('*, anima_agents(*)')
      .in('status', ['queued', 'pending'])
      .order('priority', { ascending: false })
      .limit(1);

    if (taskError) throw taskError;
    if (!tasks || tasks.length === 0) {
      console.log("📭 Nessun task in coda.");
      return;
    }

    const task = tasks[0];
    const agent = task.anima_agents;

    if (!agent) {
      console.error(`❌ Agente non trovato per il task: ${task.id}`);
      return;
    }

    console.log(`🚀 Esecuzione Task: "${task.title}" assegnato a [${agent.name}]`);

    // 3. Aggiorna stato in "running"
    await supabase.from('anima_tasks').update({ 
      status: 'running', 
      updated_at: new Date() 
    }).eq('id', task.id);

    // 4. Esecuzione tramite AI Client (Ollama locale)
    // Nota: Usiamo l'ID dell'agente o il suo prompt di sistema
    const messages = [
      { role: 'user', content: `Task: ${task.title}\nDescrizione: ${task.description}\nInput: ${JSON.stringify(task.input_data)}` }
    ];

    try {
      const response = await chat(
        messages,
        agent.system_prompt || "Sei un assistente AI autonomo.",
        { 
          provider: 'ollama', 
          model: agent.model_id || 'llama3.1:8b' 
        }
      );

      // 5. Gestione Risultato (Board Approval o Completamento)
      const approvalRequired = config.board_approval_required === true;
      const nextStatus = approvalRequired ? 'in_review' : 'completed';

      console.log(`✅ Task eseguito. Nuovo stato: ${nextStatus}`);

      await supabase.from('anima_tasks').update({
        status: nextStatus,
        output_data: { response },
        updated_at: new Date()
      }).eq('id', task.id);

    } catch (execError) {
      console.error(`❌ Errore durante l'esecuzione AI:`, execError);
      await supabase.from('anima_tasks').update({
        status: 'failed',
        output_data: { error: execError.message },
        updated_at: new Date()
      }).eq('id', task.id);
    }

  } catch (err) {
    console.error("🚨 Errore fatale Heartbeat:", err);
  }
}

// Avvio il loop
const INTERVAL = process.env.HEARTBEAT_INTERVAL_MS || 30000; // 30 secondi

console.log("⚡ ANIMA v2 Heartbeat Engine avviato.");
setInterval(heartbeat, INTERVAL);
heartbeat(); // Primo battito immediato
