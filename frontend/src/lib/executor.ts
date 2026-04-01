import { 
  updateTask, 
  getAgentInfo, 
  getMission, 
  createMessage, 
  animaChat,
  listMessagesByMission
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

    // 3.5. Recupero Work Products (Punti di Controllo) - Paperclip style
    // Recuperiamo i risultati consolidati dei task già completati per costruire il "Manifest" della missione.
    const { data: completedTasks } = await (await import('./supabase')).supabase
      .from('anima_tasks')
      .select('title, result')
      .eq('mission_id', task.mission_id)
      .eq('status', 'completed')
      .order('order_index', { ascending: true });

    let missionManifest = "";
    if (completedTasks && completedTasks.length > 0) {
      missionManifest = "\n# [MISSION CONTEXT MANIFEST]\n" + 
        "Questi sono i risultati consolidati dei task precedenti. Considerali memorizzati e NON ripeterli.\n\n" +
        completedTasks.map(ct => `## ARTIFACT: ${ct.title}\n${ct.result}`).join("\n\n---\n\n");
    }

    // 4. Preparazione Prompt Strategico
    // Uniamo l'obiettivo della missione con la descrizione specifica del task
    const executionPrompt = `
      # [MISSION OBJECTIVE]
      ${mission?.objective}

      # [BACKGROUND: MISSION MANIFEST]
      ${missionManifest}
      
      # [YOUR SPECIFIC TASK: CURRENT PHASE]
      TITOLO: ${task.title}
      COSA DEVI FARE ORA: ${task.description}
      
      # [STRICT EXECUTION PROTOCOL]
      1. NO REDUNDANCY: Non ripetere informazioni, titoli o report già presenti nel MANIFEST. Il tuo compito è un passo AVANTI, non una sintesi del passato.
      2. DATA CONTINUITY: Se il manifest contiene link o dati grezzi, usali per il tuo compito attuale.
      3. TOOL AUTHORITY: Usa i TOOL (web, gmail, calendar) per estrarre dati reali. Se il manifest ha già i dati che ti servono, non chiamare il tool inutilmente.
      4. FINAL REPORT: Produci un unico report in Markdown focalizzato esclusivamente sui risultati del TUO task.
    `;

    // 5. Chiamata al bridge AI (Agnostico)
    const resultText = await animaChat({
      agentId: agent.id,
      messages: [
        { role: 'user', content: executionPrompt }
      ],
      systemPrompt: agent.system_prompt,
      missionId: task.mission_id
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

    // 8. AUTONOMOUS LOOP (Auto-Pilot)
    // Se la missione è in modalità autonomous, cerchiamo il prossimo task
    if (mission?.execution_mode === 'autonomous') {
      const { data: nextTasks, error: nextError } = await (await import('./supabase')).supabase
        .from('anima_tasks')
        .select('id, title, requires_approval, order_index')
        .eq('mission_id', task.mission_id)
        .eq('status', 'pending')
        .gt('order_index', task.order_index)
        .order('order_index', { ascending: true })
        .limit(1);

      if (nextError) {
        console.error("[EXECUTOR] Errore recupero prossimo task:", nextError.message);
      } else if (nextTasks && nextTasks.length > 0) {
        const nextTask = nextTasks[0];
        
        if (nextTask.requires_approval) {
          // Pausa del loop per approvazione umana (Human-in-the-loop)
          await createMessage({
            mission_id: task.mission_id,
            agent_id: 'system',
            role: 'system',
            content: `[NEURAL PAUSE] Il prossimo task ("${nextTask.title}") richiede approvazione manuale. Loop autonomo sospeso.`,
            metadata: { type: 'approval_required', taskId: nextTask.id }
          });
          console.log(`[EXECUTOR] Loop autonomo in pausa per approvazione: ${nextTask.id}`);
        } else {
          // Avvio automatico del task successivo (Auto-Pilot)
          console.log(`[EXECUTOR] Auto-Pilot: Avvio automatico del prossimo task: ${nextTask.id} (${nextTask.title})`);
          
          // Usiamo un piccolo delay per dare tempo alla UI di aggiornarsi e per rendere il flusso "vivo"
          setTimeout(() => {
            runTaskExecution(nextTask.id).catch(err => {
              console.error(`[EXECUTOR] Errore nel loop autonomo per ${nextTask.id}:`, err.message);
            });
          }, 1500);
        }
      } else {
        // Nessun altro task pendente: Missione completata!
        await (await import('./anima')).updateMission(task.mission_id, { status: 'completed' });
        await createMessage({
          mission_id: task.mission_id,
          agent_id: 'system',
          role: 'system',
          content: `[MISSION COMPLETE] Tutti i task sono stati eseguiti con successo. Missione terminata autonomamente.`,
          metadata: { type: 'mission_complete' }
        });
      }
    }

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
