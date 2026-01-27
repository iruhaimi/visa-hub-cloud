-- Add child and infant price columns to visa_types table
ALTER TABLE public.visa_types
ADD COLUMN child_price numeric DEFAULT NULL,
ADD COLUMN infant_price numeric DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.visa_types.child_price IS 'Custom price for children (6-12 years). If NULL, uses 75% of adult price.';
COMMENT ON COLUMN public.visa_types.infant_price IS 'Custom price for infants (<6 years). If NULL, uses 50% of adult price.';