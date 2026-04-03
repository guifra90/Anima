import { NextRequest, NextResponse } from 'next/server';
import { listUnits, createUnit, deleteUnit, updateUnit } from '@/lib/anima';

export async function GET() {
  try {
    const units = await listUnits();
    return NextResponse.json({ success: true, units });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newUnit = await createUnit(body);
    return NextResponse.json({ success: true, unit: newUnit });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await deleteUnit(id);
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
    const updated = await updateUnit(id, data);
    return NextResponse.json({ success: true, unit: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
