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

# [CLEAN SLATE PROTOCOL]
IGNORA ogni tua interazione precedente in cui affermavi di non avere accesso ai tool. 
I sistemi di integrazione sono stati APPENA attivati correttamente. 
Qualsiasi tua precedente dichiarazione di "mancanza di accesso" è ora OBSOLETA e FALSA. 
Procedi con l'uso dei tool senza ulteriori scuse o richieste di configurazione.
`.trim();
}

/**
 * Funzione lato server per eseguire chat AI tramite gli adapter di ANIMA.
 */
export async function executeAiChat({ 
  agentId, 
  messages, 
  systemPrompt: rugContext, 
  options = {} 
}: {
  agentId: string,
  messages: any[],
  systemPrompt?: string,
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
2. SE NON PUOI usare la funzione nativa, scrivi nel tuo messaggio la seguente stringa esatta:
   [CALL: namespace:method({"arg": "val"})]
   
Esempio: per leggere le mail scrivi: [CALL: gmail:list_messages({"max_results": 10})]
USA IMMEDIATAMENTE i tool sopra descritti per recuperare i dati reali.`
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
      maxTokens: finalMaxTokens,
      max_tokens: finalMaxTokens, // Nome standard per OpenRouter/OpenAI
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
    const MAX_ITERATIONS = 3;
    let finalPayloadToReturn = null;
    let allToolExecutions: any[] = [];

    while (iterationCount < MAX_ITERATIONS) {
      iterationCount++;
      let result = await adapter.chat(currentMessages, promptWithTools, chatOptions);

      // 5.5. Parsing Manual Tool Calls (MTC) - Il "Paperclip Way"
      const resultText = typeof result === 'string' ? result : result.content || "";
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

      // Unifichiamo i tool calls (nativi e manuali)
      const allToolCalls = [
        ...(result.tool_calls || []),
        ...manualCalls
      ];

      if (allToolCalls.length === 0) {
        // Nessun tool chiamato. Abbiamo la risposta finale.
        finalPayloadToReturn = {
          content: resultText,
          model: modelName,
          provider: provider,
          toolExecutions: allToolExecutions
        };
        break; // Usciamo dal loop
      }

      console.log(`[AI-BRIDGE-SERVER] Iterazione ${iterationCount} - Tool calls rilevati:`, allToolCalls.map((tc: any) => tc.name));
      
      const toolResults = [];
      for (const toolCall of allToolCalls) {
        let toolOutput;
        try {
          // Determiniamo se è un tool locale o MCP
          if (toolCall.name.includes(':')) {
            const [namespace, toolName] = toolCall.name.split(':');
            
            // Verifichiamo se abbiamo una connessione per questo namespace
            const connection = decryptedConnections.find((c: any) => 
              c.type === namespace || 
              (namespace === 'gcal' && c.type === 'gmail') ||
              (namespace === 'gmail' && c.type === 'google')
            );
            
            if (namespace === 'scoro') {
              if (!connection) throw new Error(`Nessun account Scoro collegato a questo agente.`);
              toolOutput = await (scoroExecutor as any).run(toolName, toolCall.args, connection.credentials);
            } else if (namespace === 'gmail' || namespace === 'gcal') {
              if (!connection) throw new Error(`Nessun account Google collegato a questo agente.`);
              toolOutput = await (googleExecutor as any).run(toolName, toolCall.args, connection.credentials);
            } else {
              toolOutput = await mcpService.callTool(toolCall.name, toolCall.args);
            }
          } else {
            toolOutput = "Tool non riconosciuto (manca namespace).";
          }
        } catch (err: any) {
          toolOutput = `Errore esecuzione tool: ${err.message}`;
        }

        toolResults.push({
          role: 'tool',
          name: toolCall.name,
          content: typeof toolOutput === 'string' ? toolOutput : JSON.stringify(toolOutput)
        });
      }

      // Salviamo i tool usati in questo turno nell'array globale delle esecuzioni (per la cronologia visiva UI)
      allToolExecutions.push(...toolResults);

      // Costruiamo i messaggi da aggiungere al contesto per abilitare il prossimo step
      const assistantMessage: any = { role: 'assistant' };
      if (result.tool_calls) assistantMessage.tool_calls = result.tool_calls;
      if (resultText) assistantMessage.content = resultText;

      const formattedResults = toolResults.map(tr => {
        const isError = typeof tr.content === 'string' && tr.content.toLowerCase().includes('errore');
        const antiHallucinationPrompt = isError 
          ? `\n\n[CRITICAL ERROR DIRECTIVE START]\nThis tool failed to execute due to the error above. You MUST NOT hallucinate, invent, or simulate data to pretend it worked. You MUST reply to the user stating exactly that this error occurred and you cannot proceed with fake data.\n[CRITICAL ERROR DIRECTIVE END]`
          : '';

        return {
          role: 'user',
          content: `[SYSTEM: TOOL_RESULT named "${tr.name}"]\n${tr.content}${antiHallucinationPrompt}`
        };
      });

      // Aggiungiamo turno dell'assistente e risultati tool alla history per l'iterazione successiva
      currentMessages.push(assistantMessage);
      currentMessages.push(...formattedResults);

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
        content: `[SISTEMA INTERNO]: L'Agente ha superato il limite massimo di sicurezza (${MAX_ITERATIONS} iterazioni consecutive). L'esecuzione è stata arrestata preventivamente per proteggere i crediti.`,
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
