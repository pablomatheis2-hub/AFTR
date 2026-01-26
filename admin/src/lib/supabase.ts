import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
// Use service role key for admin operations (bypasses RLS)
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export type User = {
  id: string;
  email: string;
  full_name: string | null;
  age: number | null;
  gender: 'male' | 'female' | 'other' | null;
  instagram_handle: string | null;
  latitude: number | null;
  longitude: number | null;
  radius_km: number;
  avatar_url: string | null;
  created_at: string;
  onboarding_complete: boolean;
};

export type Event = {
  id: string;
  title: string;
  venue: string;
  description: string | null;
  address: string | null;
  image_url: string | null;
  event_date: string;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  created_at: string;
};

export type Party = {
  id: string;
  event_id: string;
  host_id: string;
  type: 'pre' | 'after';
  title: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  min_age: number;
  max_age: number;
  max_capacity: number | null;
  start_time: string;
  created_at: string;
  host?: User;
  event?: Event;
  attendee_count?: number;
};
