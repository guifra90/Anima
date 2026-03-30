import { NextRequest, NextResponse } from 'next/server';
import { getMission } from '@/lib/anima';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let id = 'unknown';
  try {
    const resolvedParams = await params;
    id = resolvedParams.id;
    const mission = await getMission(id);
    
    if (!mission) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, mission });
  } catch (err: any) {
    console.error(`[MISSION GET API ERROR] ID: ${id}`, err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
