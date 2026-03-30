import { NextRequest, NextResponse } from 'next/server';
import { listConfig, updateConfig } from '@/lib/anima';

export async function GET() {
  try {
    const config = await listConfig();
    return NextResponse.json({ success: true, config });
  } catch (error: any) {
    console.error('[CONFIG GET API ERROR]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { key, value } = await req.json();
    if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });
    
    const updated = await updateConfig(key, value);
    return NextResponse.json({ success: true, config: updated });
  } catch (error: any) {
    console.error('[CONFIG POST API ERROR]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
