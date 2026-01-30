-- Add display_order column to countries table for custom ordering
ALTER TABLE public.countries 
ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- Update existing countries with sequential order based on name
WITH ordered_countries AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name) as new_order
  FROM public.countries
)
UPDATE public.countries c
SET display_order = oc.new_order
FROM ordered_countries oc
WHERE c.id = oc.id;

-- Add display_order column to visa_types table for ordering within each country
ALTER TABLE public.visa_types 
ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- Update existing visa types with sequential order within each country
WITH ordered_visas AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY country_id ORDER BY name) as new_order
  FROM public.visa_types
)
UPDATE public.visa_types v
SET display_order = ov.new_order
FROM ordered_visas ov
WHERE v.id = ov.id;