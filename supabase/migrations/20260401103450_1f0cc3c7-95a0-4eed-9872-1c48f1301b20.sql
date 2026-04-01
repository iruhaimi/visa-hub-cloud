
CREATE OR REPLACE FUNCTION public.notify_admin_on_whatsapp_order()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  admin_record RECORD;
  app_country TEXT;
  applicant_name TEXT;
  visa_name TEXT;
BEGIN
  -- Only proceed if status changed to whatsapp_pending
  IF NEW.status = 'whatsapp_pending' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    
    -- Get visa, country and applicant details
    SELECT vt.name, c.name INTO visa_name, app_country
    FROM visa_types vt
    JOIN countries c ON vt.country_id = c.id
    WHERE vt.id = NEW.visa_type_id;

    SELECT p.full_name INTO applicant_name
    FROM profiles p
    WHERE p.id = NEW.user_id;

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
        '📱 طلب جديد عبر الواتساب',
        'طلب ' || COALESCE(applicant_name, 'عميل') || ' تأشيرة ' || COALESCE(app_country, '') || ' - ' || COALESCE(visa_name, '') || ' بانتظار التواصل عبر الواتساب',
        'whatsapp_order',
        '/admin/applications'
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_whatsapp_order
  AFTER UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_whatsapp_order();
