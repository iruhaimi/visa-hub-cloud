-- Create function to notify admins when agent adds a note
CREATE OR REPLACE FUNCTION public.notify_admin_on_agent_note()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  admin_record RECORD;
  app_country TEXT;
  applicant_name TEXT;
BEGIN
  -- Only proceed if note is from an agent
  IF NEW.note_type = 'agent' THEN
    -- Get application details
    SELECT c.name, p.full_name INTO app_country, applicant_name
    FROM applications a
    JOIN visa_types vt ON a.visa_type_id = vt.id
    JOIN countries c ON vt.country_id = c.id
    JOIN profiles p ON a.user_id = p.id
    WHERE a.id = NEW.application_id;

    -- Notify all admins
    FOR admin_record IN 
      SELECT p.id as profile_id
      FROM user_roles ur
      JOIN profiles p ON ur.user_id = p.user_id
      WHERE ur.role = 'admin'
    LOOP
      INSERT INTO notifications (user_id, title, message, type, action_url)
      VALUES (
        admin_record.profile_id,
        '💬 ملاحظة جديدة من وكيل',
        'أضاف ' || COALESCE(NEW.author_name, 'وكيل') || ' ملاحظة على طلب ' || COALESCE(applicant_name, 'عميل') || ' - ' || COALESCE(app_country, ''),
        'agent_note',
        '/admin/applications/' || NEW.application_id::TEXT
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for agent notes
DROP TRIGGER IF EXISTS trigger_notify_admin_on_agent_note ON public.application_notes;
CREATE TRIGGER trigger_notify_admin_on_agent_note
  AFTER INSERT ON public.application_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_agent_note();