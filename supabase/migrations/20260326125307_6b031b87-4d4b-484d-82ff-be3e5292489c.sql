
-- Seed homepage content sections
INSERT INTO public.site_content (page, section, display_order, content) VALUES

-- Stats Section
('home', 'stats', 1, '{
  "title": "أرقامنا تتحدث",
  "title_en": "Our Numbers Speak",
  "items": [
    {"value": "10000", "suffix": "+", "label": "عميل سعيد", "label_en": "Happy Clients", "icon": "Users"},
    {"value": "50", "suffix": "+", "label": "دولة نخدمها", "label_en": "Countries Served", "icon": "Globe"},
    {"value": "98", "suffix": "%", "label": "نسبة النجاح", "label_en": "Success Rate", "icon": "Award"},
    {"value": "24", "suffix": "/7", "label": "دعم متواصل", "label_en": "Continuous Support", "icon": "Headphones"}
  ]
}'::jsonb),

-- Testimonials Section
('home', 'testimonials', 2, '{
  "title": "ماذا يقول عملاؤنا",
  "title_en": "What Our Clients Say",
  "subtitle": "آراء حقيقية من عملائنا الكرام",
  "subtitle_en": "Real opinions from our valued clients",
  "items": [
    {"name": "أحمد محمد", "name_en": "Ahmed Mohammed", "role": "رجل أعمال", "role_en": "Businessman", "content": "خدمة ممتازة وسريعة. حصلت على تأشيرة شنغن في 5 أيام فقط! فريق محترف ومتابعة مستمرة.", "content_en": "Excellent and fast service. Got my Schengen visa in just 5 days! Professional team with continuous follow-up.", "rating": 5, "avatar": "أ", "country": "🇸🇦", "visa": "شنغن", "visa_en": "Schengen"},
    {"name": "سارة العلي", "name_en": "Sara Al-Ali", "role": "طالبة", "role_en": "Student", "content": "فريق محترف ساعدني في الحصول على تأشيرة الدراسة بكل سهولة. أنصح الجميع بالتعامل معهم.", "content_en": "Professional team helped me get my student visa easily. I recommend everyone to deal with them.", "rating": 5, "avatar": "س", "country": "🇸🇦", "visa": "بريطانيا", "visa_en": "UK"},
    {"name": "خالد الأحمد", "name_en": "Khalid Al-Ahmed", "role": "سائح", "role_en": "Tourist", "content": "أفضل خدمة تأشيرات استخدمتها. متابعة مستمرة وتواصل ممتاز. سأتعامل معهم دائماً.", "content_en": "Best visa service I have used. Continuous follow-up and excellent communication.", "rating": 5, "avatar": "خ", "country": "🇸🇦", "visa": "تركيا", "visa_en": "Turkey"},
    {"name": "نورة السعيد", "name_en": "Noura Al-Saeed", "role": "موظفة", "role_en": "Employee", "content": "تجربة رائعة من البداية للنهاية. الأسعار مناسبة والخدمة سريعة ومحترفة.", "content_en": "Wonderful experience from start to finish. Reasonable prices and fast professional service.", "rating": 5, "avatar": "ن", "country": "🇸🇦", "visa": "دبي", "visa_en": "Dubai"},
    {"name": "محمد الحربي", "name_en": "Mohammed Al-Harbi", "role": "مهندس", "role_en": "Engineer", "content": "سهولة في التقديم ومتابعة دقيقة للطلب. حصلت على التأشيرة قبل الموعد المتوقع!", "content_en": "Easy application and precise tracking. Got my visa before the expected date!", "rating": 5, "avatar": "م", "country": "🇸🇦", "visa": "أمريكا", "visa_en": "USA"}
  ]
}'::jsonb),

-- Partners Section
('home', 'partners', 3, '{
  "title": "موثوق من قبل أفضل الشركات",
  "title_en": "Trusted by Top Companies",
  "subtitle": "شركاؤنا في النجاح",
  "subtitle_en": "Our Success Partners",
  "items": [
    {"name": "الخطوط السعودية", "name_en": "Saudi Airlines", "icon": "Plane"},
    {"name": "بنك الراجحي", "name_en": "Al Rajhi Bank", "icon": "Landmark"},
    {"name": "أرامكو السعودية", "name_en": "Saudi Aramco", "icon": "Factory"},
    {"name": "سابك", "name_en": "SABIC", "icon": "Building2"},
    {"name": "الاتصالات السعودية", "name_en": "STC", "icon": "Smartphone"},
    {"name": "موبايلي", "name_en": "Mobily", "icon": "Wifi"}
  ],
  "badges": [
    {"icon": "🔒", "text": "مدفوعات آمنة 100%", "text_en": "100% Secure Payments"},
    {"icon": "✅", "text": "معتمد رسمياً", "text_en": "Officially Certified"},
    {"icon": "⭐", "text": "تقييم 4.9/5", "text_en": "4.9/5 Rating"},
    {"icon": "🛡️", "text": "حماية كاملة للبيانات", "text_en": "Full Data Protection"}
  ]
}'::jsonb),

-- Features Section
('home', 'features', 4, '{
  "title": "لماذا تختارنا",
  "title_en": "Why Choose Us",
  "subtitle": "مميزاتنا",
  "subtitle_en": "Our Features",
  "items": [
    {"title": "دعم على مدار الساعة", "title_en": "24/7 Support", "description": "فريق متخصص لمساعدتك في أي وقت", "description_en": "Specialized team to help you anytime", "icon": "Headphones"},
    {"title": "تتبع مباشر", "title_en": "Live Tracking", "description": "تابع حالة طلبك لحظة بلحظة", "description_en": "Track your application status in real-time", "icon": "Clock"},
    {"title": "خبراء متخصصون", "title_en": "Expert Specialists", "description": "فريق من الخبراء المعتمدين في مجال التأشيرات", "description_en": "Team of certified visa experts", "icon": "Users"},
    {"title": "شفافية كاملة", "title_en": "Full Transparency", "description": "أسعار واضحة بدون رسوم مخفية", "description_en": "Clear pricing with no hidden fees", "icon": "Shield"}
  ]
}'::jsonb),

-- How It Works Section
('home', 'how_it_works', 5, '{
  "title": "كيف نعمل؟",
  "title_en": "How It Works?",
  "badge": "خطوات بسيطة",
  "badge_en": "Simple Steps",
  "subtitle": "احصل على تأشيرتك في 4 خطوات بسيطة",
  "subtitle_en": "Get your visa in 4 simple steps",
  "items": [
    {"title": "اختر وجهتك", "title_en": "Choose Destination", "description": "اختر البلد ونوع التأشيرة المناسب", "description_en": "Choose the country and appropriate visa type", "icon": "Globe"},
    {"title": "قدم طلبك", "title_en": "Submit Application", "description": "أكمل البيانات المطلوبة وارفع الوثائق", "description_en": "Complete required data and upload documents", "icon": "FileText"},
    {"title": "ادفع بأمان", "title_en": "Pay Securely", "description": "ادفع الرسوم عبر بوابة الدفع الآمنة", "description_en": "Pay fees through secure payment gateway", "icon": "CreditCard"},
    {"title": "استلم تأشيرتك", "title_en": "Receive Visa", "description": "استلم تأشيرتك وابدأ رحلتك", "description_en": "Receive your visa and start your journey", "icon": "Plane"}
  ]
}'::jsonb),

-- CTA Section
('home', 'cta', 6, '{
  "title": "جاهز لبدء رحلتك؟",
  "title_en": "Ready to Start Your Journey?",
  "description": "انضم لآلاف العملاء السعداء واحصل على تأشيرتك بأسرع وقت",
  "description_en": "Join thousands of happy clients and get your visa in the shortest time",
  "primary_button": "قدم طلبك الآن",
  "primary_button_en": "Apply Now",
  "secondary_button": "تواصل معنا",
  "secondary_button_en": "Contact Us"
}'::jsonb)

ON CONFLICT DO NOTHING;
