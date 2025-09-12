
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types.ts';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// This client is configured for the browser and can be used in Client Components
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);