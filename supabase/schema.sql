-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Drop existing tables to ensure a clean slate (Use with caution in production!)
drop table if exists chats cascade;
drop table if exists alerts cascade;
drop table if exists tasks cascade;
drop table if exists case_summaries cascade;
drop table if exists patients cascade;
drop table if exists caretakers cascade;
drop table if exists profiles cascade;
drop table if exists organizations cascade;

-- Organizations
create table organizations (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  owner_name text,
  license_number text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Profiles (User Roles)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  role text check (role in ('super_admin', 'org_admin', 'caretaker', 'patient', 'family')),
  organization_id uuid references organizations(id),
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Caretakers
create table caretakers (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id),
  organization_id uuid references organizations(id),
  name text not null,
  phone text,
  specialization text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Patients
create table patients (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id), -- Optional: if patient has login
  organization_id uuid references organizations(id),
  caretaker_id uuid references caretakers(id),
  name text not null,
  room_number text,
  condition text,
  age integer,
  gender text,
  admission_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Case Summaries (AI)
create table case_summaries (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references patients(id),
  summary text,
  raw_text text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tasks
create table tasks (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references patients(id),
  caretaker_id uuid references caretakers(id),
  title text not null,
  description text,
  due_date timestamp with time zone,
  status text check (status in ('pending', 'completed', 'missed')) default 'pending',
  proof_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Alerts
create table alerts (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references patients(id),
  organization_id uuid references organizations(id),
  type text check (type in ('EMERGENCY', 'ASSISTANCE', 'SYSTEM')),
  status text check (status in ('active', 'resolved', 'ignored')) default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Chats (Simple implementation)
create table chats (
  id uuid default uuid_generate_v4() primary key,
  initiator_id uuid references profiles(id),
  recipient_id uuid references profiles(id), -- Optional: if direct message
  message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies (Simplified for Hackathon)
-- Enable RLS on all tables
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table caretakers enable row level security;
alter table patients enable row level security;
alter table tasks enable row level security;
alter table alerts enable row level security;
alter table case_summaries enable row level security;

-- Policies (Open for Demo - NOT PRODUCTION SECURE)
create policy "Public Access" on organizations for all using (true) with check (true);
create policy "Public Access" on profiles for all using (true) with check (true);
create policy "Public Access" on caretakers for all using (true) with check (true);
create policy "Public Access" on patients for all using (true) with check (true);
create policy "Public Access" on tasks for all using (true) with check (true);
create policy "Public Access" on alerts for all using (true) with check (true);
create policy "Public Access" on case_summaries for all using (true) with check (true);

-- Storage Buckets
insert into storage.buckets (id, name, public) values ('task-proofs', 'task-proofs', true);
insert into storage.buckets (id, name, public) values ('case-sheets', 'case-sheets', true);

create policy "Public Access" on storage.objects for all using ( bucket_id in ('task-proofs', 'case-sheets') );
