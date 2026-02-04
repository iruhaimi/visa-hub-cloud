
-- Create footer_settings table for managing footer content
CREATE TABLE public.footer_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category VARCHAR(50) NOT NULL, -- 'contact', 'social', 'quick_links', 'policies', 'general'
  key VARCHAR(100) NOT NULL,
  label VARCHAR(255) NOT NULL,
  value TEXT NOT NULL,
  value_en TEXT,
  icon VARCHAR(50),
  url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(category, key)
);

-- Enable RLS
ALTER TABLE public.footer_settings ENABLE ROW LEVEL SECURITY;

-- Public read access for footer content
CREATE POLICY "Anyone can view active footer settings"
ON public.footer_settings
FOR SELECT
USING (is_active = true);

-- Only super admins can manage footer settings
CREATE POLICY "Super admins can manage footer settings"
ON public.footer_settings
FOR ALL
USING (public.is_super_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_footer_settings_updated_at
BEFORE UPDATE ON public.footer_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default footer data
INSERT INTO public.footer_settings (category, key, label, value, value_en, icon, url, display_order) VALUES
-- Contact info
('contact', 'phone', 'رقم الهاتف', '920034158', '920034158', 'Phone', 'tel:920034158', 1),
('contact', 'email', 'البريد الإلكتروني', 'info@rhalat.com', 'info@rhalat.com', 'Mail', 'mailto:info@rhalat.com', 2),
('contact', 'working_hours', 'ساعات العمل', 'يومياً: ١٠ ص - ١٠ م', 'Daily: 10 AM - 10 PM', 'Clock', NULL, 3),

-- Social media
('social', 'twitter', 'تويتر', 'rhalatkom', 'rhalatkom', 'Twitter', 'https://x.com/rhalatkom', 1),
('social', 'instagram', 'انستغرام', 'rhalatkm', 'rhalatkm', 'Instagram', 'https://www.instagram.com/rhalatkm/', 2),
('social', 'facebook', 'فيسبوك', 'rhalatkom', 'rhalatkom', 'Facebook', 'https://www.facebook.com/profile.php?id=61554799015370', 3),
('social', 'tiktok', 'تيك توك', 'otolatrahlatcom', 'otolatrahlatcom', 'TikTok', 'https://www.tiktok.com/@otolatrahlatcom', 4),

-- General info
('general', 'company_name', 'اسم الشركة', 'عطلات رحلاتكم للسياحة والسفر', 'Rhalatkom Tourism & Travel', NULL, NULL, 1),
('general', 'description', 'الوصف', 'شركة رائدة في خدمات التأشيرات والسفر، نقدم حلولاً متكاملة لتسهيل رحلاتكم حول العالم.', 'A leading company in visa and travel services, providing integrated solutions to facilitate your trips around the world.', NULL, NULL, 2),
('general', 'legal_notice', 'الإشعار القانوني', 'هذا الموقع يقدم خدمات المساعدة في إصدار التأشيرات ولا يمثل أي سفارة أو جهة حكومية رسمية.', 'This website provides visa assistance services and does not represent any embassy or official government entity.', NULL, NULL, 3);
