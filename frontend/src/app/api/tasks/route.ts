import { NextRequest, NextResponse } from 'next/server';
import { listTasksByMission, createTask, updateTask, deleteTask } from '@/lib/anima';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const missionId = searchParams.get('mission_id');
    if (!missionId) return NextResponse.json({ error: "Missing missionId" }, { status: 400 });
    
    const tasks = await listTasksByMission(missionId);
    return NextResponse.json({ success: true, tasks });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const task = await createTask(body);
    return NextResponse.json({ success: true, task });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const updated = await updateTask(id, data);
    return NextResponse.json({ success: true, task: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await deleteTask(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
