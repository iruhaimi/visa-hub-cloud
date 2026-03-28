-- Enable realtime for public-facing tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.countries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.visa_types;
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_content;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hero_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hero_destinations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.footer_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.special_offers;