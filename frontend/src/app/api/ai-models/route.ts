import { NextRequest, NextResponse } from 'next/server';
import { listAiModels, createAiModel, deleteAiModel, updateAiModel } from '@/lib/anima';

export async function GET() {
  try {
    const models = await listAiModels();
    return NextResponse.json({ success: true, models });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newModel = await createAiModel(body);
    return NextResponse.json({ success: true, model: newModel });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await deleteAiModel(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const updated = await updateAiModel(id, data);
    return NextResponse.json({ success: true, model: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

