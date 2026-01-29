-- Create a function to notify agent when application is assigned to them
CREATE OR REPLACE FUNCTION public.notify_agent_on_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  visa_name TEXT;
  country_name TEXT;
  applicant_name TEXT;
BEGIN
  -- Only proceed if assigned_agent_id changed and is not null
  IF (OLD.assigned_agent_id IS DISTINCT FROM NEW.assigned_agent_id) AND NEW.assigned_agent_id IS NOT NULL THEN
    
    -- Get visa and country names
    SELECT vt.name, c.name INTO visa_name, country_name
    FROM visa_types vt
    JOIN countries c ON vt.country_id = c.id
    WHERE vt.id = NEW.visa_type_id;

    -- Get applicant name
    SELECT p.full_name INTO applicant_name
    FROM profiles p
    WHERE p.id = NEW.user_id;

    -- Insert notification for the newly assigned agent
    INSERT INTO notifications (user_id, title, message, type, action_url)
    VALUES (
      NEW.assigned_agent_id,
      '📋 طلب جديد تم تعيينه لك',
      'تم تعيين طلب تأشيرة ' || COALESCE(country_name, '') || ' - ' || COALESCE(visa_name, '') || ' من ' || COALESCE(applicant_name, 'عميل') || ' لك للمتابعة.',
      'assignment',
      '/agent/applications/' || NEW.id::TEXT
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Create trigger to automatically notify agent on assignment
DROP TRIGGER IF EXISTS trigger_notify_agent_on_assignment ON applications;

CREATE TRIGGER trigger_notify_agent_on_assignment
  AFTER UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_agent_on_assignment();