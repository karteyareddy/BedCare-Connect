-- Ensure authenticated users can view caretakers and patients
-- Drop existing policies if they conflict or are too restrictive?
-- No, RLS policies differ by name. We can add another one.

create policy "Enable select for authenticated users"
on caretakers for select
to authenticated
using (true);

create policy "Enable select for authenticated users"
on patients for select
to authenticated
using (true);
