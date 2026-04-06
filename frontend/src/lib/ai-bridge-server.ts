import { supabaseAdmin as supabase } from './supabase-server';
// Importiamo il registro adapter esistente dallo strato di esecuzione
import adapterRegistry from '../execution/adapters/registry';
import SkillRegistry from '../execution/services/skill-registry';
import mcpService from '../execution/services/mcp-service';
// @ts-ignore
import { decrypt } from '../execution/utils/encryption';

import path from 'path';
import fs from 'fs';
import scoroExecutor from '../execution/scoro/executor';
import googleExecutor from '../execution/google/executor';
// @ts-ignore
import webExecutor from '../execution/web/executor';
import { getEmbedding } from './embedding';
import { createMessage, updateMessage } from './anima-persistence';
import { MASTER_STYLE } from './prompts/master-style';

const ABSOLUTE_SKILLS_PATH = '/Users/francescoguidotti/Documents/Lavoro/anima/skills';
const skillRegistry = new (SkillRegistry as any)(ABSOLUTE_SKILLS_PATH);
let isSkillRegistryInitialized = false;

async function ensureSkillRegistry() {
  if (!isSkillRegistryInitialized) {
    await skillRegistry.scan();
    isSkillRegistryInitialized = true;
  }
}

/**
 * Cerca conoscenza semantica nelle SOPs (RAG) - Server Side Version
 */
async function searchKnowledgeInternal(query: string) {
  try {
    console.log(`[AI-BRIDGE-SERVER] Generating embedding for query: "${query}"`);
    const queryEmbedding = await getEmbedding(query);

    const { data: matches, error } = await supabase.rpc('match_knowledge', {
      query_embedding: queryEmbedding,
      match_threshold: 0.2, 
      match_count: 5
    });

    if (error) {
      console.warn("[RAG-SERVER] Errore nella ricerca semantica (bypass):", error.message);
      return "";
    }

    if (!matches || matches.length === 0) {
      console.log("[RAG-SERVER] No matches found for query.");
      return "";
    }

    console.log(`[RAG-SERVER] Found ${matches.length} matches.`);
    return matches.map((m: any) => 
      `--- SOURCE: ${m.metadata?.title || 'Agency Memory'} ---\n${m.content}`
    ).join("\n\n");

  } catch (err: any) {
    console.warn("[RAG-SERVER] Fallimento ricerca semantica:", err.message);
    return "";
  }
}

export interface ChatOptions {
  model?: string;
  maxTokens?: number;
  [key: string]: any;
}

/**
 * Costruisce un prompt di sistema strutturato seguendo il protocollo Paperclip.
 * Include: Identità, Costituzione Globale, Direttive di Ruolo, Tratti Comportamentali e Skills.
 */
async function buildPaperclipPrompt(agent: any, extraContext?: string) {
  await ensureSkillRegistry();

  // 1. Recupero Costituzione Globale
  let constitution = "Mirror Agency opera con precisione assoluta.";
  try {
    const { data: config } = await supabase
      .from('anima_config')
      .select('value')
      .eq('key', 'agency_constitution')
      .single();
    if (config?.value) {
      constitution = typeof config.value === 'string' ? config.value : JSON.stringify(config.value);
    }
  } catch (e) {
    console.warn("[PROMPT-BUILDER] Errore recupero costituzione, uso default.");
  }

  const traits = Array.isArray(agent.traits) ? agent.traits.join(", ") : "";
  const directives = agent.directives || "Agisci in autonomia seguendo gli obiettivi aziendali.";
  
  // 2. Integrazione Skills (Istruzioni MD)
  let skillInstructions = "";
  let agentSkills = Array.isArray(agent.skills) ? [...agent.skills] : [];

  // V3.4: AUTO-INJECT MISSION_PLANNER SKILL
  // Se l'agente è contrassegnato come planner in una missione attiva, forziamo l'SOP di orchestrazione
  if (extraContext && extraContext.includes('MISSION_PLANNER_PROTOCOL_ACTIVE')) {
     console.log(`[PROMPT-BUILDER] Auto-injecting INTERNAL_ORCHESTRATION_PROTOCOL for ${agent.name}`);
     try {
       const skillPath = path.join(ABSOLUTE_SKILLS_PATH, 'system', 'mission_planner.md');
       const planningSop = fs.readFileSync(skillPath, 'utf8');
       skillInstructions += `\n## [AUTO-INIT: MISSION_PLANNER]\n${planningSop}\n`;
     } catch (err) {
       console.warn("[PROMPT-BUILDER] Failed to read mission_planner skill, falling back to basic prompt.");
     }
  }

  if (agentSkills.length > 0) {
    for (const skillId of agentSkills) {
      const skill = skillRegistry.getSkill(skillId);
      if (skill) {
        skillInstructions += `\n## [SKILL: ${skill.name}]\n${skill.instructions}\n`;
      }
    }
  }

  // 3. Direttiva Tool Calling Nativa
  let toolUsageDirective = "";
  if (Array.isArray(extraContext) && extraContext.length > 0) {
    // In questo contesto (Paperclip), passiamo i nomi dei tool tramite extraContext se è un array
    toolUsageDirective = `\n# [NATIVE TOOLS]\nHai accesso a: ${extraContext.join(", ")}. USA questi tool per dati reali. NON allucinare.\n`;
  }

  return `
${MASTER_STYLE}

# [IDENTITY]
Name: ${agent.name}
Role: ${agent.role}
Context: ${agent.bio || 'Membro operativo di Mirror Agency.'}

# [CORPORATE CONSTITUTION]
${constitution}

# [BEHAVIORAL TRAITS]
Your core traits are: ${traits || 'Professional, Efficient, Autonomous.'}
Adopt these behavioral patterns in every interaction.

# [ROLE DIRECTIVES]
${directives}

${skillInstructions ? `# [SKILLS & CAPABILITIES]${skillInstructions}` : ''}

${extraContext ? `# [EXTERNAL CONTEXT / KNOWLEDGE]\n${extraContext}\n` : ''}

# [OPERATIONAL MANDATE]
Operate as a "Zero Human Agency" component. Your decisions must be deterministic, optimized, and aligned with Mirror Agency's strategic dominance. Avoid filler text. Focus on the objective.

# [NEURAL PERSISTENCE & DATA INTEGRITY]
Sei parte di una missione multi-agente. I tuoi log di esecuzione sono la memoria storica dell'Agenzia.
1. ESTRAZIONE DATI: Includi SEMPRE i dati grezzi estratti dai tool (ID, nomi, scadenze) in tabelle Markdown leggibili.
2. CONTINUITÀ: Struttura i dati in modo che l'agente che verrà dopo di te possa utilizzarli immediatamente senza interrogare di nuovo lo stesso tool.
3. FEDELTÀ: Non allucinare dati. Se un tool non restituisce risultati, dichiaralo in modo professionale nelle tabelle.

# [AUTHORITY & EXECUTION DIRECTIVE]
Hai l'autorità tecnica per accedere ai tool (Gmail, Calendar, Web). L'utente ha già configurato gli accessi necessari. Procedi con l'uso dei tool per completare il task in modo professionale e accurato.

${MASTER_STYLE}
`.trim();
}

/**
 * NEURAL ROUTER: Pre-processore di orchestrazione.
 * Analizza il prompt dell'utente e decide a quale agente (o agenti) delegare il lavoro.
 * Restituisce l'ID dell'agente target e una motivazione strategica.
 */
export async function executeOrchestration(userPrompt: string) {
  try {
    console.log(`[NEURAL-ROUTER] Orchestrating request: "${userPrompt.substring(0, 50)}..."`);

    // 1. Recupero tutti gli agenti e le loro skills per mappare le competenze
    const { data: agents, error } = await supabase
      .from('anima_agents')
      .select('id, name, role, bio, skills')
      .neq('id', 'system'); // Escludiamo l'orchestratore stesso dall'elenco delegabile per evitare loop

    if (error || !agents) throw new Error("Impossibile recuperare gli agenti per l'orchestrazione.");

    // 2. Costruzione della "Mappa delle Competenze" per il Router
    const agencyMap = agents.map(a => ({
      id: a.id,
      name: a.name,
      role: a.role,
      expertise: a.bio,
      skills: a.skills
    }));

    // 3. Prompt di Routing (Paperclip Orchestration Protocol v4.0)
    const routingPrompt = `
      # [ORCHESTRATION PROTOCOL: MISSION ARCHITECT]
      Sei il Neural Router di ANIMA. Il tuo compito è analizzare la richiesta dell'utente e assegnarla all'Intelligence (Agente) più idonea della Mirror Agency.

      # [AVAILABLE AGENCY MAP]
      ${JSON.stringify(agencyMap, null, 2)}

      # [ROUTING RULES]
      1. ANALISI INTENTO: Capisci se l'utente vuole un'azione creativa, analitica, gestionale o tecnica.
      2. MAPPING SKILLS: Se l'utente chiede di "leggere email" o "gestire progetti", il Project Manager (o chi ha skill 'gmail') è prioritario.
      3. CREATIVITY: Se si parla di design, colori, concept o brand, il Creative Director è il target.
      4. STRATEGY: Per piani a lungo termine o analisi di mercato, usa lo Strategic Planner.
      5. FALLBACK: Se non sei sicuro, usa il CEO (Leo Mirror) per una visione d'insieme.

      # [OUTPUT FORMAT]
      Rispondi ESCLUSIVAMENTE con un oggetto JSON valido:
      {
        "targetAgentId": "id-dell-agente",
        "reasoning": "Breve spiegazione tecnica della scelta",
        "systemLog": "[ROUTING] Connessione stabilita con [Nome Agente] per [Motivo]..."
      }
    `;

    // 4. Chiamata al modello di Routing (usiamo Gemini Flash per velocità)
    const genAIAdapter = adapterRegistry.getAdapter('gemini', { 
      apiKey: process.env.GEMINI_API_KEY, 
      model: 'gemini-1.5-flash' 
    });

    const routingResult = await genAIAdapter.chat(
      [{ role: 'user', content: userPrompt }], 
      routingPrompt, 
      { temperature: 0.1 }
    );

    let decision;
    try {
      const jsonText = routingResult.content.replace(/```json|```/g, '').trim();
      decision = JSON.parse(jsonText);
    } catch (e) {
      console.warn("[NEURAL-ROUTER] Fallimento parsing JSON router, uso fallback CEO.");
      decision = { 
        targetAgentId: 'leo-mirror', 
        reasoning: 'Fallback per errore di parsing nel router.',
        systemLog: '[ROUTING] Inizializzazione Neural Link con Leo Mirror (CEO Fallback)...'
      };
    }

    console.log(`[NEURAL-ROUTER] Decision: Delegating to ${decision.targetAgentId} (${decision.reasoning})`);
    return decision;

  } catch (err: any) {
    console.error("[NEURAL-ROUTER-ERROR]", err.message);
    return { 
      targetAgentId: 'leo-mirror', 
      reasoning: `Errore critico router: ${err.message}`,
      systemLog: '[ROUTING] Errore critico nel Neural Router. Connessione di emergenza con il CEO stabilita.'
    };
  }
}

/**
 * Funzione lato server per eseguire chat AI tramite gli adapter di ANIMA.
 */
export async function executeAiChat({ 
  agentId, 
  messages, 
  systemPrompt: rugContext, 
  missionId,
  options = {},
  onChunk // v4.1 Callback per lo streaming dei token e degli stati
}: {
  agentId: string,
  messages: any[],
  systemPrompt?: string,
  missionId?: string,
  options?: ChatOptions,
  onChunk?: (chunk: { type: 'text' | 'tool_call' | 'tool_result' | 'status', content: string, metadata?: any }) => void
}) {
  try {
    console.log(`[AI-BRIDGE-SERVER] Executing chat for agent: ${agentId}`);

    // 1. Recupero informazioni agente e modello dal DB
    const { data: agent, error: agentError } = await supabase
      .from('anima_agents')
      .select('*, anima_ai_models(*)')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      throw new Error(`Agente ${agentId} non trovato nel database.`);
    }

    // 3. Inizializzazione Skill Registry
    await ensureSkillRegistry();
    console.log(`[AI-BRIDGE-SERVER] Skills loaded: ${skillRegistry.getAllSkills().length}`);

    // 2. Determiniamo il provider e la configurazione con NEURAL FALLBACK (Safety first)
    let model = agent.anima_ai_models;
    
    // Se il modello non è attivo, cerchiamo un fallback attivo
    // V3.5: Consideriamo valido il modello anche se la chiave nel DB è assente,
    // poiché verrà risolta successivamente dalle variabili d'ambiente (OpenRouter/Anthropic/etc.)
    if (options.model) {
      console.log(`[AI-BRIDGE-SERVER] [OVERRIDE] Forzo l'uso del modello: ${options.model}`);
      const { data: overrideModel } = await supabase
        .from('anima_ai_models')
        .select('*')
        .eq('id', options.model)
        .single();
      if (overrideModel) {
        model = overrideModel;
      }
    } else if (!model || !model.is_active) {
      console.warn(`[AI-BRIDGE-SERVER] [FALLBACK] Modello ${agent.model_id} non trovato o disattivato. Ricerca fallback...`);
      
      const { data: fallbackModels } = await supabase
        .from('anima_ai_models')
        .select('*')
        .eq('is_active', true)
        .neq('provider', 'ollama') // Evitiamo Ollama come fallback automatico se siamo in cloud
        .limit(1);

      if (fallbackModels && fallbackModels.length > 0) {
        model = fallbackModels[0];
        console.log(`[AI-BRIDGE-SERVER] [FALLBACK] Hot-swap eseguito con successo su: ${model.id}`);
      } else {
        console.error("[AI-BRIDGE-SERVER] [CRITICAL] Nessun modello cloud attivo trovato nel DB!");
      }
    }

    const provider = model?.provider || process.env.AI_PROVIDER || 'gemini';
    const modelName = model?.id || agent.model_id || process.env.AI_MODEL || 'gemini-1.5-flash';
    
    // 3. Recupero tool assegnati all'agente
    const tools: any[] = [];
    if (agent.skills && agent.skills.length > 0) {
      for (const skillId of agent.skills) {
        const skill = skillRegistry.getSkill(skillId);
        if (skill && skill.tools) {
          tools.push(...skill.tools);
        }
      }
    }

    // 4. Costruzione Prompt Strutturato (Paperclip Style)
    // Prepariamo la documentazione completa dei tool da iniettare nel prompt
    const toolDocs = tools.map(t => {
      return `### TOOL: ${t.name}\nDescrizione: ${t.description}\nParametri JSON: ${JSON.stringify(t.parameters || t.input_schema, null, 2)}`;
    }).join("\n\n");

    const finalSystemPrompt = await buildPaperclipPrompt(agent, rugContext);
    
    // Iniettiamo la Data Corrente, la DOCUMENTAZIONE e l'AUTORITÀ (Paperclip Style)
    const currentDateStr = new Date().toISOString();
    const promptWithTools = tools.length > 0 
      ? `${finalSystemPrompt}

# [SYSTEM ENVIRONMENT]
La data e l'ora attuali del sistema sono: ${currentDateStr} (UTC). 
Usa SEMPRE questa data esatta come punto di riferimento assoluto per "oggi", "questa settimana" o "ultimo giorno" nei parametri dei tool (es. timeMin, timeMax, query date).

# [INTERNAL TOOL DOCUMENTATION]
${toolDocs}

# [AUTHORITY & EXECUTION DIRECTIVE]
TUTTE le autorizzazioni per accedere a Gmail e Calendar sono state GIÀ CONCESSE tramite OAuth2. 
L'utente ti ha assegnato questo compito perché HAI GIÀ l'accesso tecnico.
NON chiedere all'utente di configurare gli accessi o di darti permessi. 

# [NATIVE & MANUAL TOOL CALLING]
1. Se il tuo modello lo supporta, usa la funzione nativa "Function Calling".
2. SE NON PUOI usare la funzione nativa, DEVI usare questo formato esatto:
   [CALL: namespace:method({"arg": "val"})]
   
# [NEURAL PERSISTENCE RULES]
- NON inviare MAI il JSON da solo senza il tag [CALL: ...].
- Invia SOLO la chiamata al tool finché non hai tutti i dati.
- Una volta ottenuti i dati, produci il report finale in Markdown basandoti ESCLUSIVAMENTE sui risultati dei tool.
- NON ripetere informazioni già presenti nel Background/Manifest fornito dall'orchestratore.
- [DEDUPLICATION]: Se ricevi un [DEDUPLICATION NOTICE] come risultato di un tool, significa che l'azione è già stata compiuta con successo in precedenza. NON tentare di ripeterla. Usa il risultato fornito (CACHED_RESULT) per il tuo report e NOTIFICA esplicitamente all'utente che l'azione era già stata completata.`
      : finalSystemPrompt;

    // 4. Configurazione opzioni AI (Hard-cap a 4000)
    const capValue = 4000;
    const requestedMaxTokens = options?.maxTokens || options?.max_tokens || capValue;
    const finalMaxTokens = Math.min(requestedMaxTokens, capValue);

    // DeepSeek-R1 e molti modelli gratuiti spesso falliscono con i tool nativi su OpenRouter.
    // Usiamo il protocollo MTC (Manual Tool Calling) iniettato nel prompt per questi modelli.
    const isReasoningModel = modelName.toLowerCase().includes('deepseek-r1') || modelName.toLowerCase().includes('o1') || modelName.toLowerCase().includes('o3');
    const isFreeModel = modelName.toLowerCase().includes(':free');
    const supportsNativeTools = !isReasoningModel && !isFreeModel;

    const chatOptions = {
      ...options,
      model: modelName,
      tools: supportsNativeTools ? tools : [], // Inviamo tool nativi solo se supportati dal modello
      max_tokens: finalMaxTokens, // Unico formato standard per OpenRouter
      temperature: options?.temperature !== undefined ? options.temperature : 0.7
    };

    // V3.5: NEURAL KEY RESOLUTION
    // Priorità: 1. Chiave nel record DB del modello, 2. Env var specifica per provider, 3. Config agente
    const resolveApiKey = (provider: string, modelApiKey?: string, agentApiKey?: string): string | undefined => {
      if (modelApiKey) return modelApiKey;
      if (agentApiKey) return agentApiKey;
      // Fallback automatico alle env var per provider (configurazione standard)
      switch (provider) {
        case 'openrouter': return process.env.OPENROUTER_API_KEY;
        case 'gemini':     return process.env.GEMINI_API_KEY;
        case 'anthropic':  return process.env.ANTHROPIC_API_KEY;
        case 'openai':     return process.env.OPENAI_API_KEY;
        default:           return undefined;
      }
    };

    const resolvedApiKey = resolveApiKey(provider, model?.api_key, agent.adapter_config?.apiKey);
    
    const adapterConfig = {
      apiKey: resolvedApiKey,
      baseUrl: model?.base_url || agent.adapter_config?.baseUrl,
      model: modelName
    };


    // 5. [PAPERCLIP] Connection Resolution is now handled by executors via agentId

    // [PAPERCLIP] Live Diagnostics Link with Agent identity
    console.log(`[AI-BRIDGE-SERVER] Routing tools via Paperclip Protocol for Agent: ${agentId}`);

    const adapter = adapterRegistry.getAdapter(provider, adapterConfig);
    
    let currentMessages = [...messages];
    let iterationCount = 0;
    const MAX_ITERATIONS = 10;
    let finalPayloadToReturn = null;
    let allToolExecutions: any[] = [];
    
    // V3.3: NEURAL STREAM 2.0 (Live Placeholder)
    let liveMessageId: string | null = null;
    if (missionId) {
      try {
        const liveMsg = await createMessage({
          mission_id: missionId,
          agent_id: agentId,
          role: 'assistant',
          content: '📡 _Connessione neurale stabilita. In attesa di elaborazione..._',
          metadata: { type: 'live_stream', status: 'thinking' }
        });
        liveMessageId = liveMsg.id;
      } catch (e) {
        console.warn("[AI-BRIDGE-SERVER] Fallimento creazione live_stream message (bypass)", e);
      }
    }

    // V3.2: NEURAL CONSOLIDATION VARIABLES
    let accumulatedAssistantText = "";
    const toolCallFingerprints = new Map<string, string>(); // signature -> result

    // NEURAL ACCUMULATOR: Caricamento memoria storica della missione (Across-session deduplication)
    if (missionId) {
      const { data: historicalTools } = await supabase
        .from('anima_messages')
        .select('content, metadata')
        .eq('mission_id', missionId)
        .eq('role', 'system')
        .filter('metadata->type', 'eq', 'tool_result');

      if (historicalTools && historicalTools.length > 0) {
        console.log(`[AI-BRIDGE-SERVER] Neural Accumulator: Hydrating ${historicalTools.length} tool results from mission history.`);
        for (const hTool of historicalTools) {
          const toolName = hTool.metadata?.toolName;
          const toolArgsRaw = hTool.metadata?.toolArgs; 
          
          if (toolName && toolArgsRaw) {
            // V3.3: Ensure consistent sorting even for historical data
            const toolArgsObj = typeof toolArgsRaw === 'string' ? JSON.parse(toolArgsRaw) : toolArgsRaw;
            const normalizedArgs = JSON.stringify(toolArgsObj, Object.keys(toolArgsObj).sort());
            const sig = `${toolName}:${normalizedArgs}`;
            
            // Extract result from content if not in metadata (legacy fix)
            const contentParts = hTool.content.split('\nRisultato: ');
            const result = contentParts.length > 1 ? contentParts[1] : hTool.content;
            toolCallFingerprints.set(sig, result);
          } else {
             // Legacy fallback parsing for content-only logs
             const mtmatch = hTool.content.match(/\[TOOL_EXECUTION: ([\s\S]*?)\]\nParametri: ([\s\S]*?)\nRisultato: ([\s\S]*)/);
             if (mtmatch) {
               try {
                 const toolName = mtmatch[1];
                 const toolArgsObj = JSON.parse(mtmatch[2]);
                 const normalizedArgs = JSON.stringify(toolArgsObj, Object.keys(toolArgsObj).sort());
                 const sig = `${toolName}:${normalizedArgs}`;
                 toolCallFingerprints.set(sig, mtmatch[3]);
               } catch(e) {
                 const sig = `${mtmatch[1]}:${mtmatch[2]}`;
                 toolCallFingerprints.set(sig, mtmatch[3]);
               }
             }
          }
        }
      }
    }

    // Supporto per streaming (v4.1)
    let tokenBuffer = "";
    let isBufferingCall = false;

    while (iterationCount < MAX_ITERATIONS) {
      iterationCount++;

      let result = await adapter.chatStream(
        currentMessages, 
        promptWithTools, 
        chatOptions,
        (token: string) => {
          if (!onChunk) return;

          // Euristiche di filtraggio per tag [CALL: ...]
          // Se vediamo l'inizio di una chiamata manuale, entriamo in modalità buffer
          if (token.includes('[') || isBufferingCall) {
            tokenBuffer += token;
            isBufferingCall = true;

            // Se il buffer contiene un tag CALL completo, lo nascondiamo (ma non lo resettiamo finché non finisce con ])
            if (tokenBuffer.includes('[CALL:')) {
              if (tokenBuffer.includes(']')) {
                // Abbiamo intercettato un intero blocco [CALL: ...]. Lo scartiamo e resettiamo.
                tokenBuffer = "";
                isBufferingCall = false;
              }
              // Se siamo dentro un [CALL: ma non abbiamo ancora la fine, non inviamo nulla
              return;
            } else if (!tokenBuffer.startsWith('[') && !tokenBuffer.includes('[')) {
               // Falso allarme, svuotiamo il buffer
               onChunk({ type: 'text', content: tokenBuffer });
               tokenBuffer = "";
               isBufferingCall = false;
            } else if (tokenBuffer.length > 500) {
               // Safety cap: se il buffer cresce troppo senza chiudersi, probabilmente non è un CALL
               onChunk({ type: 'text', content: tokenBuffer });
               tokenBuffer = "";
               isBufferingCall = false;
            }
          } else {
            // Flusso normale di testo
            onChunk({ type: 'text', content: token });
          }
        }
      );

      // V3.4: NEURAL BILLING & COST TRACKING
      let costInEur = 0;
      if (result.usage && model) {
        const inputCost = (result.usage.prompt_tokens / 1000) * (model.input_cost_1k || 0);
        const outputCost = (result.usage.completion_tokens / 1000) * (model.output_cost_1k || 0);
        costInEur = inputCost + outputCost;
        
        console.log(`[NEURAL-BILLING] Agent: ${agent.name} // Model: ${modelName} // Cost: ${costInEur.toFixed(6)}€`);
        
        // Aggiornamento atomico della spesa dell'agente (non-blocking)
        supabase.rpc('increment_agent_spend', { 
          p_agent_id: agentId, 
          p_amount: costInEur 
        }).then(({error}) => {
          if (error) console.error("[NEURAL-BILLING] Error updating agent spend:", error.message);
        });
      }

      // 5.5. Parsing Manual Tool Calls (MTC) - Il "Paperclip Way"
      const resultText = typeof result === 'string' ? result : result.content || "";
      
      // V3.2: ACCUMULATORE NEURALE
      // Puliamo il testo dai tag [CALL: ...] prima di accumularlo per l'utente, 
      // ma lo teniamo per la logica interna del loop.
      const cleanText = resultText.replace(/\[CALL:.*?\]/g, "").trim();
      if (cleanText && !accumulatedAssistantText.includes(cleanText)) {
        accumulatedAssistantText += (accumulatedAssistantText ? "\n\n" : "") + cleanText;
      }

      // STREAM UPDATE: Aggiornamento parziale del pensiero
      if (liveMessageId) {
        await updateMessage(liveMessageId, { 
          content: accumulatedAssistantText || "_Elaborazione in corso..._",
          metadata: { 
            type: 'live_stream', 
            status: 'thinking', 
            iteration: iterationCount,
            usage: result.usage,
            cost: costInEur
          }
        }).catch(() => {});
      }

      const mtcRegex = /\[CALL:\s*([\w:]+)\s*\((.*?)\)\]/g;
      const manualCalls = [];
      let match;
      
      while ((match = mtcRegex.exec(resultText)) !== null) {
        try {
          const name = match[1];
          const args = JSON.parse(match[2]);
          manualCalls.push({ name, args, isManual: true });
        } catch (e) {
          console.error("[MTC-PARSER] Errore parsing argomenti:", match[2]);
        }
      }

      // 5.6. Fallback Parsing: Raw JSON blocks (per modelli pigri o errori di formato)
      if (manualCalls.length === 0 && resultText.trim().startsWith('{')) {
        try {
          const potentialArgs = JSON.parse(resultText.trim());
          // Tenta di indovinare il tool basandosi sui campi (euristica Paperclip)
          let inferredTool = null;
          if (potentialArgs.calendarId || potentialArgs.timeMin) inferredTool = 'gcal:list_events';
          if (potentialArgs.summary && potentialArgs.start) inferredTool = 'gcal:create_event';
          if (potentialArgs.q || potentialArgs.query) inferredTool = 'web:search';
          if (potentialArgs.topic) inferredTool = 'web:news';
          if (potentialArgs.url) inferredTool = 'web:fetch';
          if (potentialArgs.max_results || potentialArgs.q_gmail) inferredTool = 'gmail:list_messages';
          if (potentialArgs.message_id) inferredTool = 'gmail:get_message';
          
          if (inferredTool) {
             console.log(`[MTC-PARSER] Inferred tool from raw JSON: ${inferredTool}`);
             manualCalls.push({ name: inferredTool, args: potentialArgs, isManual: true });
             if (onChunk) onChunk({ type: 'status', content: 'executing_tool', metadata: { toolName: inferredTool } });
          }
        } catch (e: any) {
          console.warn(`[MTC-PARSER] Fallimento euristica su blocco JSON: ${e.message}`);
        }
      }

      console.log(`[AI-BRIDGE-SERVER] Iterazione ${iterationCount} - Analisi risposta completata. Strumenti da eseguire: ${manualCalls.length + (result.tool_calls?.length || 0)}`);

      // 5.7. Unificazione Strutturale (v6) - Standard Canonico OpenAI
      const allToolCalls = [
        ...(result.tool_calls || []).map((tc: any) => ({
          name: tc.name,
          id: tc.id || `tool_native_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'function',
          function: {
            name: tc.function?.name || tc.name,
            arguments: typeof (tc.function?.arguments || tc.args) === 'string' 
              ? (tc.function?.arguments || tc.args) 
              : JSON.stringify(tc.function?.arguments || tc.args)
          }
        })),
        ...manualCalls.map((mc: any) => ({
          name: mc.name,
          id: `tool_manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'function',
          function: {
            name: mc.name,
            arguments: typeof mc.args === 'string' ? mc.args : JSON.stringify(mc.args)
          }
        }))
      ];

      // v4.1: Emissione stati tool call per feedback UI
      if (allToolCalls.length > 0 && onChunk) {
        allToolCalls.forEach(tc => {
          onChunk({ type: 'status', content: 'executing_tool', metadata: { toolName: tc.function?.name || tc.name } });
        });
      }

      if (allToolCalls.length === 0) {
        // Nessun tool chiamato. Risposta finale.
        finalPayloadToReturn = {
          content: accumulatedAssistantText || resultText,
          model: modelName,
          provider: provider,
          toolExecutions: allToolExecutions
        };
        break; // Usciamo dal loop
      }

      console.log(`[AI-BRIDGE-SERVER] Iterazione ${iterationCount} - Tool calls:`, allToolCalls.map((tc: any) => tc.function.name));
      
      const toolResults = [];
      for (const toolCall of allToolCalls) {
        const toolName = toolCall.function.name;
        const toolArgsStr = typeof toolCall.function.arguments === 'string' 
          ? toolCall.function.arguments 
          : JSON.stringify(toolCall.function.arguments);

        // V3.2: DEDUPLICAZIONE TRAMITE FINGERPRINTING (Normalizzazione JSON per stabilità)
        const toolArgsObj = JSON.parse(toolArgsStr);
        const normalizedArgs = JSON.stringify(toolArgsObj, Object.keys(toolArgsObj).sort());
        const fingerprint = `${toolName}:${normalizedArgs}`;

        if (toolCallFingerprints.has(fingerprint)) {
          console.log(`[AI-BRIDGE-SERVER] Skipping duplicate tool call: ${toolName}. Using cached result.`);
          const cachedOutput = toolCallFingerprints.get(fingerprint)!;
          
          // Notifichiamo all'agente che l'azione è un duplicato affinché possa avvisare l'utente (User Choice)
          const deduplicationNotice = `[DEDUPLICATION NOTICE] This action was already executed successfully in a previous turn/session. To protect data integrity and credits, it was not repeated. Use the internal cached result below for your report.\n\nCACHED_RESULT: ${cachedOutput}`;

          toolResults.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            name: toolName, 
            content: deduplicationNotice
          });
          continue;
        }

        const toolArgs = toolArgsObj;
        let toolOutput;
        try {
          // Determiniamo il namespace dal nome canonico del tool
          if (toolName.includes(':')) {
            const colonIdx = toolName.indexOf(':');
            const namespace = toolName.substring(0, colonIdx);
            const method = toolName.substring(colonIdx + 1);
            
            const isMutatingTool = !options?.bypassSafety && (
              /:(create|update|delete|send|post|patch|put)/i.test(toolName) || 
              /^(create|update|delete|send|post|patch|put)/i.test(toolName)
            );
            
            if (isMutatingTool) {
               console.log(`[AI-BRIDGE-SERVER] [CRITICAL] Mutating tool detected: ${toolName}. INITIATING SAFETY BLOCK.`);
               
               if (liveMessageId) {
                 await updateMessage(liveMessageId, { 
                   content: accumulatedAssistantText + `\n\n### 🛡️ [SAFETY BLOCK ACTIVATED]\nRichiesta di autorizzazione per: **${toolName}**`,
                   metadata: { type: 'live_stream', status: 'blocked', tool: toolName }
                 }).catch(() => {});
               }

               return {
                 content: (accumulatedAssistantText ? accumulatedAssistantText + "\n\n" : "") + 
                          `# [SAFETY BLOCK ACTIVATED]\nL'agente ha richiesto l'uso di un tool critico: **${toolName}**.\nRichiesta di approvazione manuale inviata all'operatore.`,
                 model: modelName,
                 provider: provider,
                 toolExecutions: allToolExecutions,
                 requiresApproval: true,
                 blockedTool: toolName,
                 blockedArgs: toolArgs
               };
            }

            if (liveMessageId) {
              await updateMessage(liveMessageId, { 
                content: accumulatedAssistantText + `\n\n> ⚙️ **Esecuzione**: \`${toolName}\`...`,
                metadata: { type: 'live_stream', status: 'calling', tool: toolName }
              }).catch(() => {});
            }

            await supabase
              .from('anima_agents')
              .update({ current_phase: `CALLING: ${toolName.toUpperCase()}` })
              .eq('id', agentId);

            if (namespace === 'scoro') {
              toolOutput = await (scoroExecutor as any).run(method, toolArgs, agentId);
            } else if (namespace === 'gmail' || namespace === 'gcal') {
              toolOutput = await (googleExecutor as any).run(`${namespace}:${method}`, toolArgs, agentId);
            } else if (namespace === 'web') {
              // Web Skill: non richiede credenziali (gratuito, no-auth)
              toolOutput = await (webExecutor as any).run(`web:${method}`, toolArgs);
            } else if (namespace === 'knowledge') {
              // Neural Memory Search (RAG)
              console.log(`[AI-BRIDGE-SERVER] Executing knowledge:search_memory for: "${toolArgs.query}"`);
              toolOutput = await searchKnowledgeInternal(toolArgs.query);
            } else {
              // Tool MCP generico con namespace
              toolOutput = await mcpService.callTool(toolName, toolArgs);
            }
          } else {
            // Tool senza namespace: prova come tool MCP grezzo
            toolOutput = await mcpService.callTool(toolName, toolArgs);
          }
        } catch (err: any) {
          toolOutput = `Errore esecuzione tool: ${err.message}`;
        }

        const stringOutput = typeof toolOutput === 'string' ? toolOutput : JSON.stringify(toolOutput);
        
        // Reset phase after execution (Paperclip Lifecycle Management)
        await supabase
          .from('anima_agents')
          .update({ current_phase: null })
          .eq('id', agentId);
        
        // Salviamo nel fingerprint cache
        toolCallFingerprints.set(fingerprint, stringOutput);

        const resultForLog = {
          role: 'tool',
          tool_call_id: toolCall.id, // Collegamento obbligatorio per coerenza protocollo
          name: toolName, 
          content: stringOutput
        };

        toolResults.push(resultForLog);

        // PERSISTENZA NEURALE: Salviamo il log del tool nel DB per gli agenti futuri
        if (missionId) {
           console.log(`[AI-BRIDGE-SERVER] Persistenza log tool: ${toolName}`);
           // Ricalcoliamo il fingerprint normalizzato per il salvataggio
           const normalizedArgsForSave = JSON.stringify(toolArgs, Object.keys(toolArgs).sort());

           await createMessage({
             mission_id: missionId,
             agent_id: agentId,
             role: 'system',
             content: `[TOOL_EXECUTION: ${toolName}]\nParametri: ${normalizedArgsForSave}\nRisultato: ${resultForLog.content.substring(0, 1000)}${resultForLog.content.length > 1000 ? '...' : ''}`,
             metadata: { 
               type: 'tool_result', 
               toolName, 
               toolArgs: normalizedArgsForSave, // Salviamo gli argomenti normalizzati per la deduplicazione rapida
               toolCallId: toolCall.id 
             }
           });
        }
      }

      // Salviamo i tool usati in questo turno nell'array globale delle esecuzioni (per la cronologia visiva UI)
      allToolExecutions.push(...toolResults);

      // Costruiamo i messaggi da aggiungere al contesto per abilitare il prossimo step
      const assistantMessage: any = { 
        role: 'assistant',
        content: resultText || "",
        tool_calls: allToolCalls // Usiamo l'array unificato e canonico (v6)
      };

      const formattedResults = toolResults.map(tr => ({
        role: 'tool',
        tool_call_id: tr.tool_call_id,
        content: tr.content
      }));

      // Aggiungiamo turno dell'assistente e risultati tool alla history per l'iterazione successiva
      currentMessages.push(assistantMessage);
      currentMessages.push(...formattedResults);

      // V3.2: PAPERCLIP-STYLE TERMINATION DIRECTIVE
      // Se siamo alla 4a iterazione, inietto un avviso per "spingere" il modello a chiudere
      if (iterationCount === 4) {
        currentMessages.push({
          role: 'system',
          content: "[DIRECTIVE]: You have used multiple tools. Please provide your FINAL and COMPLETE report in the next response, including all findings from previous turns. Avoid more tool calls if possible."
        });
      }

      // Tracciamo l'evoluzione dell'Agentic Loop su disco (Diagnostica Paperclip Style)
      try {
        const trace = JSON.parse(fs.readFileSync('/tmp/bridge_trace.json', 'utf8') || '{}');
        trace.totalIterations = iterationCount;
        trace.allToolExecutions = allToolExecutions;
        fs.writeFileSync('/tmp/bridge_trace.json', JSON.stringify(trace, null, 2));
      } catch(e) { }

      // Il loop ricomincerà interrogando di nuovo l'Adapter con il nuovo blocco di 'currentMessages'
    }

    // V4.0: NEURAL CONSOLIDATOR - Garantisce una risposta testuale se sono stati usati tool
    if (!accumulatedAssistantText.trim() && allToolExecutions.length > 0) {
      console.log("[AI-BRIDGE-SERVER] Neural Consolidator: Forcing final text summary...");
      currentMessages.push({
        role: 'system',
        content: "[DIRECTIVE]: You have executed tools but provided no text response. Summarize ALL your tool findings for the user NOW using GFM MARKDOWN TABLES for any structured data (colors, dates, results). provide a deep, professional response. Do NOT use more tools."
      });
      const finalTurn = await adapter.chat(currentMessages, promptWithTools, chatOptions);
      const finalText = typeof finalTurn === 'string' ? finalTurn : finalTurn.content || "";
      accumulatedAssistantText = finalText.replace(/\[CALL:.*?\]/g, "").trim();
      
      // Update finalPayload with the new content
      if (finalPayloadToReturn) {
        finalPayloadToReturn.content = accumulatedAssistantText;
      } else {
        finalPayloadToReturn = {
           content: accumulatedAssistantText,
           model: modelName,
           provider: provider,
           toolExecutions: allToolExecutions
        };
      }
    }

    // V3.3: FINAL STREAM UPDATE (Consolidamento conclusivo)
    if (liveMessageId) {
      await updateMessage(liveMessageId, { 
        content: accumulatedAssistantText,
        metadata: { type: 'live_stream', status: 'completed' }
      }).catch(() => {});
    }

    return finalPayloadToReturn;

  } catch (err: any) {
    console.error("[AI-BRIDGE-SERVER-ERROR]", err.message);
    throw err;
  }
}
