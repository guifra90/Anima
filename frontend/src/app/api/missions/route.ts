import { NextRequest, NextResponse } from 'next/server';
import { listMissions, createMission } from '@/lib/anima';
import { planMissionAndCreateTasks } from '@/lib/planner';

export async function GET() {
  try {
    const missions = await listMissions();
    return NextResponse.json({ success: true, missions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const mission = await createMission(body);
    
    // Trigger AI Planner to generate tasks
    const tasks = await planMissionAndCreateTasks(mission.id, mission.objective, body.plannerAgentId);
    
    return NextResponse.json({ success: true, mission, tasks });
  } catch (err: any) {
    console.error("[MISSIONS POST API ERROR]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
       return NextResponse.json({ error: "Missing Mission ID" }, { status: 400 });
    }

    const { deleteMission } = await import('@/lib/anima');
    await deleteMission(id);

    return NextResponse.json({ success: true, message: `Mission ${id} deleted successfully` });
  } catch (err: any) {
    console.error("[MISSIONS DELETE API ERROR]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
