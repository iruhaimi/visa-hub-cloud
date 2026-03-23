
-- Add dedicated column for wizard draft UI state
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS draft_data jsonb DEFAULT '{}'::jsonb;

-- Migrate existing draft JSON out of purpose_of_travel
UPDATE public.applications
SET
  draft_data = purpose_of_travel::jsonb,
  purpose_of_travel = NULL
WHERE status = 'draft'
  AND purpose_of_travel IS NOT NULL
  AND purpose_of_travel LIKE '{%';

-- Add partial index for draft lookups
CREATE INDEX IF NOT EXISTS idx_applications_draft_data
  ON public.applications USING gin(draft_data)
  WHERE status = 'draft';
