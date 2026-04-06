import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
// @ts-ignore
import { encrypt, decrypt } from '@/execution/utils/encryption';

export async function GET(req: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    let query = supabase.from('anima_connections').select('*');
    
    if (user) {
      query = query.or(`user_id.eq.${user.id},user_id.is.null`);
    } else {
      console.warn("[CONNECTIONS] Unauthenticated access, showing all connections (Dev Mode)");
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Return redacted credentials but include everything in metadata
    const connections = data.map(conn => ({
      ...conn,
      credentials: '***ENCRYPTED***'
    }));

    return NextResponse.json({ success: true, connections });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const { type, name, credentials, is_primary } = await req.json();
    
    let dbCredentials = {};
    let metadata = {};

    if (type === 'scoro') {
      // Split sensitive/non-sensitive for Scoro
      const { apiKey, ...otherCreds } = credentials;
      dbCredentials = { apiKey };
      metadata = otherCreds;
    } else {
      dbCredentials = credentials;
    }

    // Encrypt sensitive part
    const encryptedText = encrypt(dbCredentials);
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
        metadata: metadata,
        is_primary: is_primary || false,
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

export async function PATCH(req: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const { id, name, credentials, is_primary } = await req.json();

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    // Fetch existing data for partial update
    const { data: existing, error: fetchError } = await supabase
      .from('anima_connections')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) throw new Error('Connection not found');

    const updateData: any = {};
    if (name) updateData.name = name;
    if (typeof is_primary === 'boolean') updateData.is_primary = is_primary;
    
    if (credentials) {
      // Decrypt existing to merge if necessary (Wait, Paperclip suggests replacing the secret version)
      // But for ease of use, we'll merge the "non-secret" parts from metadata or provided credentials
      
      let mergedCreds: any = {};
      let updatedMetadata = { ...existing.metadata };

      if (existing.type === 'scoro') {
        const currentCreds = decrypt(existing.credentials.encrypted);
        const { apiKey, ...otherCreds } = credentials;
        
        // Only update apiKey if provided and not just dots/empty
        mergedCreds.apiKey = (apiKey && apiKey.trim() !== '') ? apiKey : currentCreds.apiKey;
        
        // Update metadata with other fields
        Object.keys(otherCreds).forEach(key => {
          if (otherCreds[key] && otherCreds[key].trim() !== '') {
            updatedMetadata[key] = otherCreds[key];
          }
        });
      } else {
        // Generic merge for other types
        const currentCreds = decrypt(existing.credentials.encrypted);
        mergedCreds = { ...currentCreds, ...credentials };
      }

      const encryptedText = encrypt(mergedCreds);
      updateData.credentials = {
        encrypted: encryptedText,
        version: '1.0'
      };
      updateData.metadata = updatedMetadata;
    }

    const { data, error } = await supabase
      .from('anima_connections')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, connection: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
