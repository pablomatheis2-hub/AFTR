import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, User, Event, Party, PartyWithDetails, EventWithPartyCount } from '@aftr/shared/types';

type TypedSupabaseClient = SupabaseClient<Database>;

// User queries
export async function getUserById(supabase: TypedSupabaseClient, userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user:', error.message);
    return null;
  }
  return data;
}

// Event queries
export async function getEvents(supabase: TypedSupabaseClient): Promise<EventWithPartyCount[]> {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      parties!parties_event_id_fkey(type)
    `)
    .eq('is_active', true)
    .order('event_date', { ascending: true });

  if (error) {
    console.error('Error fetching events:', error.message);
    return [];
  }

  return (data || []).map((event) => {
    const parties = (event.parties || []) as { type: 'pre' | 'after' }[];
    return {
      ...event,
      parties: undefined,
      pre_party_count: parties.filter((p) => p.type === 'pre').length,
      after_party_count: parties.filter((p) => p.type === 'after').length,
    } as EventWithPartyCount;
  });
}

export async function getEventById(supabase: TypedSupabaseClient, eventId: string): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (error) {
    console.error('Error fetching event:', error.message);
    return null;
  }
  return data;
}

// Party queries
export async function getPartyById(supabase: TypedSupabaseClient, partyId: string): Promise<PartyWithDetails | null> {
  const { data, error } = await supabase
    .from('parties')
    .select(`
      *,
      host:users!parties_host_id_fkey(*),
      attendees:party_attendees(
        *,
        user:users(*)
      )
    `)
    .eq('id', partyId)
    .single();

  if (error) {
    console.error('Error fetching party:', error.message);
    return null;
  }

  if (!data) return null;

  const attendees = (data.attendees || []) as Array<{ user: User | null }>;
  let maleCount = 0;
  let femaleCount = 0;

  attendees.forEach((a) => {
    if (a.user?.gender === 'male') maleCount++;
    else if (a.user?.gender === 'female') femaleCount++;
  });

  return {
    ...data,
    host: data.host as User,
    attendees: data.attendees as (Database['public']['Tables']['party_attendees']['Row'] & { user: User })[],
    attendee_count: attendees.length,
    male_count: maleCount,
    female_count: femaleCount,
  };
}

export async function getPartiesForEvent(supabase: TypedSupabaseClient, eventId: string): Promise<PartyWithDetails[]> {
  const { data, error } = await supabase
    .from('parties')
    .select(`
      *,
      host:users!parties_host_id_fkey(*),
      attendees:party_attendees(
        *,
        user:users(*)
      )
    `)
    .eq('event_id', eventId)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching parties:', error.message);
    return [];
  }

  return (data || []).map((party) => {
    const attendees = (party.attendees || []) as Array<{ user: User | null }>;
    let maleCount = 0;
    let femaleCount = 0;

    attendees.forEach((a) => {
      if (a.user?.gender === 'male') maleCount++;
      else if (a.user?.gender === 'female') femaleCount++;
    });

    return {
      ...party,
      host: party.host as User,
      attendees: party.attendees as (Database['public']['Tables']['party_attendees']['Row'] & { user: User })[],
      attendee_count: attendees.length,
      male_count: maleCount,
      female_count: femaleCount,
    };
  });
}

// Party actions
export async function joinParty(supabase: TypedSupabaseClient, partyId: string, userId: string) {
  const { error } = await supabase
    .from('party_attendees')
    .insert({ party_id: partyId, user_id: userId });

  return { error };
}

export async function leaveParty(supabase: TypedSupabaseClient, partyId: string, userId: string) {
  const { error } = await supabase
    .from('party_attendees')
    .delete()
    .eq('party_id', partyId)
    .eq('user_id', userId);

  return { error };
}

export async function deleteParty(supabase: TypedSupabaseClient, partyId: string) {
  const { error } = await supabase
    .from('parties')
    .delete()
    .eq('id', partyId);

  return { error };
}
