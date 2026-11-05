-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Monitoring Permissions Table
create table if not exists monitoring_permissions (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references patients(id) on delete cascade,
  granted_to_user_id uuid references profiles(id) on delete cascade,
  can_view_camera boolean default true,
  can_view_timeline boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Monitoring Configuration Table
create table if not exists monitoring_config (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references patients(id) on delete cascade unique,
  is_active boolean default true,
  inference_fps integer default 8,
  fall_detection_enabled boolean default true,
  inactivity_threshold_mins integer default 60,
  confidence_threshold numeric default 0.70,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Monitoring Events Table
create table if not exists monitoring_events (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references patients(id) on delete cascade,
  activity_type text check (activity_type in (
    'MEDICATION_ACTIVITY',
    'WALKING',
    'SITTING',
    'STANDING',
    'LYING',
    'EATING',
    'DRINKING',
    'POSSIBLE_FALL',
    'INACTIVITY'
  )) not null,
  status text check (status in (
    'DETECTED',
    'LIKELY_TAKEN',
    'NOT_CONFIRMED',
    'POSSIBLE_FALL',
    'VERIFIED',
    'REJECTED'
  )) not null,
  confidence numeric default 0.0,
  detected_at timestamp with time zone default timezone('utc'::text, now()) not null,
  source text default 'AI',
  verification_status text check (verification_status in ('PENDING', 'VERIFIED', 'REJECTED')) default 'PENDING',
  verified_by uuid references profiles(id),
  verified_at timestamp with time zone,
  sync_status text default 'synced',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table monitoring_permissions enable row level security;
alter table monitoring_config enable row level security;
alter table monitoring_events enable row level security;

create policy "Public Access" on monitoring_permissions for all using (true) with check (true);
create policy "Public Access" on monitoring_config for all using (true) with check (true);
create policy "Public Access" on monitoring_events for all using (true) with check (true);
