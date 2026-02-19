-- Fix RLS Policies to allow INSERT/UPDATE
-- Run this in Supabase SQL Editor

drop policy if exists "Public Access" on organizations;
create policy "Public Access" on organizations for all using (true) with check (true);

drop policy if exists "Public Access" on profiles;
create policy "Public Access" on profiles for all using (true) with check (true);

drop policy if exists "Public Access" on caretakers;
create policy "Public Access" on caretakers for all using (true) with check (true);

drop policy if exists "Public Access" on patients;
create policy "Public Access" on patients for all using (true) with check (true);

drop policy if exists "Public Access" on tasks;
create policy "Public Access" on tasks for all using (true) with check (true);

drop policy if exists "Public Access" on alerts;
create policy "Public Access" on alerts for all using (true) with check (true);

drop policy if exists "Public Access" on case_summaries;
create policy "Public Access" on case_summaries for all using (true) with check (true);
