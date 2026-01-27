-- Add price_notes field to visa_types for customizable pricing notes
ALTER TABLE public.visa_types
ADD COLUMN price_notes text DEFAULT 'شامل رسوم التأشيرة';

-- Add English translation support
ALTER TABLE public.visa_types
ADD COLUMN price_notes_en text DEFAULT 'Visa fees included';

-- Add fee_type to indicate if government fees are included or separate
ALTER TABLE public.visa_types
ADD COLUMN fee_type text DEFAULT 'included' CHECK (fee_type IN ('included', 'separate'));

COMMENT ON COLUMN public.visa_types.price_notes IS 'Arabic notes about pricing (e.g., شامل رسوم التأشيرة)';
COMMENT ON COLUMN public.visa_types.price_notes_en IS 'English notes about pricing';
COMMENT ON COLUMN public.visa_types.fee_type IS 'Whether government fees are included or paid separately';