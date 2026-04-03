
ALTER TABLE public.countries ADD COLUMN expected_appointment_date text;
ALTER TABLE public.countries ADD COLUMN expected_appointment_note text;
ALTER TABLE public.countries ADD COLUMN expected_appointment_updated_at timestamp with time zone;
ALTER TABLE public.countries ADD COLUMN expected_appointment_updated_by uuid;
