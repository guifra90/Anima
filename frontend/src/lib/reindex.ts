
import { getEmbedding } from './embedding';
import { supabase } from './supabase';

async function reindex(missionId: string) {
  console.log("Re-indexing mission:", missionId);
  
  const { data: mission } = await supabase.from('anima_missions').select('*').eq('id', missionId).single();
  const { data: tasks } = await supabase.from('anima_tasks').select('*').eq('mission_id', missionId).eq('status', 'completed').order('order_index');

  if (!mission || !tasks) return;

  const summary = `MISSIONE: ${mission.title}\nOBIETTIVO: ${mission.objective}\nRISULTATI ANALITICI:\n` + 
    tasks.map(t => `## TASK: ${t.title}\n${t.result}`).join("\n\n---\n\n");

  const embedding = await getEmbedding(summary);

  const { error } = await supabase.from('anima_knowledge').upsert({
    source_type: 'mission_memory',
    source_id: missionId,
    content: summary,
    embedding: embedding,
    metadata: { 
      mission_id: missionId, 
      title: mission.title,
      completed_at: new Date().toISOString()
    }
  }, { onConflict: 'source_id' });

  if (error) console.error("Error re-indexing:", error.message);
  else console.log("Success!");
}

reindex('70474d86-2e40-4995-b2ba-f2f6466d6729');
// No need for mission 2 as it's the latest
