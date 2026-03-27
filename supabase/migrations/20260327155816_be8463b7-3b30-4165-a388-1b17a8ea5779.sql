CREATE OR REPLACE FUNCTION public.create_application_draft(
  p_visa_type_id uuid,
  p_travel_date date DEFAULT NULL,
  p_draft_data jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id uuid;
  v_application_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT id INTO v_profile_id
  FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_profile_id IS NULL THEN
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (
      auth.uid(),
      COALESCE(auth.jwt() -> 'user_metadata' ->> 'full_name', auth.jwt() -> 'user_metadata' ->> 'name', '')
    )
    ON CONFLICT (user_id) DO NOTHING;

    SELECT id INTO v_profile_id
    FROM public.profiles
    WHERE user_id = auth.uid()
    LIMIT 1;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'customer')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.applications (user_id, visa_type_id, travel_date, status, draft_data)
  VALUES (
    v_profile_id,
    p_visa_type_id,
    p_travel_date,
    'draft',
    COALESCE(p_draft_data, '{}'::jsonb)
  )
  RETURNING id INTO v_application_id;

  RETURN v_application_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_application_draft(uuid, date, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_application_draft(uuid, date, jsonb) TO authenticated;