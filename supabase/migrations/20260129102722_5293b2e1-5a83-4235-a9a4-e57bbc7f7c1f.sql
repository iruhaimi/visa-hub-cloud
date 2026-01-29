-- Create table to track login attempts for staff portal
CREATE TABLE public.staff_login_attempts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL,
    ip_address text,
    user_agent text,
    success boolean NOT NULL DEFAULT false,
    failure_reason text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_staff_login_attempts_email ON public.staff_login_attempts(email);
CREATE INDEX idx_staff_login_attempts_created_at ON public.staff_login_attempts(created_at DESC);

-- Enable RLS
ALTER TABLE public.staff_login_attempts ENABLE ROW LEVEL SECURITY;

-- Only admins can view login attempts
CREATE POLICY "Admins can view all login attempts"
ON public.staff_login_attempts
FOR SELECT
USING (is_admin(auth.uid()));

-- System can insert login attempts (public insert for logging)
CREATE POLICY "Anyone can insert login attempts"
ON public.staff_login_attempts
FOR INSERT
WITH CHECK (true);

-- Create table for 2FA verification codes
CREATE TABLE public.staff_2fa_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL,
    code text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_staff_2fa_codes_user_id ON public.staff_2fa_codes(user_id);
CREATE INDEX idx_staff_2fa_codes_expires_at ON public.staff_2fa_codes(expires_at);

-- Enable RLS
ALTER TABLE public.staff_2fa_codes ENABLE ROW LEVEL SECURITY;

-- Users can view their own 2FA codes
CREATE POLICY "Users can view own 2FA codes"
ON public.staff_2fa_codes
FOR SELECT
USING (user_id = auth.uid());

-- System can insert 2FA codes
CREATE POLICY "System can insert 2FA codes"
ON public.staff_2fa_codes
FOR INSERT
WITH CHECK (true);

-- System can update 2FA codes (mark as used)
CREATE POLICY "System can update 2FA codes"
ON public.staff_2fa_codes
FOR UPDATE
USING (user_id = auth.uid());

-- Function to check if email is locked out
CREATE OR REPLACE FUNCTION public.is_email_locked_out(check_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    failed_attempts integer;
BEGIN
    -- Count failed attempts in the last 15 minutes
    SELECT COUNT(*)
    INTO failed_attempts
    FROM public.staff_login_attempts
    WHERE email = check_email
      AND success = false
      AND created_at > now() - interval '15 minutes';
    
    RETURN failed_attempts >= 5;
END;
$$;

-- Function to get failed attempt count
CREATE OR REPLACE FUNCTION public.get_failed_attempts_count(check_email text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    failed_attempts integer;
BEGIN
    SELECT COUNT(*)
    INTO failed_attempts
    FROM public.staff_login_attempts
    WHERE email = check_email
      AND success = false
      AND created_at > now() - interval '15 minutes';
    
    RETURN failed_attempts;
END;
$$;