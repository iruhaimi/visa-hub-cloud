-- Create enum for message priority
CREATE TYPE public.message_priority AS ENUM ('normal', 'important', 'urgent');

-- Create application_messages table for secure agent-customer communication
CREATE TABLE public.application_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('agent', 'customer')),
  sender_name TEXT,
  content TEXT NOT NULL,
  priority message_priority NOT NULL DEFAULT 'normal',
  -- Attachment fields (optional)
  attachment_path TEXT,
  attachment_name TEXT,
  attachment_type TEXT CHECK (attachment_type IN ('image', 'pdf') OR attachment_type IS NULL),
  -- Read tracking
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  -- Timestamps (immutable - no updated_at needed)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_application_messages_application_id ON public.application_messages(application_id);
CREATE INDEX idx_application_messages_sender_id ON public.application_messages(sender_id);
CREATE INDEX idx_application_messages_created_at ON public.application_messages(created_at DESC);
CREATE INDEX idx_application_messages_is_read ON public.application_messages(is_read) WHERE is_read = false;

-- Enable RLS
ALTER TABLE public.application_messages ENABLE ROW LEVEL SECURITY;

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.application_messages;

-- RLS Policies

-- Customers can view messages for their own applications
CREATE POLICY "Customers can view own application messages"
ON public.application_messages
FOR SELECT
USING (is_application_owner(application_id, auth.uid()));

-- Customers can send messages to their own applications
CREATE POLICY "Customers can send messages to own applications"
ON public.application_messages
FOR INSERT
WITH CHECK (
  sender_type = 'customer' 
  AND sender_id = get_profile_id(auth.uid()) 
  AND is_application_owner(application_id, auth.uid())
);

-- Customers can mark messages as read
CREATE POLICY "Customers can mark messages as read"
ON public.application_messages
FOR UPDATE
USING (is_application_owner(application_id, auth.uid()))
WITH CHECK (is_application_owner(application_id, auth.uid()));

-- Agents can view messages for assigned applications
CREATE POLICY "Agents can view assigned application messages"
ON public.application_messages
FOR SELECT
USING (is_assigned_agent(application_id, auth.uid()));

-- Agents can send messages to assigned applications
CREATE POLICY "Agents can send messages to assigned applications"
ON public.application_messages
FOR INSERT
WITH CHECK (
  sender_type = 'agent'
  AND sender_id = get_profile_id(auth.uid())
  AND is_assigned_agent(application_id, auth.uid())
);

-- Agents can mark messages as read
CREATE POLICY "Agents can mark messages as read"
ON public.application_messages
FOR UPDATE
USING (is_assigned_agent(application_id, auth.uid()))
WITH CHECK (is_assigned_agent(application_id, auth.uid()));

-- Admins can view ALL messages (for supervision)
CREATE POLICY "Admins can view all messages"
ON public.application_messages
FOR SELECT
USING (is_admin(auth.uid()));

-- NO DELETE or UPDATE content policies - messages are immutable
-- Only read status can be updated

-- Create trigger to notify on new messages
CREATE OR REPLACE FUNCTION public.notify_on_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient_id UUID;
  app_country TEXT;
  priority_label TEXT;
  notification_title TEXT;
BEGIN
  -- Get application country for context
  SELECT c.name INTO app_country
  FROM applications a
  JOIN visa_types vt ON a.visa_type_id = vt.id
  JOIN countries c ON vt.country_id = c.id
  WHERE a.id = NEW.application_id;

  -- Set priority label
  CASE NEW.priority
    WHEN 'urgent' THEN priority_label := '🚨 عاجل: ';
    WHEN 'important' THEN priority_label := '⚠️ مهم: ';
    ELSE priority_label := '';
  END CASE;

  IF NEW.sender_type = 'agent' THEN
    -- Notify the customer (application owner)
    SELECT user_id INTO recipient_id
    FROM applications
    WHERE id = NEW.application_id;

    notification_title := priority_label || 'رسالة جديدة من الوكيل';
    
    INSERT INTO notifications (user_id, title, message, type, action_url)
    VALUES (
      recipient_id,
      notification_title,
      'لديك رسالة جديدة بخصوص طلب تأشيرة ' || COALESCE(app_country, ''),
      'message',
      '/track?id=' || NEW.application_id::TEXT
    );
  ELSE
    -- Notify the assigned agent
    SELECT assigned_agent_id INTO recipient_id
    FROM applications
    WHERE id = NEW.application_id;

    IF recipient_id IS NOT NULL THEN
      notification_title := priority_label || 'رسالة جديدة من العميل';
      
      INSERT INTO notifications (user_id, title, message, type, action_url)
      VALUES (
        recipient_id,
        notification_title,
        'لديك رسالة جديدة بخصوص طلب تأشيرة ' || COALESCE(app_country, ''),
        'message',
        '/agent/applications/' || NEW.application_id::TEXT
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_new_application_message
  AFTER INSERT ON public.application_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_new_message();