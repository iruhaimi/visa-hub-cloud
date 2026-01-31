-- Create trigger function for notifying agents on work submission decisions
CREATE OR REPLACE FUNCTION public.notify_agent_on_work_decision()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  app_country TEXT;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Only proceed if status changed from pending to approved/returned/rejected
  IF OLD.status = 'pending' AND NEW.status IN ('approved', 'returned', 'rejected') THEN
    
    -- Get application country
    SELECT c.name INTO app_country
    FROM applications a
    JOIN visa_types vt ON a.visa_type_id = vt.id
    JOIN countries c ON vt.country_id = c.id
    WHERE a.id = NEW.application_id;

    IF NEW.status = 'approved' THEN
      notification_title := '✅ تم اعتماد ملف الإتمام';
      notification_message := 'تم قبول ملف إتمام العمل لطلب ' || COALESCE(app_country, '') || ' بنجاح';
    ELSIF NEW.status = 'returned' THEN
      notification_title := '🔄 ملف الإتمام يحتاج تعديل';
      notification_message := 'أعاد المشرف ملف إتمام طلب ' || COALESCE(app_country, '') || ' للتعديل';
      IF NEW.admin_notes IS NOT NULL AND NEW.admin_notes != '' THEN
        notification_message := notification_message || ': ' || NEW.admin_notes;
      END IF;
    ELSE
      notification_title := '❌ تم رفض ملف الإتمام';
      notification_message := 'تم رفض ملف إتمام العمل لطلب ' || COALESCE(app_country, '');
      IF NEW.admin_notes IS NOT NULL AND NEW.admin_notes != '' THEN
        notification_message := notification_message || '. السبب: ' || NEW.admin_notes;
      END IF;
    END IF;

    -- Notify the agent
    INSERT INTO notifications (user_id, title, message, type, action_url)
    VALUES (
      NEW.agent_id,
      notification_title,
      notification_message,
      'work_decision',
      '/agent/applications/' || NEW.application_id::TEXT
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for work submission decisions
DROP TRIGGER IF EXISTS on_work_submission_decision ON agent_work_submissions;
CREATE TRIGGER on_work_submission_decision
  AFTER UPDATE ON agent_work_submissions
  FOR EACH ROW
  EXECUTE FUNCTION notify_agent_on_work_decision();