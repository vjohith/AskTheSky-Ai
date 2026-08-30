-- ==================================================================================
-- ASKTHESKY AI - PRODUCTION SUPABASE DATABASE SCHEMA & RLS SECURITY POLICIES
-- ==================================================================================
-- This SQL script sets up all tables, foreign keys, timestamps, and Row Level Security (RLS)
-- policies for the AskTheSky AI Disaster Management & Early Warning Application.
--
-- Instructions:
-- 1. Open your Supabase Project Dashboard (https://supabase.com/dashboard)
-- 2. Go to the "SQL Editor" tab on the left sidebar.
-- 3. Paste the entirety of this script and click "Run".
-- ==================================================================================

-- 1. PROFILES TABLE (Linked with Supabase Auth users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text not null default 'Citizen',
  role text not null default 'general',
  language text not null default 'en',
  phone text default '',
  alert_preferences jsonb default '{"smsAlerts": true, "emailAlerts": true, "highRiskOnly": false, "voiceAnnouncements": true}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

-- Policies for profiles
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Automatically create a profile when a new user signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role, language)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'general'),
    coalesce(new.raw_user_meta_data->>'language', 'en')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if already exists then recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. SAVED LOCATIONS (Monitored Coastal & Agricultural Locations)
create table if not exists public.saved_locations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  custom_name text,
  lat double precision not null,
  lon double precision not null,
  alert_threshold text default 'moderate' not null,
  created_at timestamptz default now() not null
);

-- Enable RLS for saved_locations
alter table public.saved_locations enable row level security;

create policy "Users can view their own saved locations"
  on public.saved_locations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own saved locations"
  on public.saved_locations for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own saved locations"
  on public.saved_locations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own saved locations"
  on public.saved_locations for delete
  using (auth.uid() = user_id);

create index if index_saved_locations_user on public.saved_locations (user_id);


-- 3. USER FILES / DISASTER VAULT (Emergency Plans, Insurance, Medical & Crop Records)
create table if not exists public.vault_files (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  original_name text not null,
  file_name text not null,
  mime_type text not null,
  size bigint not null,
  category text default 'disaster_plan' not null,
  file_url text,
  created_at timestamptz default now() not null
);

-- Enable RLS for vault_files
alter table public.vault_files enable row level security;

create policy "Users can view their own vault files"
  on public.vault_files for select
  using (auth.uid() = user_id);

create policy "Users can insert their own vault files"
  on public.vault_files for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own vault files"
  on public.vault_files for delete
  using (auth.uid() = user_id);

create index if index_vault_files_user on public.vault_files (user_id);


-- 4. COMMUNITY REPORTS (LetThemKnow - Crowdsourced Hazard Advisories & Citizen Watch)
create table if not exists public.community_reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  user_name text not null default 'Citizen Contributor',
  user_role text default 'general' not null,
  location text not null,
  lat double precision,
  lon double precision,
  hazard_type text not null default 'heavy_rain',
  severity text not null default 'caution',
  title text not null,
  suggestion text not null,
  safety_advice text default 'Please exercise extreme caution and share this warning with nearby residents.',
  upvotes integer default 0 not null,
  downvotes integer default 0 not null,
  verified boolean default true not null,
  created_at timestamptz default now() not null
);

-- Enable RLS for community_reports
alter table public.community_reports enable row level security;

-- Everyone (public & authenticated) can read community disaster alerts
create policy "Anyone can view community disaster reports"
  on public.community_reports for select
  using (true);

-- Authenticated users can insert community reports
create policy "Authenticated users can create community reports"
  on public.community_reports for insert
  with check (auth.uid() = user_id or auth.uid() is not null);

-- Authors can update or delete their own reports
create policy "Users can update their own community reports"
  on public.community_reports for update
  using (auth.uid() = user_id);

create policy "Users can delete their own community reports"
  on public.community_reports for delete
  using (auth.uid() = user_id);

create index if index_community_reports_created on public.community_reports (created_at desc);
create index if index_community_reports_hazard on public.community_reports (hazard_type);


-- 5. COMMUNITY REPORT VOTES (Prevent double-voting & track user upvotes/downvotes)
create table if not exists public.community_report_votes (
  id uuid default gen_random_uuid() primary key,
  report_id uuid references public.community_reports(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  vote_type text not null check (vote_type in ('up', 'down')),
  created_at timestamptz default now() not null,
  unique (report_id, user_id)
);

alter table public.community_report_votes enable row level security;

create policy "Anyone can view vote counts"
  on public.community_report_votes for select
  using (true);

create policy "Authenticated users can cast votes"
  on public.community_report_votes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their votes"
  on public.community_report_votes for update
  using (auth.uid() = user_id);

create policy "Users can delete their votes"
  on public.community_report_votes for delete
  using (auth.uid() = user_id);


-- 6. CHAT MESSAGES (AI Meteorological Q&A & Voice Advisory History)
create table if not exists public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  sender text not null check (sender in ('user', 'ai')),
  text text not null,
  speech_text text,
  language text default 'en' not null,
  detected_location text,
  weather_snippet jsonb,
  risk_assessment jsonb,
  rag_citations jsonb,
  created_at timestamptz default now() not null
);

alter table public.chat_messages enable row level security;

create policy "Users can view their own chat messages"
  on public.chat_messages for select
  using (auth.uid() = user_id);

create policy "Users can insert their own chat messages"
  on public.chat_messages for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own chat messages"
  on public.chat_messages for delete
  using (auth.uid() = user_id);

create index if index_chat_messages_user on public.chat_messages (user_id, created_at asc);


-- 7. SOS ALERTS (Emergency Rescue & Distress Signals)
create table if not exists public.sos_alerts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  user_name text not null,
  location text not null,
  lat double precision,
  lon double precision,
  hazard_type text not null,
  message text not null,
  status text default 'PENDING' not null,
  created_at timestamptz default now() not null
);

alter table public.sos_alerts enable row level security;

create policy "Users can view their own SOS alerts"
  on public.sos_alerts for select
  using (auth.uid() = user_id);

create policy "Users can create SOS alerts"
  on public.sos_alerts for insert
  with check (auth.uid() = user_id);

-- Optional: Initial Seed Data for Community Reports so new users see lively content immediately!
insert into public.community_reports (id, user_name, user_role, location, lat, lon, hazard_type, severity, title, suggestion, safetyAdvice, upvotes, downvotes, verified, created_at)
values
  ('a0000001-0000-0000-0000-000000000001', 'Ramesh Naidu', 'farmer', 'Anakapalle Rural, Visakhapatnam', 17.691, 83.003, 'heavy_rain', 'caution', 'Paddy Fields Waterlogged; Drainage Culvert Silted', 'Dig temporary runoff trenches immediately before tonight thunderstorm to prevent crop root rot.', 'Farmers in low-lying sectors should disconnect electric pump sets and monitor water gates.', 14, 0, true, now() - interval '25 minutes'),
  ('a0000002-0000-0000-0000-000000000002', 'Capt. K. Satyanarayana', 'fisherman', 'Bheemunipatnam (Bheemili) Coast', 17.891, 83.454, 'high_waves', 'danger', 'High Swell Surges (3.8m) Near Beach Road', 'Do NOT venture into the sea for next 24 hours. Country boats have been moved 50m inland beyond high tide line.', 'High spring tide forecast between 4 PM and 8 PM. Avoid evening coastal walks.', 28, 1, true, now() - interval '1 hour'),
  ('a0000003-0000-0000-0000-000000000003', 'Dr. Priya V.', 'general', 'Siripuram Junction Underpass, Vizag', 17.721, 83.315, 'road_blocked', 'emergency', 'Water Level 3.5 Feet Underpass Completely Flooded', 'Take the VIP Road or Waltair Main Road flyover. 3 two-wheelers got stranded and rescued.', 'Do not attempt to drive through submerged underpasses; water depth is deceptive.', 45, 0, true, now() - interval '4 hours')
on conflict (id) do nothing;
