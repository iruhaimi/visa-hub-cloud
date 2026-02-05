-- Insert quick links
INSERT INTO public.footer_settings (category, key, label, value, value_en, url, display_order, is_active) VALUES
('quick_links', 'home', 'الرئيسية', 'الرئيسية', 'Home', '/', 1, true),
('quick_links', 'destinations', 'الوجهات', 'الوجهات', 'Destinations', '/destinations', 2, true),
('quick_links', 'pricing', 'الأسعار', 'الأسعار', 'Pricing', '/pricing', 3, true),
('quick_links', 'track', 'تتبع الطلب', 'تتبع الطلب', 'Track Application', '/track', 4, true),
('quick_links', 'faq', 'الأسئلة الشائعة', 'الأسئلة الشائعة', 'FAQ', '/faq', 5, true),
('quick_links', 'about', 'من نحن', 'من نحن', 'About Us', '/about', 6, true),
('quick_links', 'contact', 'اتصل بنا', 'اتصل بنا', 'Contact', '/contact', 7, true);

-- Insert policy links
INSERT INTO public.footer_settings (category, key, label, value, value_en, url, display_order, is_active) VALUES
('policies', 'terms', 'الشروط والأحكام', 'الشروط والأحكام', 'Terms & Conditions', '/terms', 1, true),
('policies', 'privacy', 'سياسة الخصوصية', 'سياسة الخصوصية', 'Privacy Policy', '/privacy', 2, true),
('policies', 'refund', 'سياسة الاسترجاع', 'سياسة الاسترجاع', 'Refund Policy', '/refund', 3, true);