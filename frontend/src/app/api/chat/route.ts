import { NextRequest, NextResponse } from 'next/server';
import { animaChat, getAgentInfo } from '@/lib/anima';

export async function POST(req: NextRequest) {
  try {
    const { agentId, messages } = await req.json();

    if (!agentId || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Recupera le informazioni dell'agente (direttive e system prompt)
    const agentInfo = await getAgentInfo(agentId);
    if (!agentInfo) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // 2. Esegue la chat con RAG integrato (gestito internamente da animaChat)
    const response = await animaChat({
      agentId,
      messages,
      system: agentInfo.systemPrompt
    });

    return NextResponse.json({ 
      success: true, 
      response,
      agentName: agentInfo.name
    });

  } catch (error: any) {
    console.error('[AGENT CHAT API ERROR]', error.message);
    return NextResponse.json({ 
      error: error.message,
      details: "Assicurati che GEMINI_API_KEY sia configurata nella root del progetto."
    }, { status: 500 });
  }
}
