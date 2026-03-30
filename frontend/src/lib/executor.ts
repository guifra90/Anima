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
      Basandoti sul tuo ruolo (${agent.role}), esegui il compito e restituisci un report dettagliato dell'attività svolta. 
      Sii professionale, autorevole e focalizzato sui risultati concreti.
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
