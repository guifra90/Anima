import { 
  updateTask, 
  getAgentInfo, 
  getMission, 
  createMessage, 
  animaChat 
} from './anima';

/**
 * Neural Execution Engine — ANIMA v2
 * Gestisce l'esecuzione autonoma di un singolo task.
 */
export async function runTaskExecution(taskId: string) {
  try {
    console.log(`[EXECUTOR] Initializing Neural Execution for Task: ${taskId}`);

    // 1. Recupero dati task e missione
    const { data: task, error: taskError } = await (await import('./supabase')).supabase
      .from('anima_tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError || !task) throw new Error("Task not found");

    const mission = await getMission(task.mission_id);
    const agent = await getAgentInfo(task.agent_id);

    if (!agent) throw new Error(`Agent ${task.agent_id} not found`);

    // 2. Transizione a RUNNING
    await updateTask(taskId, { status: 'running' });

    // 3. Log iniziale nel Neural Stream (viva feedback)
    await createMessage({
      mission_id: task.mission_id,
      agent_id: task.agent_id,
      role: 'system',
      content: `[NEURAL LINK] ${agent.name} sta inizializzando l'esecuzione del task: "${task.title}"...`,
      metadata: { type: 'execution_start', taskId }
    });

    // 4. Preparazione Prompt Strategico
    // Uniamo l'obiettivo della missione con la descrizione specifica del task
    const executionPrompt = `
      PROTOCOLLO DI ESECUZIONE: ${task.title}
      OBIETTIVO MISSIONE: ${mission?.objective}
      IL TUO COMPITO SPECIFICO: ${task.description}
      
      ESECUZIONE: 
      Basandoti sul tuo ruolo (${agent.role}), esegui il compito. 
      ATTENZIONE: Utilizza i TOOL a tua disposizione (es. Gmail, Calendar) per estrarre DATI REALI. 
      NON SIMULARE dati se puoi accedere a informazioni vere.
      
      REGOLE DI FORMATTAZIONE FINALE:
      1. PROTOCOLLO SILENZIO TOOL: Mentre stai usando i tool (Gmail, Calendar, ecc.), NON generare alcun report parziale o introduzione testuale. Rispondi SOLO con la chiamata al tool.
      2. REPORT UNICO: Aspetta di aver raccolto TUTTI i dati necessari. Solo nell'ultimo turno, quando hai tutte le informazioni, genera un UNICO report finale pulito, coeso e altamente professionale in Markdown.
      3. PULIZIA: NON includere nel testo finale i log tecnici o le stringhe '[CALL: ...]'.
      4. NESSUNA PIGRIZIA: NON usare 'Vedi sopra'. Scrivi ogni sezione (Email, Calendario, Brief) in modo completo ed elegante.
      5. PRECISIONE TEMPORALE: Se chiedi il calendario di 'questa settimana', calcola la fine (7 giorni da oggi) e usa 'timeMax'. Non estrarre dati oltre il periodo richiesto.
    `;

    // 5. Chiamata al bridge AI (Agnostico)
    const resultText = await animaChat({
      agentId: agent.id,
      messages: [
        { role: 'user', content: executionPrompt }
      ],
      systemPrompt: agent.system_prompt
    });

    // 6. Log di completamento nel Neural Stream (Includiamo il contenuto per il "viva" feed)
    await createMessage({
      mission_id: task.mission_id,
      agent_id: task.agent_id,
      role: 'assistant',
      content: resultText,
      metadata: { type: 'execution_end', taskId }
    });

    // 7. Salvataggio Risultato e Stato Finale
    const updated = await updateTask(taskId, { 
      status: 'completed',
      result: resultText,
      updated_at: new Date().toISOString()
    });

    console.log(`[EXECUTOR] Task ${taskId} completed successfully.`);
    return updated;

  } catch (err: any) {
    console.error(`[EXECUTOR ERROR] Task ${taskId}:`, err.message);
    
    // Recuperiamo il mission_id se possibile dal task caricato nel try
    // Nota: 'task' potrebbe essere undefined se l'errore è avvenuto al recupero del task
    let fallbackMissionId = undefined;
    try {
      const { data } = await (await import('./supabase')).supabase
        .from('anima_tasks')
        .select('mission_id')
        .eq('id', taskId)
        .single();
      fallbackMissionId = data?.mission_id;
    } catch (e) {}

    // Log di errore nel stream
    await createMessage({
      mission_id: fallbackMissionId,
      agent_id: 'system',
      role: 'system',
      content: `[NEURAL ERROR] Fallimento nell'esecuzione del task ${taskId}: ${err.message}`,
      metadata: { type: 'error', error: err.message }
    });

    await updateTask(taskId, { status: 'error' });
    throw err;
  }
}
