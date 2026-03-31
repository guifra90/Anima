import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
// @ts-ignore
import { encrypt, decrypt } from '@/execution/utils/encryption';

export async function GET(req: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    let query = supabase.from('anima_connections').select('*');
    
    // In local development or if user is not found, we show all (fallback)
    // In production this would be strict
    if (user) {
      // Show user's connections OR those without an owner (to avoid lost connections in dev)
      query = query.or(`user_id.eq.${user.id},user_id.is.null`);
    } else {
      console.warn("[CONNECTIONS] Unauthenticated access, showing all connections (Dev Mode)");
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Decrypt credentials for the frontend if needed (or keep them redacted)
    const connections = data.map(conn => ({
      ...conn,
      credentials: '***ENCRYPTED***' // Never send raw credentials to the client
    }));

    return NextResponse.json({ success: true, connections });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const { type, name, credentials } = await req.json();
    
    // Encrypt credentials before saving
    const encryptedText = encrypt(credentials);
    const credentialsJson = {
      encrypted: encryptedText,
      version: '1.0'
    };

    const { data, error } = await supabase
      .from('anima_connections')
      .insert([{
        type,
        name,
        credentials: credentialsJson,
        user_id: user ? user.id : null
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, connection: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const { error } = await supabase
      .from('anima_connections')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
