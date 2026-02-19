create table if not exists case_summaries (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references patients(id) on delete cascade not null,
  summary text,
  file_url text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table case_summaries enable row level security;

-- Create policy for now (allow all for authenticated users or public for hackathon speed?)
-- Let's mirror patients access? Usually public read/write for now to be safe and fast.
-- But better to be slightly secure.
create policy "Allow all access to authenticated users"
on case_summaries for all
to authenticated
using (true)
with check (true);
