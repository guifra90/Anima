import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GoogleGenerativeAI } from "@google/generativelanguage";

// Nota: Re-implementiamo la logica di embedding in modo ESM per Next.js
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

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
    const { id, title, department, owner, content, access_level } = await req.json();

    if (!title || !department || !content || !owner) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let sopId = id;

    // Se esiste un ID, stiamo facendo un update (Versioning)
    if (sopId) {
      // 1. Archivia la versione precedente
      await supabase
        .from('anima_sops')
        .update({ status: 'archived' })
        .eq('id', sopId);
      
      // 2. Crea la nuova versione (nuovo ID per semplicità di history)
      const { data: newSop, error: insertError } = await supabase
        .from('anima_sops')
        .insert([{
          title,
          department,
          owner,
          content,
          access_level,
          status: 'active',
          version: '1.1.0' // TODO: Increment logic
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
          department,
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

    // --- Ingestion Engine per RAG ---
    // Chunking e Embedding (Eseguito in sync per ora, in futuro background worker)
    const chunks = content.split(/\s+/).reduce((resultArray: string[][], item: string, index: number) => { 
      const chunkIndex = Math.floor(index / 500);
      if(!resultArray[chunkIndex]) resultArray[chunkIndex] = [];
      resultArray[chunkIndex].push(item);
      return resultArray;
    }, []).map((chunk: string[]) => chunk.join(' '));

    // Pulizia vecchi chunk
    await supabase.from('anima_knowledge').delete().eq('source_id', sopId);

    for (const [index, chunk] of chunks.entries()) {
      const result = await embeddingModel.embedContent(chunk);
      const embedding = result.embedding.values;

      await supabase.from('anima_knowledge').insert([{
        source_id: sopId,
        source_type: 'sop',
        content: chunk,
        embedding: embedding,
        metadata: { department, title, chunk_index: index }
      }]);
    }

    return NextResponse.json({ success: true, sopId });

  } catch (error: any) {
    console.error('[SOP API ERROR]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
