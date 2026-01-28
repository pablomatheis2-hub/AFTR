import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@aftr/shared/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

// Default export for convenience
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
