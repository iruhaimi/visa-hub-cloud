
-- Create tour_operators table
CREATE TABLE public.tour_operators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  company_name_en text,
  description text,
  description_en text,
  logo_url text,
  cover_image_url text,
  whatsapp_number text,
  phone text,
  email text,
  website text,
  address text,
  city text,
  country text,
  is_verified boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  admin_notes text,
  verified_at timestamptz,
  verified_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create tour_programs table
CREATE TABLE public.tour_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id uuid NOT NULL REFERENCES public.tour_operators(id) ON DELETE CASCADE,
  title text NOT NULL,
  title_en text,
  description text,
  description_en text,
  destination text NOT NULL,
  destination_en text,
  cover_image_url text,
  gallery_images jsonb DEFAULT '[]'::jsonb,
  duration_days integer NOT NULL DEFAULT 1,
  duration_nights integer NOT NULL DEFAULT 0,
  price numeric NOT NULL DEFAULT 0,
  discounted_price numeric,
  discount_percentage integer,
  currency text NOT NULL DEFAULT 'SAR',
  daily_itinerary jsonb DEFAULT '[]'::jsonb,
  hotels jsonb DEFAULT '[]'::jsonb,
  inclusions jsonb DEFAULT '[]'::jsonb,
  exclusions jsonb DEFAULT '[]'::jsonb,
  cancellation_policy text,
  cancellation_policy_en text,
  available_dates jsonb DEFAULT '[]'::jsonb,
  max_seats integer,
  seats_booked integer NOT NULL DEFAULT 0,
  start_date date,
  end_date date,
  is_recurring boolean NOT NULL DEFAULT false,
  tags jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  rejection_reason text,
  display_order integer DEFAULT 0,
  views_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create tour_bookings table
CREATE TABLE public.tour_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.tour_programs(id) ON DELETE CASCADE,
  operator_id uuid NOT NULL REFERENCES public.tour_operators(id),
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text NOT NULL,
  travelers_count integer NOT NULL DEFAULT 1,
  preferred_date text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  operator_notes text,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create tour_program_reviews table
CREATE TABLE public.tour_program_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.tour_programs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  rating integer NOT NULL,
  comment text,
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(program_id, user_id)
);

-- Enable RLS
ALTER TABLE public.tour_operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_program_reviews ENABLE ROW LEVEL SECURITY;

-- RLS for tour_operators
CREATE POLICY "Anyone can view active operators" ON public.tour_operators
  FOR SELECT USING (is_active = true OR is_admin(auth.uid()) OR user_id = auth.uid());

CREATE POLICY "Operators can update own profile" ON public.tour_operators
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all operators" ON public.tour_operators
  FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "New operators can insert own profile" ON public.tour_operators
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS for tour_programs
CREATE POLICY "Anyone can view approved programs" ON public.tour_programs
  FOR SELECT USING (
    status = 'approved' 
    OR is_admin(auth.uid()) 
    OR EXISTS (SELECT 1 FROM tour_operators WHERE id = tour_programs.operator_id AND user_id = auth.uid())
  );

CREATE POLICY "Operators can insert own programs" ON public.tour_programs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM tour_operators WHERE id = tour_programs.operator_id AND user_id = auth.uid())
  );

CREATE POLICY "Operators can update own programs" ON public.tour_programs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM tour_operators WHERE id = tour_programs.operator_id AND user_id = auth.uid())
    OR is_admin(auth.uid())
  );

CREATE POLICY "Can delete own draft or admin delete" ON public.tour_programs
  FOR DELETE USING (
    (status = 'draft' AND EXISTS (SELECT 1 FROM tour_operators WHERE id = tour_programs.operator_id AND user_id = auth.uid()))
    OR is_admin(auth.uid())
  );

-- RLS for tour_bookings
CREATE POLICY "Operators can view own bookings" ON public.tour_bookings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM tour_operators WHERE id = tour_bookings.operator_id AND user_id = auth.uid())
    OR is_admin(auth.uid())
    OR user_id = auth.uid()
  );

CREATE POLICY "Anyone authenticated can create bookings" ON public.tour_bookings
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Operators can update own bookings" ON public.tour_bookings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM tour_operators WHERE id = tour_bookings.operator_id AND user_id = auth.uid())
    OR is_admin(auth.uid())
  );

-- RLS for reviews
CREATE POLICY "Anyone can view approved reviews" ON public.tour_program_reviews
  FOR SELECT USING (is_approved = true OR is_admin(auth.uid()) OR user_id = auth.uid());

CREATE POLICY "Authenticated users can create reviews" ON public.tour_program_reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage reviews" ON public.tour_program_reviews
  FOR UPDATE USING (is_admin(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_tour_operators_updated_at BEFORE UPDATE ON public.tour_operators
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tour_programs_updated_at BEFORE UPDATE ON public.tour_programs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tour_bookings_updated_at BEFORE UPDATE ON public.tour_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper function
CREATE OR REPLACE FUNCTION public.is_tour_operator(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.has_role(_user_id, 'tour_operator')
$$;
