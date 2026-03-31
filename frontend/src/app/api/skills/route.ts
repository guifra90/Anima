import { NextResponse } from 'next/server';
import path from 'path';
// @ts-ignore
import SkillRegistry from '@/execution/services/skill-registry';

export async function GET() {
  try {
    const registry = new (SkillRegistry as any)(path.resolve(process.cwd(), '../skills'));
    await registry.scan();
    const skills = registry.getAllSkills();
    
    return NextResponse.json({ 
      success: true, 
      skills 
    });
  } catch (error: any) {
    console.error('[SKILLS API ERROR]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
