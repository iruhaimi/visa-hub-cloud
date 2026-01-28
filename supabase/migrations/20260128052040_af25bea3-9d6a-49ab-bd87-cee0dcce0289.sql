-- Create hero_destinations table for managing hero slider content
CREATE TABLE public.hero_destinations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  country TEXT NOT NULL,
  country_en TEXT,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  link_url TEXT DEFAULT '/destinations',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.hero_destinations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active hero destinations"
ON public.hero_destinations
FOR SELECT
USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "Admins can insert hero destinations"
ON public.hero_destinations
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update hero destinations"
ON public.hero_destinations
FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete hero destinations"
ON public.hero_destinations
FOR DELETE
USING (is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_hero_destinations_updated_at
BEFORE UPDATE ON public.hero_destinations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default destinations
INSERT INTO public.hero_destinations (name, name_en, country, country_en, image_url, display_order) VALUES
('دبي', 'Dubai', 'الإمارات', 'UAE', '/placeholder.svg', 1),
('باريس', 'Paris', 'فرنسا', 'France', '/placeholder.svg', 2),
('إسطنبول', 'Istanbul', 'تركيا', 'Turkey', '/placeholder.svg', 3),
('لندن', 'London', 'بريطانيا', 'United Kingdom', '/placeholder.svg', 4);