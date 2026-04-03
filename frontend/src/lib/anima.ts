import { supabase } from './supabase';
import { getEmbedding } from './embedding';
import { 
  updateMission as persistUpdateMission, 
  updateTask as persistUpdateTask, 
  createMessage as persistCreateMessage 
} from './anima-persistence';

/**
 * ANIMA Bridge — Gestisce l'accesso agli agenti nel DB
 * e l'interazione con i motori AI nel contesto del frontend (v2).
 */

const REASONING_MODELS = ['pro', 'gpt-4', 'sonnet', 'o1', 'o3', 'r1', '3.5-sonnet', '3.7-sonnet'];
const FAST_MODELS = ['mini', 'flash', 'haiku', 'v3', 'deepseek-chat'];

// Transition flags — Multi-Unit Shift Complete

export interface AgentInfo {
  id: string;
  is_system?: boolean;
  name: string;
  role: string;
  units?: string[]; // Multiple units support
  status: string;
  bio?: string;
  avatar_url?: string;
  system_prompt?: string;
  model_id?: string;
  adapter_config?: any;
  reports_to?: string;
  directives?: string;
  traits?: string[];
  skills?: string[];
  active_connections?: string[];
  current_mission_id?: string | null; // Paperclip V2 Concurrency
  current_task_id?: string | null;    // Paperclip V2 Concurrency
  current_phase?: string | null;      // Paperclip V2 Monitoring
  anima_missions?: { title: string } | null;
  anima_tasks?: { title: string } | null;
  last_activity_at?: string | null;
  created_at?: string;
}

export interface Unit {
  id: string;
  name: string;
  lead_id?: string;
  description?: string;
  reports_to?: string; // Recursive hierarchy support
  connections?: string[]; // Inter-unit strategist links
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  api_key?: string;
  base_url?: string;
  is_active: boolean;
  category?: 'power' | 'fast' | 'specialized'; // Added for logical grouping
}

export interface Mission {
  id: string;
  title: string;
  objective: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  execution_mode?: 'manual' | 'autonomous';
  is_locked?: boolean;
  plannerAgentId?: string;
  unit_id?: string; // New Unit-based mission support
  priority?: number; // New Priority support
  created_at?: string;
  updated_at?: string;
}

export interface Task {
  id: string;
  mission_id: string;
  agent_id: string;
  title: string;
  description?: string;
  status: 'pending' | 'running' | 'completed' | 'error' | 'blocked' | 'waiting';
  requires_approval?: boolean;
  result?: string;
  order_index: number;
  priority?: number; // Priority (1-10) for the queue
  created_at?: string;
  updated_at?: string;
}

export interface Connection {
  id: string;
  type: 'gmail' | 'gcal' | 'scoro';
  name: string;
  credentials: any;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface Skill {
  id: string;
  name: string;
  namespace: string;
  description: string;
  tools: any[];
}


/**
 * Recupera le informazioni di un singolo agente dal DB
 */
export async function getAgentInfo(agentId: string): Promise<AgentInfo | null> {
  const { data, error } = await supabase
    .from('anima_agents')
    .select('*')
    .eq('id', agentId)
    .single();

  if (error || !data) {
    console.error(`[ANIMA LIB] Errore recupero agente ${agentId}:`, error?.message);
    return null;
  }

  return data as AgentInfo;
}

/**
 * Elenca tutti gli agenti presenti nel database
 */
export async function listAllAgents(): Promise<AgentInfo[]> {
  const { data, error } = await supabase
    .from('anima_agents')
    .select('*, anima_missions:current_mission_id(title), anima_tasks:current_task_id(title)')
    .order('name', { ascending: true });

  if (error) {
    console.error("[ANIMA LIB] Errore recupero lista agenti:", error.message);
    return [];
  }

  return data || [];
}

/**
 * Elenca i modelli AI attivi nel sistema
 */
export async function listActiveModels() {
  const { data, error } = await supabase
    .from('anima_ai_models')
    .select('id, name, provider')
    .eq('is_active', true)
    .order('provider', { ascending: true });

  if (error) {
    console.error("[ANIMA LIB] Errore recupero modelli AI:", error.message);
    return [];
  }

  return data || [];
}

/**
 * Crea (assume) un nuovo agente nel sistema
 */
export async function createAgent(agentData: Partial<AgentInfo>) {
  const dataToInsert: any = { ...agentData };
  delete dataToInsert.active_connections;
  
  // Transition logic: multi-unit support is now native
  
  // Sanitize empty strings to null for nullable foreign keys
  if (dataToInsert.reports_to === "") dataToInsert.reports_to = null;
  if (dataToInsert.model_id === "") dataToInsert.model_id = null;

  const { data, error } = await supabase
    .from('anima_agents')
    .insert([dataToInsert])
    .select()
    .single();

  if (error) {
    console.error("[ANIMA LIB] Errore creazione agente:", error.message);
    throw error;
  }

  // Handle connection syncing if provided
  if (agentData.active_connections) {
    await syncAgentConnections(data.id, agentData.active_connections);
  }

  return data;
}

/**
 * Aggiorna un agente esistente
 */
export async function updateAgent(id: string, agentData: Partial<AgentInfo>) {
  const dataToUpdate: any = { ...agentData };
  delete dataToUpdate.active_connections;

  // Transition logic: multi-unit support is now native

  // Sanitize empty strings to null for nullable foreign keys
  if (dataToUpdate.reports_to === "") dataToUpdate.reports_to = null;
  if (dataToUpdate.model_id === "") dataToUpdate.model_id = null;

  const { data, error } = await supabase
    .from('anima_agents')
    .update(dataToUpdate)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error("[ANIMA LIB] Errore aggiornamento agente:", error.message);
    throw error;
  }

  // Handle connection syncing if provided
  if (agentData.active_connections) {
    await syncAgentConnections(id, agentData.active_connections);
  }

  return data;
}


/**
 * Verifica l'univocità dello slug
 */
export async function isSlugUnique(slug: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('anima_agents')
    .select('*', { count: 'exact', head: true })
    .eq('id', slug);
  
  if (error) return false;
  return count === 0;
}

/**
 * Elimina un agente dal database
 */
export async function deleteAgent(id: string): Promise<boolean> {
  // Protezione Neurale: Gli agenti di sistema non possono essere eliminati tramite SDK/UI
  const agent = await getAgentInfo(id);
  if (agent?.is_system) {
    console.error(`[ANIMA LIB] IMPOSSIBILE ELIMINARE AGENTE DI SISTEMA: ${id}`);
    throw new Error(`L'agente ${id} è parte dell'infrastruttura core di ANIMA e non può essere rimosso.`);
  }

  const { error } = await supabase
    .from('anima_agents')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[SDK DELETE AGENT ERROR]', error.message);
    throw error;
  }

  return true;
}

/** --- UNITS --- **/

export async function listUnits(): Promise<Unit[]> {
  const { data, error } = await supabase.from('anima_units').select('*').order('name');
  if (error) {
    console.error("[ANIMA LIB] Error listing units:", error.message);
    return [];
  }
  return data || [];
}

export async function createUnit(unit: Partial<Unit>) {
  const dataToInsert = { ...unit };
  delete dataToInsert.connections;

  const { data, error } = await supabase.from('anima_units').insert([dataToInsert]).select().single();
  if (error) throw error;
  
  if (unit.connections && unit.connections.length > 0) {
    await syncUnitConnections(data.id, unit.connections);
  }
  
  return data;
}

export async function deleteUnit(id: string) {
  const { error } = await supabase.from('anima_units').delete().eq('id', id);
  if (error) throw error;
}

export async function updateUnit(id: string, unitData: Partial<Unit>) {
  const dataToUpdate = { ...unitData };
  delete dataToUpdate.connections;

  const { data, error } = await supabase.from('anima_units').update(dataToUpdate).eq('id', id).select().single();
  if (error) throw error;

  if (unitData.connections) {
    await syncUnitConnections(id, unitData.connections);
  }

  return data;
}

/** --- UNIT CONNECTIONS --- **/

export async function listUnitConnections(unitId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('anima_unit_connections')
    .select('related_unit_id')
    .eq('unit_id', unitId);
  
  if (error) return [];
  return data.map(d => d.related_unit_id);
}

export async function syncUnitConnections(unitId: string, relatedUnitIds: string[]) {
  // First delete existing
  await supabase.from('anima_unit_connections').delete().eq('unit_id', unitId);
  
  if (relatedUnitIds.length === 0) return;

  const toInsert = relatedUnitIds.map(id => ({ unit_id: unitId, related_unit_id: id }));
  const { error } = await supabase.from('anima_unit_connections').insert(toInsert);
  if (error) throw error;
}

/** --- UNITS --- **/
/** Helper: Ottiene una stringa formattata delle unità dell'agente */
export function getAgentUnits(agent: AgentInfo): string {
  if (!agent.units || agent.units.length === 0) return 'UNASSIGNED';
  return agent.units.join(' / ');
}

/** --- LEGACY DEPARTMENT ALIASES (Transitioned to Units) --- **/
/** @deprecated Usare listUnits */
export const listDepartments = listUnits;
/** @deprecated Usare createUnit */
export const createDepartment = createUnit;
/** @deprecated Usare updateUnit */
export const updateDepartment = updateUnit;
/** @deprecated Usare deleteUnit */
export const deleteDepartment = deleteUnit;

export async function getUnitMetrics(unitId: string) {
  // Count tasks by status for all missions in this unit
  const { data: missions, error: mError } = await supabase
    .from('anima_missions')
    .select('id')
    .eq('unit_id', unitId);

  if (mError || !missions) return { running: 0, waiting: 0, score: 0, label: 'IDLE' };

  const missionIds = missions.map(m => m.id);
  if (missionIds.length === 0) return { running: 0, waiting: 0, score: 0, label: 'IDLE' };

  const { data: tasks, error: tError } = await supabase
    .from('anima_tasks')
    .select('status')
    .in('mission_id', missionIds)
    .in('status', ['running', 'waiting']);

  if (tError || !tasks) return { running: 0, waiting: 0, score: 0, label: 'IDLE' };

  const running = tasks.filter(t => t.status === 'running').length;
  const waiting = tasks.filter(t => t.status === 'waiting').length;
  const score = (running * 2) + waiting;

  let label = 'NOMINAL';
  if (score === 0) label = 'IDLE';
  else if (score < 4) label = 'LOW';
  else if (score > 10) label = 'HIGH';

  return { running, waiting, score, label };
}


/** --- AI MODELS --- **/

/**
 * Elenca i modelli AI attivi o configurati, raggruppandoli per categoria logica.
 */
export async function getGroupedActiveModels(): Promise<Record<string, AIModel[]>> {
  const { data, error } = await supabase
    .from('anima_ai_models')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error("[ANIMA LIB] Error listing active AI models:", error.message);
    return { '⚡ POWER & REASONING': [], '🚀 FAST & EFFICIENT': [], '🧪 SPECIALIZED & FREE': [] };
  }

  const grouped: Record<string, AIModel[]> = {
    '⚡ POWER & REASONING': [],
    '🚀 FAST & EFFICIENT': [],
    '🧪 SPECIALIZED & FREE': []
  };

  (data || []).forEach(model => {
    const id = model.id.toLowerCase();
    // Euristiche di raggruppamento basate sul nome/ID
    if (id.includes('pro') || id.includes('gpt-4') || id.includes('sonnet') || id.includes('o1') || id.includes('o3') || id.includes('r1')) {
      grouped['⚡ POWER & REASONING'].push(model);
    } else if (id.includes('mini') || id.includes('flash') || id.includes('haiku') || id.includes('v3')) {
      grouped['🚀 FAST & EFFICIENT'].push(model);
    } else {
      grouped['🧪 SPECIALIZED & FREE'].push(model);
    }
  });

  return grouped;
}

export async function listAiModels(onlyActive = true): Promise<AIModel[]> {
  let query = supabase.from('anima_ai_models').select('*').order('name');
  if (onlyActive) {
    query = query.eq('is_active', true);
  }
  const { data, error } = await query;
  if (error) {
    console.error("[ANIMA LIB] Error listing AI models:", error.message);
    return [];
  }
  return data || [];
}

export async function createAiModel(model: AIModel) {
  const { data, error } = await supabase.from('anima_ai_models').insert([model]).select().single();
  if (error) throw error;
  return data;
}

export async function deleteAiModel(id: string) {
  const { error } = await supabase.from('anima_ai_models').delete().eq('id', id);
  if (error) throw error;
}

export async function updateAiModel(id: string, modelData: Partial<AIModel>) {
  const { data, error } = await supabase.from('anima_ai_models').update(modelData).eq('id', id).select().single();
  if (error) throw error;
  return data;
}


/** --- MISSIONS --- **/

export async function listMissions(): Promise<Mission[]> {
  const { data, error } = await supabase.from('anima_missions').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error("[ANIMA LIB] Error listing missions:", error.message);
    return [];
  }
  return data || [];
}

export async function getMission(id: string): Promise<Mission | null> {
  const { data, error } = await supabase.from('anima_missions').select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

export async function createMission(mission: Partial<Mission>) {
  const { data, error } = await supabase.from('anima_missions').insert([mission]).select().single();
  if (error) throw error;
  return data;
}

export async function updateMission(id: string, missionData: Partial<Mission>) {
  return persistUpdateMission(id, missionData);
}

export async function deleteMission(id: string) {
  const { error } = await supabase.from('anima_missions').delete().eq('id', id);
  if (error) throw error;
}


/** --- TASKS --- **/

export async function listTasksByMission(missionId: string): Promise<Task[]> {
  const { data, error } = await supabase.from('anima_tasks').select('*').eq('mission_id', missionId).order('order_index');
  if (error) {
    console.error("[ANIMA LIB] Error listing tasks:", error.message);
    return [];
  }
  return data || [];
}

export async function createTask(task: Partial<Task>) {
  const { data, error } = await supabase.from('anima_tasks').insert([task]).select().single();
  if (error) throw error;
  return data;
}

export async function updateTask(id: string, taskData: Partial<Task>) {
  return persistUpdateTask(id, taskData);
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from('anima_tasks').delete().eq('id', id);
  if (error) throw error;
}


/** --- MESSAGES (Neural Stream) --- **/

export async function createMessage(msg: {
  mission_id?: string;
  session_id?: string;
  agent_id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  metadata?: any;
}) {
  return persistCreateMessage(msg);
}

export async function listMessagesByMission(missionId: string) {
  const { data, error } = await supabase
    .from('anima_messages')
    .select('*')
    .eq('mission_id', missionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error("[ANIMA LIB] Error listing messages:", error.message);
    return [];
  }
  return data || [];
}




/** --- CONFIGURATION --- **/

export async function listConfig() {
  const { data, error } = await supabase.from('anima_config').select('*');
  if (error) {
    console.error("[ANIMA LIB] Error listing config:", error.message);
    return [];
  }
  return data || [];
}

export async function updateConfig(key: string, value: any) {
  const { data, error } = await supabase
    .from('anima_config')
    .upsert({ key, value, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) {
    console.error(`[ANIMA LIB] Error updating config ${key}:`, error.message);
    throw error;
  }
  return data;
}


/** --- CONNECTIONS --- **/

export async function listConnections(): Promise<Connection[]> {
  const { data, error } = await supabase.from('anima_connections').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error("[ANIMA LIB] Error listing connections:", error.message);
    return [];
  }
  return data || [];
}

export async function createConnection(conn: Partial<Connection>) {
  const { data, error } = await supabase.from('anima_connections').insert([conn]).select().single();
  if (error) throw error;
  return data;
}

export async function deleteConnection(id: string) {
  const { error } = await supabase.from('anima_connections').delete().eq('id', id);
  if (error) throw error;
}

/** --- AGENT CONNECTIONS --- **/

export async function listAgentConnections(agentId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('anima_agent_connections')
    .select('connection_id')
    .eq('agent_id', agentId);
  
  if (error) return [];
  return data.map(d => d.connection_id);
}

export async function syncAgentConnections(agentId: string, connectionIds: string[]) {
  // First delete existing
  await supabase.from('anima_agent_connections').delete().eq('agent_id', agentId);
  
  if (connectionIds.length === 0) return;

  const toInsert = connectionIds.map(id => ({ agent_id: agentId, connection_id: id }));
  const { error } = await supabase.from('anima_agent_connections').insert(toInsert);
  if (error) throw error;
}


/**
 * Cerca conoscenza semantica nelle SOPs (RAG)
 */
export async function searchKnowledge(query: string) {
  try {
    const queryEmbedding = await getEmbedding(query);

    const { data: matches, error } = await supabase.rpc('match_knowledge', {
      query_embedding: queryEmbedding,
      match_threshold: 0.2, 
      match_count: 5
    });

    if (error) {
      console.warn("[RAG] Errore nella ricerca semantica (bypass):", error.message);
      return "";
    }

    if (!matches || matches.length === 0) return "";

    return matches.map((m: any) => 
      `--- SOP: ${m.metadata?.title || 'Generale'} ---\n${m.content}`
    ).join("\n\n");

  } catch (err: any) {
    console.warn("[RAG] Fallimento silenzioso ricerca semantica:", err.message);
    return "";
  }
}

/**
 * Client AI unificato (Agnostico)
 * In v2, non chiama più Gemini direttamente ma usa il bridge API locale (/api/ai/chat).
 * Questo permette di essere totalmente indipendenti dal modello (Ollama, Claude, Gemini, etc).
 */
export async function animaChat({ agentId, messages, systemPrompt: overrideSystemPrompt, missionId, options }: { 
  agentId: string, 
  messages: { role: 'user' | 'assistant', content: string }[],
  systemPrompt?: string,
  missionId?: string,
  options?: { bypassSafety?: boolean, sessionId?: string }
}) {
  try {
    // 1. RAG (eseguito sul frontend se possibile)
    const lastUserMessage = messages[messages.length - 1]?.content || "";
    const knowledgeContext = await searchKnowledge(lastUserMessage);
    
    // Uniamo il prompt di sistema dell'agente (se fornito come override) con il contesto RAG
    let systemPrompt = knowledgeContext ? `[KNOWLEDGE BASE]\n${knowledgeContext}` : undefined;
    if (overrideSystemPrompt) {
      systemPrompt = systemPrompt ? `${overrideSystemPrompt}\n\n${systemPrompt}` : overrideSystemPrompt;
    }

    // 2. Controllo Ambiente: Server vs Client
    if (typeof window === 'undefined') {
      // AMBIENTE SERVER: Chiamiamo direttamente la logica del bridge
      console.log("[ANIMA LIB] Executing animaChat on SERVER context");
      const { executeAiChat } = await import('./ai-bridge-server');
      const result = await executeAiChat({
        agentId,
        messages,
        systemPrompt,
        missionId,
        options
      });
      return result;
    }

    // AMBIENTE CLIENT: Usiamo il bridge API via HTTP
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId,
        messages,
        systemPrompt,
        missionId,
        options
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Chat failed");

    return data;
  } catch (err: any) {
    console.error("[ANIMA LIB] Chat fallita:", err.message);
    throw err;
  }
}

