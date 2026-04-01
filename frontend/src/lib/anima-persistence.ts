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
  agent_id: string;
  role: 'user' | 'assistant' | 'system';
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
