import { supabase } from './supabase';
// Importiamo il registro adapter esistente dallo strato di esecuzione
// Usiamo require perché il registro è in CommonJS (execution/)
const adapterRegistry = require('../../../execution/adapters/registry');

export interface ChatOptions {
  model?: string;
  maxTokens?: number;
  [key: string]: any;
}

/**
 * Costruisce un prompt di sistema strutturato seguendo il protocollo Paperclip.
 * Include: Identità, Costituzione Globale, Direttive di Ruolo e Tratti Comportamentali.
 */
async function buildPaperclipPrompt(agent: any, extraContext?: string) {
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

${extraContext ? `# [EXTERNAL CONTEXT / KNOWLEDGE]\n${extraContext}\n` : ''}

# [OPERATIONAL MANDATE]
Operate as a "Zero Human Agency" component. Your decisions must be deterministic, optimized, and aligned with Mirror Agency's strategic dominance. Avoid filler text. Focus on the objective.
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

    // 2. Determiniamo il provider e la configurazione
    const model = agent.anima_ai_models;
    const provider = model?.provider || process.env.AI_PROVIDER || 'gemini';
    const modelName = model?.id || agent.model_id || process.env.AI_MODEL || 'gemini-1.5-flash';
    
    // 3. Costruzione Prompt Strutturato (Paperclip Style)
    // Se è presente un rugContext (RAG), lo passiamo come extra context
    const finalSystemPrompt = await buildPaperclipPrompt(agent, rugContext);

    // Configurazione adapter
    const adapterConfig = {
      apiKey: model?.api_key || agent.adapter_config?.apiKey,
      baseUrl: model?.base_url || agent.adapter_config?.baseUrl,
      model: modelName
    };

    // 4. Recupero l'adapter dal registro e invio la chat
    const adapter = adapterRegistry.getAdapter(provider, adapterConfig);
    
    const resultText = await adapter.chat(messages, finalSystemPrompt, {
      ...options,
      model: modelName
    });

    return {
      content: resultText,
      model: modelName,
      provider: provider
    };

  } catch (err: any) {
    console.error("[AI-BRIDGE-SERVER-ERROR]", err.message);
    throw err;
  }
}
