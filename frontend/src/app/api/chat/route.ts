import { NextRequest, NextResponse } from 'next/server';
import { getAgentInfo, animaChat, listAllAgents } from '@/lib/anima';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { agentId, messages, sessionId: clientSessionId } = await req.json();

    if (!agentId || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // --- Database Audit Log & Persistence ---
    let sessionId = clientSessionId;
    
    // Se non abbiamo una sessione, ne creiamo una nuova per questo agente
    if (!sessionId) {
      const { data: sessionData, error: sessionError } = await supabase
        .from('anima_sessions')
        .insert([{ agent_id: agentId }])
        .select()
        .single();
      
      if (!sessionError && sessionData) {
        sessionId = sessionData.id;
      }
    }

    // Salvataggio dell'ultimo messaggio utente
    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage && lastUserMessage.role === 'user' && sessionId) {
      await supabase.from('anima_messages').insert([{
        session_id: sessionId,
        role: 'user',
        content: lastUserMessage.content,
        agent_id: agentId
      }]);
    }
    // ----------------------------------------

    // Carica dinamicamente le informazioni e il system prompt dell'agente
    const agentInfo = await getAgentInfo(agentId);
    if (!agentInfo) {
      return NextResponse.json({ error: `Agent ${agentId} not found` }, { status: 404 });
    }

    console.log(`[API] Chatting with agent: ${agentId} (Session: ${sessionId})`);

    // Esegue la chiamata all'AI con il context dell'agente
    const response = await animaChat({
      agentId,
      messages,
      system: agentInfo.systemPrompt
    });

    // --- Database Log Assistant Response ---
    if (sessionId) {
      await supabase.from('anima_messages').insert([{
        session_id: sessionId,
        role: 'assistant',
        content: response,
        agent_id: agentId
      }]);
    }
    // ----------------------------------------

    return NextResponse.json({ response, sessionId });

  } catch (error: any) {
    console.error('[API ERROR]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Endpoint per listare gli agenti disponibili
 */
export async function GET() {
  try {
    const agents = await listAllAgents();
    return NextResponse.json({ agents });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
