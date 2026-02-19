-- Allow patients to view profiles of family members linked to them
create policy "Patients can view linked family profiles"
on profiles for select
to authenticated
using (
  linked_patient_id in (
    select id from patients where user_id = auth.uid()
  )
);

-- Allow caretakers to view profiles of family members linked to their patients
create policy "Caretakers can view patient family profiles"
on profiles for select
to authenticated
using (
  linked_patient_id in (
    select id from patients where caretaker_id in (
      select id from caretakers where user_id = auth.uid()
    )
  )
);

-- Ensure users can always see their own profile
create policy "Users can view own profile"
on profiles for select
to authenticated
using (
  id = auth.uid()
);
