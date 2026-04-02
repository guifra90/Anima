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
export async function runTaskExecution(taskId: string, options: { bypassSafety?: boolean } = {}) {
  try {
    console.log(`[EXECUTOR] Initializing Neural Execution for Task: ${taskId} (Bypass Safety: ${!!options.bypassSafety})`);

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
    
    // 1.5. Concurrency Check (Agent Lock) - Paperclip Style
    if (agent.current_task_id && agent.current_task_id !== taskId) {
      console.warn(`[EXECUTOR] Agent ${agent.name} is BUSY in task ${agent.current_task_id}. Queueing...`);
      
      await createMessage({
        mission_id: task.mission_id,
        agent_id: task.agent_id,
        role: 'system',
        content: `[NEURAL QUEUE] ${agent.name} è impegnato con un altro task. In attesa di rilascio risorsa...`,
        metadata: { type: 'resource_busy', busyInTaskId: agent.current_task_id }
      });

      await updateTask(taskId, { status: 'waiting' });
      return { success: false, status: 'RESOURCE_BUSY', busyInTaskId: agent.current_task_id };
    }

    // 2. Transizione a RUNNING e aggiornamento status agente (Live Labeling)
    await updateTask(taskId, { status: 'running' });
    await (await import('./supabase')).supabase
      .from('anima_agents')
      .update({ 
        current_mission_id: task.mission_id, 
        current_task_id: taskId,
        current_phase: 'INITIALIZING',
        last_activity_at: new Date().toISOString()
      })
      .eq('id', task.agent_id);

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

    // 4. Preparazione Prompt Strategico — MISSION CONTINUUM v2.1
    // Uniamo l'obiettivo della missione con la consapevolezza narrativa del progresso
    const executionPrompt = `
      # [MISSION OBJECTIVE]
      ${mission?.objective}

      # [BACKGROUND: MISSION MANIFEST]
      ${missionManifest}
      
      # [NEURAL TRACE: STRATEGIC INSIGHTS]
      Prendi atto delle scoperte e delle deduzioni logiche fatte finora. Se i task precedenti hanno incontrato ostacoli o scoperto dati sensibili, usali per ottimizzare la tua esecuzione. Mantieni la coerenza stilistica con il lavoro già svolto.

      # [YOUR SPECIFIC TASK: CURRENT PHASE]
      TITOLO: ${task.title}
      DESCRIZIONE: ${task.description}
      
      # [STRICT EXECUTION PROTOCOL]
      1. KNOWLEDGE FIRST: Se il MANIFEST o la KNOWLEDGE BASE contengono già i dati necessari, NON usare 'web:search'. Usa ciò che sai.
      2. NO REDUNDANCY: Non ripetere informazioni o report già presenti nel MANIFEST. Vai OLTRE.
      3. DATA CONTINUITY: Usa i dati (link, nomi, file) estratti dai task precedenti nel MANIFEST.
      4. FINAL REPORT: Produci un report unico focalizzato esclusivamente sull'esito del TUO task.
    `;

    // 4.5. Recupero Messaggi Storici della Missione (Neural Memory)
    // Per dare all'agente awareness di quello che è già successo nello stream.
    const missionMessages = await listMessagesByMission(task.mission_id);
    const chatHistory = missionMessages
      .filter(m => m.role !== 'system') // Escludiamo i log di sistema tecnici
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));

    // 4.6. Update Phase: THINKING
    await (await import('./supabase')).supabase
      .from('anima_agents')
      .update({ current_phase: 'THINKING...' })
      .eq('id', task.agent_id);

    // 5. Chiamata al bridge AI (Agnostico)
    const chatResult = await animaChat({
      agentId: agent.id,
      messages: [
        ...chatHistory,
        { role: 'user', content: executionPrompt }
      ],
      systemPrompt: agent.system_prompt,
      missionId: task.mission_id,
      options: { 
        bypassSafety: !!options.bypassSafety // V3.3: Pass the authority flag from UI approval
      }
    });

    const resultText = chatResult.content;
    const isSafetyBlock = chatResult.requiresApproval;

    // 6. Gestione Blocco di Sicurezza (Paperclip Style)
    if (isSafetyBlock) {
      console.log(`[EXECUTOR] Safety Block Triggered for Task ${taskId}. Halting for approval...`);
      
      // Log nel Neural Stream
      await createMessage({
        mission_id: task.mission_id,
        agent_id: task.agent_id,
        role: 'system',
        content: `[SAFETY BLOCK] Attività di scrittura esterna rilevata: ${chatResult.blockedTool}. Richiesta approvazione manuale.`,
        metadata: { 
          type: 'approval_required', 
          taskId,
          tool: chatResult.blockedTool,
          args: chatResult.blockedArgs
        }
      });

      // Aggiornamento Task: da running torniamo a pending con flag approval
      await updateTask(taskId, { 
        status: 'pending', 
        requires_approval: true,
        result: resultText // Contiene il log del blocco
      });

      // Cleanup Live Labeling
      await (await import('./supabase')).supabase
        .from('anima_agents')
        .update({ current_mission_id: null, current_task_id: null, current_phase: null })
        .eq('id', task.agent_id);

      return; // Interrompiamo l'esecuzione qui
    }

    // Log di completamento nel Neural Stream (Includiamo il contenuto per il "viva" feed)
    await createMessage({
      mission_id: task.mission_id,
      agent_id: task.agent_id,
      role: 'assistant',
      content: resultText,
      metadata: { type: 'execution_end', taskId }
    });

    // 7. Salvataggio Risultato e Stato Finale
    await (await import('./supabase')).supabase
      .from('anima_agents')
      .update({ current_phase: 'COMPLETING...' })
      .eq('id', task.agent_id);

    const updated = await updateTask(taskId, { 
      status: 'completed',
      result: resultText,
      updated_at: new Date().toISOString()
    });

    console.log(`[EXECUTOR] Task ${taskId} completed successfully.`);

    // 8. AUTONOMOUS LOOP (Auto-Pilot) - Paperclip Style
    // Se la missione è in modalità autonomous, cerchiamo il prossimo task
    // e lo avviamo automaticamente SE non richiede approvazione manuale.
    if (mission?.execution_mode === 'autonomous') {
      console.log(`[EXECUTOR] Loop Autonomo: Ricerca prossimo task per missione ${task.mission_id}`);
      
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
          // Pausa del loop per approvazione umana (Human-in-the-loop - Paperclip style)
          await createMessage({
            mission_id: task.mission_id,
            agent_id: 'system',
            role: 'system',
            content: `[NEURAL PAUSE] Il prossimo task ("${nextTask.title}") richiede approvazione manuale. Auto-Pilot in attesa dell'operatore.`,
            metadata: { type: 'approval_required', taskId: nextTask.id }
          });
          console.log(`[EXECUTOR] Auto-Pilot in pausa per approvazione: ${nextTask.id}`);
        } else {
          // Avvio automatico del task successivo (Auto-Pilot Ignition)
          console.log(`[EXECUTOR] Auto-Pilot: Avvio automatico del prossimo task: ${nextTask.id} (${nextTask.title})`);
          
          await createMessage({
            mission_id: task.mission_id,
            agent_id: 'system',
            role: 'system',
            content: `[NEURAL LINK] Auto-Pilot: Transizione automatica verso "${nextTask.title}"...`,
            metadata: { type: 'auto_transition', taskId: nextTask.id }
          });

          // Usiamo un piccolo delay per la "sensazione" Paperclip (lavoro invisibile che diventa visibile)
          setTimeout(() => {
            runTaskExecution(nextTask.id).catch(err => {
              console.error(`[EXECUTOR] Errore nel loop autonomo per ${nextTask.id}:`, err.message);
            });
          }, 2000);
        }
      } else {
        // Nessun altro task pendente: Missione completata!
        console.log(`[EXECUTOR] Missione ${task.mission_id} completata autonomamente. Inizio consolidamento memoria...`);
        
        // 8.5. LONG-TERM MEMORY CONSOLIDATION (RAG Indexing)
        // Generiamo una memoria semantica per le future missioni
        try {
          // Recuperiamo TUTTI i task completati (incluso quello appena finito)
          const { data: finalTasks } = await (await import('./supabase')).supabase
            .from('anima_tasks')
            .select('title, result')
            .eq('mission_id', task.mission_id)
            .eq('status', 'completed')
            .order('order_index', { ascending: true });

          const missionSummary = `MISSIONE: ${mission?.title}\nOBIETTIVO: ${mission?.objective}\nRISULTATI ANALITICI:\n` + 
            (finalTasks || []).map(ct => `## TASK: ${ct.title}\n${ct.result}`).join("\n\n---\n\n");

          // @ts-ignore
          const embedding = await (await import('./embedding')).getEmbedding(missionSummary);
          
          await (await import('./supabase')).supabase
            .from('anima_knowledge')
            .insert([{
              source_type: 'mission_memory',
              source_id: task.mission_id,
              content: missionSummary,
              embedding: embedding,
              metadata: { 
                mission_id: task.mission_id, 
                title: mission?.title,
                completed_at: new Date().toISOString()
              }
            }]);
          
          console.log(`[EXECUTOR] Neural Memory indexed for mission ${task.mission_id}.`);
        } catch (e: any) {
          console.error("[EXECUTOR] Fallimento consolidamento memoria semantica:", e.message);
        }

        await (await import('./anima')).updateMission(task.mission_id, { status: 'completed' });
        
        await createMessage({
          mission_id: task.mission_id,
          agent_id: 'system',
          role: 'system',
          content: `[MISSION COMPLETE] Obiettivo raggiunto con successo. Consolidamento memoria neurale completato.`,
          metadata: { type: 'mission_complete' }
        });
      }
    }

    // Reset status agente a completamento (Cleanup Live Labeling)
    await (await import('./supabase')).supabase
      .from('anima_agents')
      .update({ current_mission_id: null, current_task_id: null, current_phase: null })
      .eq('id', task.agent_id);

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

    // Reset status agente in caso di errore
    try {
      const { data: currentTask } = await (await import('./supabase')).supabase
        .from('anima_tasks')
        .select('agent_id')
        .eq('id', taskId)
        .single();
        
      if (currentTask?.agent_id) {
        await (await import('./supabase')).supabase
          .from('anima_agents')
          .update({ current_mission_id: null, current_task_id: null, current_phase: null })
          .eq('id', currentTask.agent_id);
      }
    } catch (e) {}

    throw err;
  } finally {
    // 9. RELIGIOUS RELEASE (Agent Lockdown Finalization)
    // Garantiamo che l'agente sia liberato SEMPRE, qualunque cosa accada nel loop.
    try {
      const { data: currentTask } = await (await import('./supabase')).supabase
        .from('anima_tasks')
        .select('agent_id')
        .eq('id', taskId)
        .single();
        
      if (currentTask?.agent_id) {
        await (await import('./supabase')).supabase
          .from('anima_agents')
          .update({ 
            current_mission_id: null, 
            current_task_id: null,
            current_phase: null 
          })
          .eq('id', currentTask.agent_id);
        console.log(`[EXECUTOR] Agent ${currentTask.agent_id} RELEASED back to pool.`);
      }
    } catch (e: any) {
      console.error("[EXECUTOR] Failed to release agent:", e.message);
    }
  }
}
