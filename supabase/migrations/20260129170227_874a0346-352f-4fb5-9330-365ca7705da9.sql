-- Table for storing hashed recovery codes for staff
CREATE TABLE public.staff_recovery_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    code_hash TEXT NOT NULL,
    code_index INTEGER NOT NULL,
    used BOOLEAN DEFAULT false,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, code_index)
);

-- Table for account unlock requests requiring admin approval
CREATE TABLE public.account_unlock_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    email TEXT NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewer_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staff_recovery_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_unlock_requests ENABLE ROW LEVEL SECURITY;

-- RLS for staff_recovery_codes
CREATE POLICY "Users can view own recovery codes status"
ON public.staff_recovery_codes FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "System can insert recovery codes"
ON public.staff_recovery_codes FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can verify recovery codes"
ON public.staff_recovery_codes FOR UPDATE
USING (true);

-- RLS for account_unlock_requests
CREATE POLICY "Anyone can submit unlock requests"
ON public.account_unlock_requests FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view own unlock requests"
ON public.account_unlock_requests FOR SELECT
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid())::text OR is_admin(auth.uid()));

CREATE POLICY "Admins can update unlock requests"
ON public.account_unlock_requests FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete unlock requests"
ON public.account_unlock_requests FOR DELETE
USING (is_admin(auth.uid()));

-- Function to clear failed login attempts (for approved unlock)
CREATE OR REPLACE FUNCTION public.clear_failed_login_attempts(target_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.staff_login_attempts 
    WHERE email = target_email AND success = false;
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_account_unlock_requests_updated_at
BEFORE UPDATE ON public.account_unlock_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();