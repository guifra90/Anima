import { NextRequest, NextResponse } from 'next/server';
import { getAgentInfo, createMessage, searchKnowledge } from '@/lib/anima';
import { executeAiChat } from '@/lib/ai-bridge-server';

export const dynamic = 'force-dynamic';

/**
 * ANIMA Unified Chat API - v4.1 STREMAING
 */

export async function POST(req: NextRequest) {
  try {
    const { agentId, messages, sessionId, modelId } = await req.json();

    if (!agentId || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const agentInfo = await getAgentInfo(agentId);
    if (!agentInfo) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // 1. RAG (Server Side)
    const lastUserMsgText = messages[messages.length - 1]?.content || "";
    const rugContext = await searchKnowledge(lastUserMsgText);

    // 2. Prepariamo lo Stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const sendChunk = (data: any) => {
            controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
          };

          // Eseguiamo la chat in modalità streaming
          const finalResponse = await executeAiChat({
            agentId,
            messages,
            systemPrompt: agentInfo.system_prompt,
            missionId: undefined, // Per ora chat libera
            options: { sessionId, model: modelId },
            onChunk: (chunk) => {
              // Inviamo il chunk (testo o stato tool) direttamente al client
              sendChunk({ success: true, chunk });
            }
          });

          // 3. PERSISTENZA: Una volta finito lo stream, salviamo nel DB
          try {
            const lastUserMsg = messages[messages.length - 1];
            if (lastUserMsg) {
              await createMessage({
                agent_id: agentId,
                session_id: sessionId,
                role: 'user',
                content: lastUserMsg.content,
                metadata: { context: 'direct_chat', session_id: sessionId }
              });
            }

            if (finalResponse) {
              await createMessage({
                agent_id: agentId,
                session_id: sessionId,
                role: 'assistant',
                content: finalResponse.content,
                metadata: { 
                  context: 'direct_chat', 
                  model: agentInfo.model_id, 
                  session_id: sessionId,
                  toolCalls: finalResponse.toolExecutions 
                }
              });
            }

            if (sessionId) {
              const { supabase } = await import('@/lib/supabase');
              await supabase
                .from('anima_sessions')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', sessionId);
            }
          } catch (persistErr) {
            console.error("[STREAMING-API] Persistence error:", persistErr);
          }

          // Invia il payload finale per chiudere il cerchio (opzionale)
          sendChunk({ success: true, response: finalResponse, done: true });
          controller.close();
        } catch (err: any) {
          controller.error(err);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('[AGENT CHAT API ERROR]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
