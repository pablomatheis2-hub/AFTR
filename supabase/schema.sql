-- AFTR Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  age integer check (age >= 18 and age <= 100),
  gender text check (gender in ('male', 'female', 'other')),
  instagram_handle text,
  latitude double precision,
  longitude double precision,
  radius_km integer default 25 check (radius_km >= 5 and radius_km <= 100),
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  onboarding_complete boolean default false not null,
  is_admin boolean default false not null,
  is_banned boolean default false not null
);

-- Events table (admin-created events)
create table public.events (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  venue text not null,
  description text,
  address text,
  image_url text,
  event_date timestamp with time zone not null,
  latitude double precision,
  longitude double precision,
  is_active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Parties table (user-created pre/after parties)
create table public.parties (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.events on delete cascade not null,
  host_id uuid references public.users on delete cascade not null,
  type text check (type in ('pre', 'after')) not null,
  title text not null,
  description text,
  latitude double precision,
  longitude double precision,
  address text,
  min_age integer default 18 check (min_age >= 18),
  max_age integer default 99 check (max_age <= 100),
  max_capacity integer check (max_capacity > 0),
  start_time timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Party attendees junction table
create table public.party_attendees (
  party_id uuid references public.parties on delete cascade not null,
  user_id uuid references public.users on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (party_id, user_id)
);

-- Reports table for reporting parties
create table public.reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references public.users on delete cascade not null,
  party_id uuid references public.parties on delete cascade not null,
  reason text check (reason in ('inappropriate', 'spam', 'fake', 'harassment', 'other')) not null,
  description text,
  status text check (status in ('pending', 'reviewed', 'dismissed')) default 'pending' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  reviewed_at timestamp with time zone
);

-- Indexes for performance
create index idx_parties_event_id on public.parties(event_id);
create index idx_parties_host_id on public.parties(host_id);
create index idx_parties_type on public.parties(type);
create index idx_party_attendees_party_id on public.party_attendees(party_id);
create index idx_party_attendees_user_id on public.party_attendees(user_id);
create index idx_events_event_date on public.events(event_date);
create index idx_events_is_active on public.events(is_active);
create index idx_reports_party_id on public.reports(party_id);
create index idx_reports_reporter_id on public.reports(reporter_id);
create index idx_reports_status on public.reports(status);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.events enable row level security;
alter table public.parties enable row level security;
alter table public.party_attendees enable row level security;
alter table public.reports enable row level security;

-- Users policies
create policy "Users can view all profiles"
  on public.users for select
  using (true);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

create policy "Admins can update any user"
  on public.users for update
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.is_admin = true
    )
  );

create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);

-- Events policies (public read, admin write)
create policy "Events are viewable by everyone"
  on public.events for select
  using (true);

create policy "Admins can create events"
  on public.events for insert
  with check (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.is_admin = true
    )
  );

create policy "Admins can update events"
  on public.events for update
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.is_admin = true
    )
  );

create policy "Admins can delete events"
  on public.events for delete
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.is_admin = true
    )
  );

-- Parties policies
create policy "Parties are viewable by everyone"
  on public.parties for select
  using (true);

create policy "Authenticated users can create parties"
  on public.parties for insert
  with check (auth.uid() = host_id);

create policy "Hosts can update their parties"
  on public.parties for update
  using (auth.uid() = host_id);

create policy "Hosts can delete their parties"
  on public.parties for delete
  using (auth.uid() = host_id);

-- Party attendees policies
create policy "Party attendees are viewable by everyone"
  on public.party_attendees for select
  using (true);

create policy "Users can join parties"
  on public.party_attendees for insert
  with check (auth.uid() = user_id);

create policy "Users can leave parties"
  on public.party_attendees for delete
  using (auth.uid() = user_id);

-- Reports policies
create policy "Users can create reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

create policy "Users can view their own reports"
  on public.reports for select
  using (
    auth.uid() = reporter_id
    or exists (
      select 1 from public.users
      where users.id = auth.uid() and users.is_admin = true
    )
  );

create policy "Admins can update reports"
  on public.reports for update
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.is_admin = true
    )
  );

-- Function to automatically create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Storage bucket for avatars (run this in the Supabase Dashboard SQL editor)
-- Note: Bucket creation is typically done via Supabase Dashboard, but here's the policy
-- First, create a bucket named 'avatars' in the Storage section of your Supabase Dashboard

-- Storage policies for avatars bucket
-- Allow authenticated users to upload their own avatar
create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow authenticated users to update their own avatar
create policy "Users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow public read access to avatars
create policy "Anyone can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Storage bucket for event images
-- First, create a bucket named 'events' in the Storage section of your Supabase Dashboard

-- Storage policies for events bucket
-- Allow admins to upload event images
create policy "Admins can upload event images"
  on storage.objects for insert
  with check (
    bucket_id = 'events' 
    and exists (
      select 1 from public.users
      where users.id = auth.uid() and users.is_admin = true
    )
  );

-- Allow admins to update event images
create policy "Admins can update event images"
  on storage.objects for update
  using (
    bucket_id = 'events' 
    and exists (
      select 1 from public.users
      where users.id = auth.uid() and users.is_admin = true
    )
  );

-- Allow admins to delete event images
create policy "Admins can delete event images"
  on storage.objects for delete
  using (
    bucket_id = 'events' 
    and exists (
      select 1 from public.users
      where users.id = auth.uid() and users.is_admin = true
    )
  );

-- Allow public read access to event images
create policy "Anyone can view event images"
  on storage.objects for select
  using (bucket_id = 'events');

-- Sample events data (for testing)
insert into public.events (title, venue, description, event_date, is_active) values
  ('Mambo Club Friday Night', 'Mambo Club', 'The hottest Friday night party in town. Electronic music all night long.', '2026-02-06 23:00:00+00', true),
  ('Neon Dreams', 'Sky Lounge', 'Rooftop party with the best DJs and city views.', '2026-02-07 22:00:00+00', true),
  ('Underground Sessions', 'The Basement', 'Deep house and techno underground experience.', '2026-02-13 23:30:00+00', true),
  ('Sunset Vibes', 'Beach Club Marina', 'Sunset party with tropical house music.', '2026-02-14 18:00:00+00', true),
  ('Retro Nights', 'Club 80s', '80s and 90s hits all night. Dress code: retro.', '2026-02-20 22:00:00+00', true);
