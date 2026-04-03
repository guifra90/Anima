import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId');
    const sessionId = searchParams.get('sessionId');

    // Costruiamo la query base
    let query = supabase
      .from('anima_messages')
      .select('*')
      .order('created_at', { ascending: true });

    if (sessionId) {
      // Se abbiamo una sessione, filtriamo per quella
      query = query.eq('session_id', sessionId);
    } else if (agentId) {
      // Fallback legacy: per agente senza missione (chat libera vecchia)
      query = query.eq('agent_id', agentId).is('mission_id', null).is('session_id', null);
    } else {
      return NextResponse.json({ error: 'Missing agentId or sessionId' }, { status: 400 });
    }

    const { data, error } = await query.limit(100);

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      messages: data.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: new Date(m.created_at).toLocaleTimeString(),
        metadata: m.metadata
      }))
    });

  } catch (error: any) {
    console.error('[CHAT HISTORY API ERROR]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
