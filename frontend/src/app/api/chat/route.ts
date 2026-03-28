import { NextRequest, NextResponse } from 'next/server';
import { getAgentInfo, animaChat, listAllAgents } from '@/lib/anima';

export async function POST(req: NextRequest) {
  try {
    const { agentId, messages } = await req.json();

    if (!agentId || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Carica dinamicamente le informazioni e il system prompt dell'agente
    const agentInfo = await getAgentInfo(agentId);
    if (!agentInfo) {
      return NextResponse.json({ error: `Agent ${agentId} not found` }, { status: 404 });
    }

    console.log(`[API] Chatting with agent: ${agentId}`);

    // Esegue la chiamata all'AI con il context dell'agente
    const response = await animaChat({
      agentId,
      messages,
      system: agentInfo.systemPrompt
    });

    return NextResponse.json({ response });

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
