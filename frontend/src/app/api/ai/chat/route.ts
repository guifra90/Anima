import { NextResponse } from 'next/server';
import { executeAiChat } from '@/lib/ai-bridge-server';

/**
 * API Route: /api/ai/chat
 * Bridge unificato e agnostico per la chat degli agenti.
 */
export async function POST(req: Request) {
  try {
    const { agentId, messages, systemPrompt, missionId, options = {} } = await req.json();

    if (!agentId) {
      return NextResponse.json({ error: "agentId missing" }, { status: 400 });
    }

    const result = await executeAiChat({
      agentId,
      messages,
      systemPrompt,
      missionId,
      options
    });

    return NextResponse.json({ 
      success: true, 
      ...result
    });

  } catch (err: any) {
    console.error("[AI-API-ROUTE-ERROR]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
