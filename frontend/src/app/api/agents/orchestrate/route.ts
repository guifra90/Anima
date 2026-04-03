import { NextRequest, NextResponse } from 'next/server';
import { executeAiChat, executeOrchestration } from '@/lib/ai-bridge-server';
import { createMessage } from '@/lib/anima-persistence';
import { supabaseAdmin as supabase } from '@/lib/supabase-server';

/**
 * API Route: /api/agents/orchestrate
 * Neural Hub Single Entry Point
 */
export async function POST(req: NextRequest) {
  try {
    const { messages, missionId, options } = await req.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "Messages array is required." }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1].content;

    // 1. NEURAL ROUTING: Chiediamo ad ANIMA chi deve rispondere
    const orchestration = await executeOrchestration(lastMessage);
    const targetAgentId = orchestration.targetAgentId;
    
    // 2. LOG DI SISTEMA: Salviamo la decisione del router nello stream (feedback visivo)
    await createMessage({
      mission_id: missionId || null,
      agent_id: 'system', // L'azione è dell'orchestratore
      role: 'system',
      content: orchestration.systemLog,
      metadata: { 
        type: 'routing_decision', 
        targetAgentId, 
        reasoning: orchestration.reasoning 
      }
    });

    // 3. ESECUZIONE TARGET: Chiamiamo l'agente delegato
    const aiResponse = await executeAiChat({
      agentId: targetAgentId,
      messages: messages,
      missionId: missionId,
      options: options
    });

    if (!aiResponse) {
      throw new Error("L'agente delegato non ha prodotto una risposta valida.");
    }

    // 4. PERSISTENZA RISPOSTA: Salviamo la risposta dell'agente delegato
    const savedMessage = await createMessage({
      mission_id: missionId || null,
      agent_id: targetAgentId,
      role: 'assistant',
      content: aiResponse.content,
      metadata: { 
        model: aiResponse.model, 
        delegated_by: 'anima_orchestrator',
        routing_reason: orchestration.reasoning
      }
    });

    return NextResponse.json({
      message: savedMessage,
      routing: orchestration
    });

  } catch (error: any) {
    console.error("[API-ORCHESTRATE-ERROR]", error.message);
    return NextResponse.json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
