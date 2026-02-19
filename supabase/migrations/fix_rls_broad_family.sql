-- Drop previous restrictive policies to avoid conflicts
drop policy if exists "Patients can view linked family profiles" on profiles;
drop policy if exists "Caretakers can view patient family profiles" on profiles;

-- Create a broader policy for Family Profiles
-- Allow any authenticated user to view profiles that have the role 'family'
-- The application logic will filter them by linked_patient_id
create policy "Authenticated users can view family profiles"
on profiles for select
to authenticated
using (
  role = 'family'
);

-- Ensure users can always see their own profile (keep this one)
drop policy if exists "Users can view own profile" on profiles;
create policy "Users can view own profile"
on profiles for select
to authenticated
using (
  id = auth.uid()
);
