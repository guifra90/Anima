import { NextRequest, NextResponse } from 'next/server';
import { runTaskExecution } from '@/lib/executor';

export async function POST(req: NextRequest) {
  try {
    const { taskId } = await req.json();
    if (!taskId) return NextResponse.json({ error: "Missing taskId" }, { status: 400 });

    console.log(`[API] Triggering Execution for Task: ${taskId}`);
    
    // Eseguiamo in modo asincrono se vogliamo (ma per ora aspettiamo per feedback UI)
    // Se la chat è lunga, Next.js potrebbe andare in timeout (10s su Vercel gratis, 30s locale).
    // Per ora aspettiamo il risultato.
    const result = await runTaskExecution(taskId);

    return NextResponse.json({ success: true, task: result });
  } catch (err: any) {
    console.error("[API TASK RUN ERROR]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
