import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { supabaseAdmin } from '@/lib/supabase-server';
import { encrypt } from '@/execution/utils/encryption';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const stateRaw = searchParams.get('state');
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  let userId: string | null = null;
  if (stateRaw) {
    try {
      const state = JSON.parse(Buffer.from(stateRaw, 'base64').toString());
      userId = state.userId;
    } catch (e) {}
  }

  if (error) {
    return NextResponse.redirect(new URL(`/connections?error=${error}`, req.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/connections?error=no_code', req.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URL || 'http://localhost:3000/api/auth/google/callback';

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  try {
    // 1. Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // 2. Get user info for a friendly name
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();
    
    if (!userInfo.email) throw new Error("No email found in user info");

    // 3. Encrypt internal tokens for security
    const encryptedText = encrypt(JSON.stringify(tokens));

    // IMPORTANT: The 'credentials' column in anima_connections is likely JSONB.
    // We must pass a JSON object, not a raw string.
    const credentialsJson = {
      encrypted: encryptedText,
      version: '1.0',
      provider: 'google'
    };

    // 4. Save to anima_connections (Admin client to bypass RLS)
    const { data: existing } = await supabaseAdmin
      .from('anima_connections')
      .select('id')
      .eq('name', userInfo.email)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin
        .from('anima_connections')
        .update({
          credentials: credentialsJson,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      await supabaseAdmin
        .from('anima_connections')
        .insert([{
          type: 'gmail', 
          name: userInfo.email,
          credentials: credentialsJson,
          user_id: userId
        }]);
    }

    // Redirect successfully
    return NextResponse.redirect(new URL('/connections?success=google_linked', req.url));

  } catch (err: any) {
    console.error("[OAUTH_CALLBACK] Google Error:", err.message);
    return NextResponse.redirect(new URL(`/connections?error=oauth_failed&msg=${encodeURIComponent(err.message)}`, req.url));
  }
}
