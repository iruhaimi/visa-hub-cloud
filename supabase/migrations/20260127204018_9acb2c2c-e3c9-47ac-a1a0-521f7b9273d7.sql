
-- Create function to send notification on application status change
CREATE OR REPLACE FUNCTION public.notify_application_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  status_title_ar TEXT;
  status_message_ar TEXT;
  visa_name TEXT;
  country_name TEXT;
BEGIN
  -- Only proceed if status actually changed
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get visa and country names for the notification
  SELECT vt.name, c.name INTO visa_name, country_name
  FROM visa_types vt
  JOIN countries c ON vt.country_id = c.id
  WHERE vt.id = NEW.visa_type_id;

  -- Set Arabic titles and messages based on new status
  CASE NEW.status
    WHEN 'submitted' THEN
      status_title_ar := 'تم استلام طلبك';
      status_message_ar := 'تم استلام طلب تأشيرة ' || COALESCE(country_name, '') || ' بنجاح وسيتم مراجعته قريباً';
    WHEN 'under_review' THEN
      status_title_ar := 'طلبك قيد المراجعة';
      status_message_ar := 'يتم الآن مراجعة طلب تأشيرة ' || COALESCE(country_name, '') || ' من قبل فريقنا';
    WHEN 'documents_required' THEN
      status_title_ar := 'مستندات مطلوبة';
      status_message_ar := 'يرجى رفع المستندات المطلوبة لإكمال طلب تأشيرة ' || COALESCE(country_name, '');
    WHEN 'processing' THEN
      status_title_ar := 'جاري معالجة طلبك';
      status_message_ar := 'طلب تأشيرة ' || COALESCE(country_name, '') || ' في مرحلة المعالجة النهائية';
    WHEN 'approved' THEN
      status_title_ar := '🎉 تمت الموافقة على طلبك';
      status_message_ar := 'تهانينا! تمت الموافقة على تأشيرة ' || COALESCE(country_name, '') || ' بنجاح';
    WHEN 'rejected' THEN
      status_title_ar := 'تم رفض الطلب';
      status_message_ar := 'نأسف، تم رفض طلب تأشيرة ' || COALESCE(country_name, '') || '. يرجى التواصل معنا للمزيد من التفاصيل';
    WHEN 'cancelled' THEN
      status_title_ar := 'تم إلغاء الطلب';
      status_message_ar := 'تم إلغاء طلب تأشيرة ' || COALESCE(country_name, '');
    ELSE
      status_title_ar := 'تحديث حالة الطلب';
      status_message_ar := 'تم تحديث حالة طلب تأشيرة ' || COALESCE(country_name, '');
  END CASE;

  -- Insert notification for the application owner
  INSERT INTO notifications (user_id, title, message, type, action_url)
  VALUES (
    NEW.user_id,
    status_title_ar,
    status_message_ar,
    'status_update',
    '/track?id=' || NEW.id::TEXT
  );

  RETURN NEW;
END;
$$;

-- Create trigger for status change notifications
DROP TRIGGER IF EXISTS trigger_notify_status_change ON applications;
CREATE TRIGGER trigger_notify_status_change
  AFTER UPDATE OF status ON applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_application_status_change();
