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
import { createMessage } from './anima-persistence';

const ABSOLUTE_SKILLS_PATH = '/Users/francescoguidotti/Documents/Lavoro/anima/skills';
const skillRegistry = new (SkillRegistry as any)(ABSOLUTE_SKILLS_PATH);
let isSkillRegistryInitialized = false;

async function ensureSkillRegistry() {
  if (!isSkillRegistryInitialized) {
    await skillRegistry.scan();
    isSkillRegistryInitialized = true;
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
  if (agent.skills && agent.skills.length > 0) {
    for (const skillId of agent.skills) {
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

# [VISUAL & FORMATTING DIRECTIVE]
Produci risposte con un'estetica PREMIUM e PROFESSIONALE:
1. Usa SEMPRE il Markdown per strutturare il testo (Titoli, Liste puntate, Grassetti).
2. Evita muri di testo: usa paragrafi brevi e spaziature chiare.
3. Se presenti dati numerici o liste di email/appuntamenti, usa TABELLE o LISTE DETTAGLIATE con grassetti sui termini chiave.
4. Ogni risposta deve iniziare con un titolo o un'intestazione chiara che riassuma l'azione svolta.
5. NON usare introduzioni prolisse come "Certamente, ecco il tuo report". Vai dritto al punto con autorità corporativa.

# [NEURAL PERSISTENCE & DATA INTEGRITY]
Sei parte di una missione multi-agente. I tuoi log di esecuzione sono la memoria dell'Agenzia.
1. SINTESI DEI DATI: Nel tuo report finale, devi includere TUTTI i dati rilevanti estratti dai tool (nomi, date, URL, testi). NON limitarti a dire "ho trovato le informazioni", ma riportale esplicitamente in Markdown.
2. CONTINUITÀ: Struttura i dati in modo che l'agente che verrà dopo di te possa utilizzarli senza dover chiamare di nuovo gli stessi tool.
3. FEDELTÀ: Non allucinare dati che non hai trovato nei tool. Se un tool non restituisce risultati, dichiaralo chiaramente.

# [AUTHORITY & EXECUTION DIRECTIVE]
Hai l'autorità tecnica per accedere ai tool (Gmail, Calendar, Web). L'utente ha già configurato gli accessi necessari. Procedi con l'uso dei tool per completare il task in modo professionale e accurato.
`.trim();
}

/**
 * Funzione lato server per eseguire chat AI tramite gli adapter di ANIMA.
 */
export async function executeAiChat({ 
  agentId, 
  messages, 
  systemPrompt: rugContext, 
  missionId,
  options = {} 
}: {
  agentId: string,
  messages: any[],
  systemPrompt?: string,
  missionId?: string,
  options?: ChatOptions
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

    // 2. Determiniamo il provider e la configurazione
    const model = agent.anima_ai_models;
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

    const adapterConfig = {
      apiKey: model?.api_key || agent.adapter_config?.apiKey,
      baseUrl: model?.base_url || agent.adapter_config?.baseUrl,
      model: modelName
    };

    // 5. Recupero Connessioni ed Esecuzione Tool Locale
    const { data: agentConnections } = await supabase
      .from('anima_agent_connections')
      .select('connection_id, anima_connections(*)')
      .eq('agent_id', agentId);
    
    const decryptedConnections = (agentConnections || []).map((ac: any) => {
      // Robustezza: Supabase join potrebbe restituire array o singolo oggetto
      const anima_conn = Array.isArray(ac.anima_connections) ? ac.anima_connections[0] : ac.anima_connections;
      if (!anima_conn) return null;

      const creds = anima_conn.credentials;
      const rawEncrypted = typeof creds === 'string' ? creds : creds?.encrypted;
      
      return {
        ...anima_conn,
        credentials: rawEncrypted
      };
    }).filter((c: any) => c && c.type); // Escludiamo eventuali null

    // Diagnostica reale su disco per ispezione
    try {
      fs.writeFileSync('/tmp/bridge_trace.json', JSON.stringify({ 
        agentId, 
        connectionsFound: decryptedConnections.map((c: any) => ({ type: c.type, hasCreds: !!c.credentials })) 
      }, null, 2));
    } catch(e) { }

    const adapter = adapterRegistry.getAdapter(provider, adapterConfig);
    
    let currentMessages = [...messages];
    let iterationCount = 0;
    const MAX_ITERATIONS = 10;
    let finalPayloadToReturn = null;
    let allToolExecutions: any[] = [];
    
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

    while (iterationCount < MAX_ITERATIONS) {
      iterationCount++;
      let result = await adapter.chat(currentMessages, promptWithTools, chatOptions);

      // 5.5. Parsing Manual Tool Calls (MTC) - Il "Paperclip Way"
      const resultText = typeof result === 'string' ? result : result.content || "";
      
      // V3.2: ACCUMULATORE NEURALE
      // Puliamo il testo dai tag [CALL: ...] prima di accumularlo per l'utente, 
      // ma lo teniamo per la logica interna del loop.
      const cleanText = resultText.replace(/\[CALL:.*?\]/g, "").trim();
      if (cleanText && !accumulatedAssistantText.includes(cleanText)) {
        accumulatedAssistantText += (accumulatedAssistantText ? "\n\n" : "") + cleanText;
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
          }
        } catch (e: any) {
          console.warn(`[MTC-PARSER] Fallimento euristica su blocco JSON: ${e.message}`);
        }
      }

      console.log(`[AI-BRIDGE-SERVER] Iterazione ${iterationCount} - Analisi risposta completata. Strumenti da eseguire: ${manualCalls.length + (result.tool_calls?.length || 0)}`);

      // 5.7. Unificazione Strutturale (v6) - Standard Canonico OpenAI
      const allToolCalls = [
        ...(result.tool_calls || []).map((tc: any) => ({
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
          id: `tool_manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'function',
          function: {
            name: mc.name,
            arguments: typeof mc.args === 'string' ? mc.args : JSON.stringify(mc.args)
          }
        }))
      ];

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
            
            // Verifichiamo se abbiamo una connessione per questo namespace
            const connection = decryptedConnections.find((c: any) => 
              c.type === namespace || 
              (namespace === 'gcal' && c.type === 'gmail') ||
              (namespace === 'gmail' && c.type === 'google')
            );
            
            // V3.3: Safety Block enhanced with immediate return
            const isMutatingTool = !options?.bypassSafety && (
              /:(create|update|delete|send|post|patch|put)/i.test(toolName) || 
              /^(create|update|delete|send|post|patch|put)/i.test(toolName)
            );
            
            if (isMutatingTool) {
               console.log(`[AI-BRIDGE-SERVER] [CRITICAL] Mutating tool detected: ${toolName}. INITIATING SAFETY BLOCK.`);
               // Return IMMEDIATELY to halt the loop and pass control back to the human
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

            // Paperclip Monitoring: Update phase to CALLING_TOOL
            await supabase
              .from('anima_agents')
              .update({ current_phase: `CALLING: ${toolName.toUpperCase()}` })
              .eq('id', agentId);

            if (namespace === 'scoro') {
              if (!connection) throw new Error(`Nessun account Scoro collegato a questo agente.`);
              toolOutput = await (scoroExecutor as any).run(method, toolArgs, connection.credentials);
            } else if (namespace === 'gmail' || namespace === 'gcal') {
              if (!connection) throw new Error(`Nessun account Google (${namespace}) collegato a questo agente.`);
              toolOutput = await (googleExecutor as any).run(`${namespace}:${method}`, toolArgs, connection.credentials);
            } else if (namespace === 'web') {
              // Web Skill: non richiede credenziali (gratuito, no-auth)
              toolOutput = await (webExecutor as any).run(`web:${method}`, toolArgs);
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

    // Se l'agente esaurisce i 3 tentativi consecutivi chiamando SEMPRE tool (non si ferma mai su una stringa)
    if (!finalPayloadToReturn) {
      finalPayloadToReturn = {
        content: accumulatedAssistantText + `\n\n[SISTEMA INTERNO]: Limite di sicurezza raggiunto (${MAX_ITERATIONS}).`,
        model: modelName,
        provider: provider,
        toolExecutions: allToolExecutions
      };
    }

    return finalPayloadToReturn;

  } catch (err: any) {
    console.error("[AI-BRIDGE-SERVER-ERROR]", err.message);
    throw err;
  }
}
