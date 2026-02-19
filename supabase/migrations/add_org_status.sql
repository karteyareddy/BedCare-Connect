-- Add status column to organizations
ALTER TABLE organizations ADD COLUMN status text DEFAULT 'active' CHECK (status IN ('active', 'paused'));

-- Create function to handle organization deletion (cascade manually if needed or just use code)
-- For now we just add the column.
