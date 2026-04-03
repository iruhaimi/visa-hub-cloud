ALTER TABLE public.visa_types ADD COLUMN gov_fee_adult numeric DEFAULT 0;
ALTER TABLE public.visa_types ADD COLUMN gov_fee_child numeric DEFAULT 0;
ALTER TABLE public.visa_types ADD COLUMN gov_fee_infant numeric DEFAULT 0;

-- Migrate existing data: copy government_fees to gov_fee_adult
UPDATE public.visa_types SET gov_fee_adult = COALESCE(government_fees, 0), gov_fee_child = COALESCE(government_fees, 0), gov_fee_infant = COALESCE(government_fees, 0);