import { NextRequest, NextResponse } from 'next/server';
import { listDepartments, createDepartment, deleteDepartment, updateDepartment } from '@/lib/anima';

export async function GET() {
  try {
    const departments = await listDepartments();
    return NextResponse.json({ success: true, departments });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newDept = await createDepartment(body);
    return NextResponse.json({ success: true, department: newDept });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await deleteDepartment(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name } = body;
    if (!id || !name) return NextResponse.json({ error: "Missing id or name" }, { status: 400 });
    const updated = await updateDepartment(id, name);
    return NextResponse.json({ success: true, department: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

