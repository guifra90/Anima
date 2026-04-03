import { supabase } from './supabase';

/**
 * ANIMA Persistence Layer — Funzioni atomiche di database per evitare dipendenze circolari.
 */

export async function updateMission(id: string, missionData: any) {
  const { data, error } = await supabase.from('anima_missions').update(missionData).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function updateTask(id: string, taskData: any) {
  const { data, error } = await supabase.from('anima_tasks').update(taskData).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function createMessage(msg: {
  mission_id?: string;
  session_id?: string;
  agent_id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  metadata?: any;
}) {
  const { data, error } = await supabase
    .from('anima_messages')
    .insert([msg])
    .select()
    .single();

  if (error) {
    console.error("[ANIMA PERSISTENCE] Error creating message:", error.message);
    throw error;
  }
  return data;
}

export async function updateMessage(id: string, data: any) {
  const { data: updated, error } = await supabase
    .from('anima_messages')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`[ANIMA PERSISTENCE] Error updating message ${id}:`, error.message);
    throw error;
  }
  return updated;
}

/**
 * Gestione Sessioni di Chat Unificata
 */

export async function createSession(agentId: string = 'system', userId: string = 'user-default') {
  const { data, error } = await supabase
    .from('anima_sessions')
    .insert([{ agent_id: agentId, user_id: userId, status: 'active' }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getSessions(userId: string = 'user-default') {
  const { data, error } = await supabase
    .from('anima_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getMessagesBySession(sessionId: string) {
  const { data, error } = await supabase
    .from('anima_messages')
    .select('*, anima_agents(name, role)')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}
