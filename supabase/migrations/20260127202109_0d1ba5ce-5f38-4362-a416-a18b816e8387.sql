-- Add government_fees column to visa_types table
ALTER TABLE public.visa_types
ADD COLUMN government_fees numeric DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.visa_types.government_fees IS 'Government visa fees in SAR';