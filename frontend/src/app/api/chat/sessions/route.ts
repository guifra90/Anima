import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createSession, getSessions } from '@/lib/anima-persistence';

/**
 * Gestione Sessioni di Chat Unificata
 */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'user-default';

    const sessions = await getSessions(userId);

    return NextResponse.json({ 
      success: true, 
      sessions 
    });

  } catch (error: any) {
    console.error('[CHAT SESSIONS GET ERROR]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { agentId, userId } = await req.json();

    const session = await createSession(agentId || 'system', userId || 'user-default');

    return NextResponse.json({ 
      success: true, 
      session 
    });

  } catch (error: any) {
    console.error('[CHAT SESSIONS POST ERROR]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
