-- Create hero_settings table for managing hero section content
CREATE TABLE public.hero_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  value_en TEXT,
  type TEXT NOT NULL DEFAULT 'text', -- 'text', 'number', 'html'
  category TEXT NOT NULL DEFAULT 'general', -- 'general', 'stats', 'badge'
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.hero_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active hero settings"
ON public.hero_settings
FOR SELECT
USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "Admins can insert hero settings"
ON public.hero_settings
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update hero settings"
ON public.hero_settings
FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete hero settings"
ON public.hero_settings
FOR DELETE
USING (is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_hero_settings_updated_at
BEFORE UPDATE ON public.hero_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.hero_settings (key, value, value_en, type, category, display_order) VALUES
-- General texts
('badge_text', 'عطلات رحلاتكم للسياحة والسفر', 'Otolat Rahlatcom Travel & Tourism', 'text', 'badge', 1),
('main_title_line1', 'رحلتك تبدأ', 'Your Journey', 'text', 'general', 2),
('main_title_line2', 'من هنا', 'Starts Here', 'text', 'general', 3),
('description', 'نقدم لك خدمات التأشيرات والسفر بأعلى جودة وأفضل الأسعار. احصل على تأشيرتك بكل سهولة ويسر مع فريقنا المتخصص.', 'We offer you visa and travel services with the highest quality and best prices. Get your visa easily with our specialized team.', 'text', 'general', 4),
('search_placeholder', 'ابحث عن وجهتك...', 'Search your destination...', 'text', 'general', 5),
('search_button', 'ابحث الآن', 'Search Now', 'text', 'general', 6),
-- Stats indicators
('stat_success_rate', '98%', '98%', 'text', 'stats', 10),
('stat_success_label', 'نسبة النجاح', 'Success Rate', 'text', 'stats', 11),
('stat_countries', '+50', '+50', 'text', 'stats', 12),
('stat_countries_label', 'دولة', 'Countries', 'text', 'stats', 13),
('stat_support', 'دعم متواصل', '24/7 Support', 'text', 'stats', 14),
-- Floating cards
('card_visas_count', '+10,000', '+10,000', 'text', 'stats', 20),
('card_visas_label', 'تأشيرات مُنجزة', 'Visas Completed', 'text', 'stats', 21),
('card_processing_time', '5 أيام', '5 Days', 'text', 'stats', 22),
('card_processing_label', 'متوسط المعالجة', 'Avg. Processing', 'text', 'stats', 23);