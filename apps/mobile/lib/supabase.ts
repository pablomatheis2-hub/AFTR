import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { storage } from './storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if we're in a browser/client environment
const isClient = typeof window !== 'undefined';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storage,
    autoRefreshToken: isClient,
    persistSession: isClient,
    detectSessionInUrl: isClient,
    // Disable auto-initialization during SSR
    flowType: 'pkce',
  },
});
