import { NextRequest, NextResponse } from 'next/server';
import { listAllAgents } from '@/lib/anima';

export async function GET(req: NextRequest) {
  try {
    const agents = await listAllAgents();
    return NextResponse.json({ 
      success: true, 
      agents,
      total: agents.length
    });
  } catch (error: any) {
    console.error('[AGENTS LIST API ERROR]', error.message);
    return NextResponse.json({ 
      error: error.message,
      agents: [] // Fallback se fallisce il caricamento da disco
    }, { status: 500 });
  }
}
