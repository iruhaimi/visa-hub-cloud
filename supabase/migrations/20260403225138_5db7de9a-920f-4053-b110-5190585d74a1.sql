
-- Add display_number column
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS display_number text UNIQUE;

-- Create sequence
CREATE SEQUENCE IF NOT EXISTS public.application_number_seq;

-- Set sequence to current max
SELECT setval('public.application_number_seq', COALESCE((SELECT COUNT(*) FROM public.applications), 0) + 1, false);

-- Create trigger function
CREATE OR REPLACE FUNCTION public.generate_application_display_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.display_number IS NULL THEN
    NEW.display_number := 'VF-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.application_number_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS set_application_display_number ON public.applications;
CREATE TRIGGER set_application_display_number
BEFORE INSERT ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.generate_application_display_number();

-- Backfill existing applications
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn, created_at
  FROM public.applications
  WHERE display_number IS NULL
)
UPDATE public.applications a
SET display_number = 'VF-' || to_char(n.created_at, 'YYYY') || '-' || lpad(n.rn::text, 4, '0')
FROM numbered n
WHERE a.id = n.id;
