import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const health: any = {
    timestamp: new Date().toISOString(),
    services: {
      supabase: { status: 'unknown' },
      ollama: { status: 'unknown' },
      ai_providers: {
        gemini: { status: 'missing' },
        openrouter: { status: 'missing' },
        anthropic: { status: 'missing' },
        openai: { status: 'missing' },
      }
    }
  };

  // 1. Check AI Provider Keys (Presence only)
  if (process.env.GEMINI_API_KEY) health.services.ai_providers.gemini.status = 'configured';
  if (process.env.OPENROUTER_API_KEY) health.services.ai_providers.openrouter.status = 'configured';
  if (process.env.ANTHROPIC_API_KEY) health.services.ai_providers.anthropic.status = 'configured';
  if (process.env.OPENAI_API_KEY) health.services.ai_providers.openai.status = 'configured';

  // 2. Check Supabase
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
    const { data, error } = await supabase.from('anima_ai_models').select('id').limit(1);
    if (error) throw error;
    health.services.supabase.status = 'connected';
  } catch (err) {
    health.services.supabase.status = 'error';
    health.services.supabase.message = err instanceof Error ? err.message : 'Unknown error';
  }

  // 3. Check Ollama
  const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 2000); // 2s timeout
    const res = await fetch(`${ollamaHost}/api/tags`, { signal: controller.signal });
    clearTimeout(id);
    if (res.ok) {
      health.services.ollama.status = 'connected';
    } else {
      health.services.ollama.status = 'offline';
    }
  } catch (err) {
    health.services.ollama.status = 'offline';
  }

  return NextResponse.json(health);
}
