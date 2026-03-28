import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase configuration missing in frontend. Check your .env variables.");
}

/**
 * Public Supabase Client — Per operazioni dal frontend Next.js.
 * Utilizza la Anon Key (RLS attiva).
 */
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);
