-- Create special_offers table
CREATE TABLE public.special_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  discount_percentage INTEGER NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  original_price NUMERIC NOT NULL CHECK (original_price > 0),
  sale_price NUMERIC NOT NULL CHECK (sale_price > 0),
  country_name TEXT NOT NULL,
  flag_emoji TEXT DEFAULT '🌍',
  badge TEXT DEFAULT 'عرض خاص',
  is_hot BOOLEAN DEFAULT false,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  visa_type_id UUID REFERENCES public.visa_types(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email_subscribers table
CREATE TABLE public.email_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.special_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_subscribers ENABLE ROW LEVEL SECURITY;

-- Policies for special_offers (public read, admin write)
CREATE POLICY "Anyone can view active offers"
  ON public.special_offers FOR SELECT
  USING (is_active = true AND end_date > now());

CREATE POLICY "Admins can view all offers"
  ON public.special_offers FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert offers"
  ON public.special_offers FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update offers"
  ON public.special_offers FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete offers"
  ON public.special_offers FOR DELETE
  USING (is_admin(auth.uid()));

-- Policies for email_subscribers (public insert for subscription, admin full access)
CREATE POLICY "Anyone can subscribe"
  ON public.email_subscribers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view subscribers"
  ON public.email_subscribers FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update subscribers"
  ON public.email_subscribers FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete subscribers"
  ON public.email_subscribers FOR DELETE
  USING (is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_special_offers_updated_at
  BEFORE UPDATE ON public.special_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_subscribers_updated_at
  BEFORE UPDATE ON public.email_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample offers
INSERT INTO public.special_offers (title, description, discount_percentage, original_price, sale_price, country_name, flag_emoji, badge, is_hot, end_date) VALUES
('تأشيرة دبي السياحية', 'عرض خاص لموسم الصيف - تأشيرة سياحية لمدة 30 يوم', 25, 400, 300, 'الإمارات', '🇦🇪', 'الأكثر طلباً', true, now() + interval '7 days'),
('تأشيرة تركيا السياحية', 'خصم حصري على التأشيرة الإلكترونية - صلاحية 90 يوم', 30, 350, 245, 'تركيا', '🇹🇷', 'عرض محدود', true, now() + interval '10 days'),
('تأشيرة مصر السياحية', 'تأشيرة دخول متعددة - صلاحية 6 أشهر', 20, 250, 200, 'مصر', '🇪🇬', 'جديد', false, now() + interval '14 days'),
('تأشيرة أذربيجان', 'عرض خاص للعائلات - تأشيرة سياحية 30 يوم', 35, 300, 195, 'أذربيجان', '🇦🇿', 'ينتهي قريباً', true, now() + interval '3 days'),
('تأشيرة جورجيا', 'خصم الموسم - تأشيرة إلكترونية سريعة', 15, 200, 170, 'جورجيا', '🇬🇪', 'موصى به', false, now() + interval '21 days'),
('باقة شهر العسل - ماليزيا', 'تأشيرة لشخصين + خدمة VIP', 40, 600, 360, 'ماليزيا', '🇲🇾', 'عرض خاص', true, now() + interval '5 days');