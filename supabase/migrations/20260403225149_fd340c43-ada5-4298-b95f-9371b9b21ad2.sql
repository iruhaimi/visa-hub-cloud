
CREATE OR REPLACE FUNCTION public.generate_application_display_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.display_number IS NULL THEN
    NEW.display_number := 'VF-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.application_number_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;
