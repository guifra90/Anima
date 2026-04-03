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
    let { unit_id, plannerAgentId, priority = 1, ...missionData } = body;

    // Se viene fornito un unit_id, sovrascriviamo il plannerAgentId con il Lead della Unit
    if (unit_id) {
      console.log(`[API MISSIONS] Unit selected: ${unit_id}. Resolving Lead...`);
      const { supabase } = await import('@/lib/supabase');
      const { data: unit } = await supabase
        .from('anima_units')
        .select('lead_id')
        .eq('id', unit_id)
        .single();
      
      if (unit?.lead_id) {
        console.log(`[API MISSIONS] Routing to Unit Lead: ${unit.lead_id}`);
        plannerAgentId = unit.lead_id;
      }
    }

    const mission = await createMission({ ...missionData, unit_id, plannerAgentId, priority });
    
    // Trigger AI Planner parameters updated: priority and the resolved plannerAgentId
    const tasks = await planMissionAndCreateTasks(mission.id, mission.objective, plannerAgentId, priority);
    
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
