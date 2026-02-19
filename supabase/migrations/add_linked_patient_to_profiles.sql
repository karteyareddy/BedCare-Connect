-- Add linked_patient_id to profiles table
alter table profiles 
add column if not exists linked_patient_id uuid references patients(id) on delete set null;

-- Add index for performance
create index if not exists idx_profiles_linked_patient_id on profiles(linked_patient_id);
