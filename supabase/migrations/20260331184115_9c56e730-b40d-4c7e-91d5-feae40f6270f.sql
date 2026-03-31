
-- Fix existing inconsistency: fee_type='separate' but price_notes says 'شامل'
UPDATE visa_types 
SET price_notes = 'غير شامل رسوم التأشيرة الحكومية',
    price_notes_en = 'Government visa fees not included'
WHERE fee_type = 'separate' 
  AND (price_notes = 'شامل رسوم التأشيرة' OR price_notes IS NULL);

-- Create trigger to auto-sync price_notes when fee_type changes
CREATE OR REPLACE FUNCTION public.sync_price_notes_on_fee_type_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Only sync if fee_type changed AND price_notes was NOT manually set in the same update
  IF OLD.fee_type IS DISTINCT FROM NEW.fee_type THEN
    -- If price_notes wasn't changed in this update, auto-set it
    IF OLD.price_notes IS NOT DISTINCT FROM NEW.price_notes THEN
      IF NEW.fee_type = 'included' THEN
        NEW.price_notes := 'شامل رسوم التأشيرة';
        NEW.price_notes_en := 'Visa fees included';
      ELSIF NEW.fee_type = 'separate' THEN
        NEW.price_notes := 'غير شامل رسوم التأشيرة الحكومية';
        NEW.price_notes_en := 'Government visa fees not included';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_price_notes
  BEFORE UPDATE ON visa_types
  FOR EACH ROW
  EXECUTE FUNCTION sync_price_notes_on_fee_type_change();
