-- Update role_activity_log to support more action types
ALTER TABLE public.role_activity_log 
ALTER COLUMN action TYPE text;

-- Add check constraint for valid actions
ALTER TABLE public.role_activity_log 
ADD CONSTRAINT valid_action_type 
CHECK (action IN ('add_role', 'remove_role', 'create_staff', 'delete_staff'));