import { NextRequest, NextResponse } from 'next/server';
import { listAllAgents, createAgent, updateAgent, isSlugUnique } from '@/lib/anima';

/**
 * API /api/agents
 * GET: Lista tutti gli agenti dal DB o verifica slug
 * POST: Crea un nuovo agente nel DB (Hiring)
 */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const checkSlug = searchParams.get('check_slug');

    if (checkSlug) {
      const isUnique = await isSlugUnique(checkSlug);
      return NextResponse.json({ success: true, unique: isUnique });
    }

    const agents = await listAllAgents();
    return NextResponse.json({ 
      success: true, 
      agents,
      total: agents.length
    });
  } catch (error: any) {
    console.error('[AGENTS GET API ERROR]', error.message);
    return NextResponse.json({ 
      error: error.message,
      agents: []
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newAgent = await createAgent(body);
    return NextResponse.json({ success: true, agent: newAgent });
  } catch (error: any) {
    console.error('[AGENTS POST API ERROR]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const updatedAgent = await updateAgent(id, data);
    return NextResponse.json({ success: true, agent: updatedAgent });
  } catch (error: any) {
    console.error('[AGENTS PATCH API ERROR]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
