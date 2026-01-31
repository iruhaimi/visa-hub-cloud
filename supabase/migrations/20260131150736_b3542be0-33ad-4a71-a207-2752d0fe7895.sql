-- Create function to notify agent on transfer request decision
CREATE OR REPLACE FUNCTION public.notify_agent_on_transfer_decision()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  app_country TEXT;
  to_agent_name TEXT;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Only proceed if status changed from pending to approved/rejected
  IF OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') THEN
    
    -- Get application country
    SELECT c.name INTO app_country
    FROM applications a
    JOIN visa_types vt ON a.visa_type_id = vt.id
    JOIN countries c ON vt.country_id = c.id
    WHERE a.id = NEW.application_id;

    -- Get target agent name
    SELECT p.full_name INTO to_agent_name
    FROM profiles p
    WHERE p.id = NEW.to_agent_id;

    IF NEW.status = 'approved' THEN
      notification_title := '✅ تمت الموافقة على طلب التحويل';
      notification_message := 'تم قبول طلب تحويل طلب ' || COALESCE(app_country, '') || ' إلى ' || COALESCE(to_agent_name, 'وكيل آخر');
    ELSE
      notification_title := '❌ تم رفض طلب التحويل';
      notification_message := 'تم رفض طلب تحويل طلب ' || COALESCE(app_country, '');
      IF NEW.admin_notes IS NOT NULL AND NEW.admin_notes != '' THEN
        notification_message := notification_message || '. السبب: ' || NEW.admin_notes;
      END IF;
    END IF;

    -- Notify the requesting agent (from_agent)
    INSERT INTO notifications (user_id, title, message, type, action_url)
    VALUES (
      NEW.from_agent_id,
      notification_title,
      notification_message,
      'transfer_decision',
      '/agent/applications/' || NEW.application_id::TEXT
    );

    -- If approved, also notify the receiving agent (to_agent)
    IF NEW.status = 'approved' THEN
      INSERT INTO notifications (user_id, title, message, type, action_url)
      VALUES (
        NEW.to_agent_id,
        '📋 طلب جديد تم تحويله إليك',
        'تم تحويل طلب تأشيرة ' || COALESCE(app_country, '') || ' إليك للمتابعة',
        'transfer_received',
        '/agent/applications/' || NEW.application_id::TEXT
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_transfer_request_decision ON agent_transfer_requests;
CREATE TRIGGER on_transfer_request_decision
  AFTER UPDATE ON agent_transfer_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_agent_on_transfer_decision();