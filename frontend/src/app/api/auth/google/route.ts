import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not configured in .env" }, { status: 500 });
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  // Scopes for Gmail (Modify for Read/Write) and Calendar (Events for Read/Write)
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/calendar.events'
  ];
  
  // Get current session to pass user_id through state
  // This is a simple dev way, real auth uses cookies or server components helper
  const { data: { user } } = await supabase.auth.getUser();
  const stateData = user ? { userId: user.id } : {};
  const state = Buffer.from(JSON.stringify(stateData)).toString('base64');

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Critical for refresh_token
    scope: scopes,
    state: state,
    prompt: 'consent' // Force consent to ensure we always get a refresh_token
  });

  return NextResponse.redirect(url);
}
