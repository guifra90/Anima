import { listAllAgents, createTask, updateMission, animaChat } from './anima';

/**
 * Utility per estrarre JSON da una stringa sporca (es. output LLM)
 */
function extractJson(text: any) {
  if (typeof text !== 'string') return text;
  
  try {
    // Prova il parse diretto
    return JSON.parse(text.trim());
  } catch (err) {
    // Prova a cercare un blocco JSON markdown
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch (e) {
        // Fallback al tentativo manuale sotto
      }
    }

    // Ultimo tentativo: cerca la prima '[' e l'ultima ']'
    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1) {
      try {
        return JSON.parse(text.substring(firstBracket, lastBracket + 1).trim());
      } catch (e) {
        console.error("[Planner] Failed all JSON extraction attempts");
        throw new Error("Formato risposta AI non valido (JSON non trovato)");
      }
    }
    
    throw new Error("Formato risposta AI non ricononsciuto");
  }
}

/**
 * AI Planner — Versione Integrata nel Frontend (Server-side)
 * Scompone una missione in task atomici assegnati agli agenti.
 * Ora è AGNOSTICO: usa la configurazione del plannerAgentId fornito.
 */
export async function planMissionAndCreateTasks(missionId: string, objective: string, plannerAgentId: string, priority: number = 1) {
  try {
    console.log(`[Planner] Inizio pianificazione per missione ${missionId} con agente ${plannerAgentId} (Priority: ${priority})`);
    
    const agents = await listAllAgents();
    const agentContext = agents.map(a => `- ${a.id}: ${a.name} (${a.role})`).join('\n');

    const systemPrompt = `
      Sei l'Orchestratore Strategico di Mirror Agency (ANIMA OS).
      Il tuo compito è trasformare un OBIETTIVO strategico in un PIANO OPERATIVO strutturato.
      
      [CONTEXT]
      Mirror è un'agenzia creativa d'élite. Ogni missione deve essere approcciata con precisione chirurgica e visione di alto livello.
      
      [AGENTI DISPONIBILI]
      ${agentContext}
      
      [MISSION PROTOCOL]
      1. Scomponi l'obiettivo in 3-7 Task sequenziali o paralleli.
      2. Assegna ogni task all'agente più qualificato basandoti sui loro ruoli tecnici.
      3. Definisci titoli brevi ed evocativi, e descrizioni d'azione chiare ("Crea...", "Analizza...", "Configura...").
      4. **Approvals**: Se un task comporta un'azione esterna reale (es. inviare un'email a un cliente, creare un evento in un calendario condiviso), imposta "requires_approval" a true.
      
      [IMPORTANT — OUTPUT FORMAT]
      Rispondi ESCLUSIVAMENTE con un array JSON. Non aggiungere commenti, spiegazioni o testo extra.
      
      Struttura richiesta:
      [
        {
          "title": "Titolo Task",
          "description": "Descrizione operativa del compito",
          "agent_id": "id_agente",
          "order_index": 1,
          "requires_approval": false
        }
      ]
    `;

    const response = await animaChat({
      agentId: plannerAgentId,
      messages: [
        { role: 'user', content: `Protocollo di Pianificazione: Attivazione per l'obiettivo: "${objective}"` }
      ],
      systemPrompt // Passiamo il systemPrompt separatamente se supportato
    });

    const tasks = extractJson(response.content);

    if (!Array.isArray(tasks) || tasks.length === 0) {
      throw new Error("Il planner non ha generato un piano valido.");
    }

    // Salva i task nel DB
    const createdTasks = [];
    for (const t of tasks) {
      const task = await createTask({
        mission_id: missionId,
        title: t.title || "Untitled Task",
        description: t.description || "",
        agent_id: t.agent_id || "operations-manager",
        order_index: t.order_index || 0,
        status: 'pending',
        priority: priority, // Eredita la priorità della missione per la gestione delle code
        requires_approval: t.requires_approval || false
      });
      createdTasks.push(task);
    }

    // Aggiorna lo stato della missione ad 'active'
    await updateMission(missionId, { status: 'active' });

    console.log(`[Planner] Missione ${missionId} attivata con ${createdTasks.length} task (Priority: ${priority}).`);
    return createdTasks;
  } catch (err: any) {
    console.error("[Planner Error]", err.message);
    await updateMission(missionId, { status: 'cancelled' }); 
    throw err;
  }
}
