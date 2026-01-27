-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Agents can view assigned customer profiles" ON public.profiles;

-- Create a fixed policy using get_profile_id function to avoid recursion
CREATE POLICY "Agents can view assigned customer profiles" 
ON public.profiles 
FOR SELECT 
USING (
  is_agent(auth.uid()) AND EXISTS (
    SELECT 1 FROM applications a
    WHERE a.assigned_agent_id = get_profile_id(auth.uid())
    AND a.user_id = profiles.user_id
  )
);