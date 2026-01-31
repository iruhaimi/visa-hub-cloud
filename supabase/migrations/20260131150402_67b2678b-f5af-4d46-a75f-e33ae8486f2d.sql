-- Create a function to get all agents for transfer requests
-- This bypasses RLS to allow agents to see other agents' basic info
CREATE OR REPLACE FUNCTION public.get_agents_for_transfer(exclude_profile_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  full_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.full_name
  FROM profiles p
  INNER JOIN user_roles ur ON p.user_id = ur.user_id
  WHERE ur.role = 'agent'
    AND (exclude_profile_id IS NULL OR p.id != exclude_profile_id);
END;
$$;