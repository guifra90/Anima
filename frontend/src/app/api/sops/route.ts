import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getEmbedding } from '@/lib/embedding';

export async function GET(req: NextRequest) {
  try {
    const { data: sops, error } = await supabase
      .from('anima_sops')
      .select('*')
      .eq('status', 'active')
      .order('last_updated', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ sops });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { id, title, units, owner, content, access_level } = await req.json();
    
    // V4.0: Rigoroso supporto Units array
    const finalUnits = Array.isArray(units) ? units : ['GLOBAL'];

    if (!title || !units || !content || !owner) {
      return NextResponse.json({ error: "Missing required fields (title, units, content, owner)" }, { status: 400 });
    }

    let sopId = id;

    // Se esiste un ID, stiamo facendo un update (Versioning)
    if (sopId) {
      // 1. Archivia la versione precedente
      await supabase
        .from('anima_sops')
        .update({ status: 'archived' })
        .eq('id', sopId);
      
      // 2. Crea la nuova versione
      const { data: newSop, error: insertError } = await supabase
        .from('anima_sops')
        .insert([{
          title,
          units: finalUnits,
          owner,
          content,
          access_level,
          status: 'active',
          version: '1.2.0'
        }])
        .select()
        .single();
      
      if (insertError) throw insertError;
      sopId = newSop.id;
    } else {
      // Nuova SOP
      const { data: newSop, error: insertError } = await supabase
        .from('anima_sops')
        .insert([{
          title,
          units: finalUnits,
          owner,
          content,
          access_level,
          status: 'active'
        }])
        .select()
        .single();
      
      if (insertError) throw insertError;
      sopId = newSop.id;
    }

    // --- Ingestion Engine per RAG (Local) ---
    const words = content.split(/\s+/);
    const chunks = [];
    const maxTokens = 500;
    const overlap = 50;

    for (let i = 0; i < words.length; i += (maxTokens - overlap)) {
      const chunk = words.slice(i, i + maxTokens).join(' ');
      chunks.push(chunk);
      if (i + maxTokens >= words.length) break;
    }

    // Pulizia vecchi chunk
    await supabase.from('anima_knowledge').delete().eq('source_id', sopId);

    for (const [index, chunk] of chunks.entries()) {
      const embedding = await getEmbedding(chunk);

      await supabase.from('anima_knowledge').insert([{
        source_id: sopId,
        source_type: 'sop',
        content: chunk,
        embedding: embedding,
        metadata: { units: finalUnits, title, chunk_index: index }
      }]);
    }

    return NextResponse.json({ success: true, sopId });

  } catch (error: any) {
    console.error('[SOP API ERROR]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing SOP ID' }, { status: 400 });
    }

    // 1. Elimina i chunk associati nella knowledge base (RAG)
    await supabase.from('anima_knowledge').delete().eq('source_id', id);

    // 2. Elimina la SOP
    const { error } = await supabase
      .from('anima_sops')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[SOP DELETE ERROR]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
