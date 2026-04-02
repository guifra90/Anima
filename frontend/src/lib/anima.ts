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

export interface AgentInfo {
  id: string;
  name: string;
  role: string;
  department: string;
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

export interface Department {
  id: string;
  name: string;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  api_key?: string;
  base_url?: string;
  is_active: boolean;
}

export interface Mission {
  id: string;
  title: string;
  objective: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  execution_mode?: 'manual' | 'autonomous';
  is_locked?: boolean;
  plannerAgentId?: string;
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
 * Crea (assume) un nuovo agente nel sistema
 */
export async function createAgent(agentData: Partial<AgentInfo>) {
  const dataToInsert: any = { ...agentData };
  delete dataToInsert.active_connections;
  
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

/** --- DEPARTMENTS --- **/

export async function listDepartments(): Promise<Department[]> {
  const { data, error } = await supabase.from('anima_departments').select('*').order('name');
  if (error) {
    console.error("[ANIMA LIB] Error listing departments:", error.message);
    return [];
  }
  return data || [];
}

export async function createDepartment(dept: Department) {
  const { data, error } = await supabase.from('anima_departments').insert([dept]).select().single();
  if (error) throw error;
  return data;
}

export async function deleteDepartment(id: string) {
  const { error } = await supabase.from('anima_departments').delete().eq('id', id);
  if (error) throw error;
}

export async function updateDepartment(id: string, name: string) {
  const { data, error } = await supabase.from('anima_departments').update({ name }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}


/** --- AI MODELS --- **/

export async function listAiModels(): Promise<AIModel[]> {
  const { data, error } = await supabase.from('anima_ai_models').select('*').order('name');
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
  agent_id: string;
  role: 'user' | 'assistant' | 'system';
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
  options?: { bypassSafety?: boolean }
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

