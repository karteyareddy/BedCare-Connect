create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references organizations(id) on delete cascade not null,
  title text not null,
  description text,
  caretaker_id uuid references caretakers(id) on delete set null,
  patient_id uuid references patients(id) on delete set null,
  status text default 'pending', -- pending, in_progress, completed
  due_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table tasks enable row level security;

-- Policies
create policy "Enable all access for authenticated users"
on tasks for all
to authenticated
using (true)
with check (true);
