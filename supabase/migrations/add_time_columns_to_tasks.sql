-- Add start_time and end_time to tasks table
ALTER TABLE tasks 
ADD COLUMN start_time TIME,
ADD COLUMN end_time TIME;
