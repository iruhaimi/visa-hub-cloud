-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('customer', 'agent', 'admin');

-- Create enum for application status
CREATE TYPE public.application_status AS ENUM (
  'draft', 
  'pending_payment', 
  'submitted', 
  'under_review', 
  'documents_required', 
  'processing', 
  'approved', 
  'rejected', 
  'cancelled'
);

-- Create enum for document status
CREATE TYPE public.document_status AS ENUM ('pending', 'verified', 'rejected');

-- Create enum for payment status
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Create enum for wallet transaction type
CREATE TYPE public.wallet_transaction_type AS ENUM ('deposit', 'withdrawal', 'payment', 'refund', 'reward');

-- =====================================================
-- PROFILES TABLE
-- =====================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  date_of_birth DATE,
  nationality TEXT,
  passport_number TEXT,
  passport_expiry DATE,
  address TEXT,
  city TEXT,
  country TEXT,
  wallet_balance DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =====================================================
-- USER ROLES TABLE (Separate from profiles for security)
-- =====================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- =====================================================
-- COUNTRIES TABLE
-- =====================================================
CREATE TABLE public.countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  flag_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =====================================================
-- VISA TYPES TABLE
-- =====================================================
CREATE TABLE public.visa_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id UUID REFERENCES public.countries(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  requirements JSONB DEFAULT '[]'::jsonb,
  price DECIMAL(10,2) NOT NULL,
  processing_days INTEGER NOT NULL DEFAULT 7,
  validity_days INTEGER,
  max_stay_days INTEGER,
  entry_type TEXT DEFAULT 'single',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =====================================================
-- APPLICATIONS TABLE
-- =====================================================
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  visa_type_id UUID REFERENCES public.visa_types(id) ON DELETE RESTRICT NOT NULL,
  status application_status DEFAULT 'draft' NOT NULL,
  travel_date DATE,
  return_date DATE,
  purpose_of_travel TEXT,
  accommodation_details TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  assigned_agent_id UUID REFERENCES public.profiles(id),
  agent_notes TEXT,
  admin_notes TEXT,
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =====================================================
-- APPLICATION DOCUMENTS TABLE
-- =====================================================
CREATE TABLE public.application_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  status document_status DEFAULT 'pending' NOT NULL,
  verification_notes TEXT,
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =====================================================
-- APPLICATION STATUS HISTORY TABLE
-- =====================================================
CREATE TABLE public.application_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  old_status application_status,
  new_status application_status NOT NULL,
  changed_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =====================================================
-- PAYMENTS TABLE
-- =====================================================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status payment_status DEFAULT 'pending' NOT NULL,
  payment_method TEXT,
  stripe_payment_intent_id TEXT,
  stripe_session_id TEXT,
  invoice_number TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =====================================================
-- WALLET TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type wallet_transaction_type NOT NULL,
  description TEXT,
  reference_id UUID,
  balance_after DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =====================================================
-- SECURITY DEFINER FUNCTIONS FOR ROLE CHECKING
-- =====================================================

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- Check if user is agent
CREATE OR REPLACE FUNCTION public.is_agent(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'agent')
$$;

-- Check if user is customer
CREATE OR REPLACE FUNCTION public.is_customer(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'customer')
$$;

-- Get profile ID from auth user ID
CREATE OR REPLACE FUNCTION public.get_profile_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Check if user owns the application
CREATE OR REPLACE FUNCTION public.is_application_owner(_app_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.applications a
    JOIN public.profiles p ON a.user_id = p.id
    WHERE a.id = _app_id AND p.user_id = _user_id
  )
$$;

-- Check if user is assigned agent for application
CREATE OR REPLACE FUNCTION public.is_assigned_agent(_app_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.applications a
    JOIN public.profiles p ON a.assigned_agent_id = p.id
    WHERE a.id = _app_id AND p.user_id = _user_id
  )
$$;

-- Check if user can access application
CREATE OR REPLACE FUNCTION public.can_access_application(_app_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    public.is_application_owner(_app_id, _user_id) OR
    public.is_assigned_agent(_app_id, _user_id) OR
    public.is_admin(_user_id)
$$;

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visa_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - PROFILES
-- =====================================================
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Agents can view assigned customer profiles"
  ON public.profiles FOR SELECT
  USING (
    public.is_agent(auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.profiles agent_profile ON agent_profile.user_id = auth.uid()
      WHERE a.assigned_agent_id = agent_profile.id AND a.user_id = profiles.id
    )
  );

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- =====================================================
-- RLS POLICIES - USER ROLES
-- =====================================================
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "New users can create customer role for self"
  ON public.user_roles FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    role = 'customer' AND
    NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can insert any role"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.is_admin(auth.uid()));

-- =====================================================
-- RLS POLICIES - COUNTRIES (Public read, Admin write)
-- =====================================================
CREATE POLICY "Anyone can view active countries"
  ON public.countries FOR SELECT
  USING (is_active = true OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert countries"
  ON public.countries FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update countries"
  ON public.countries FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete countries"
  ON public.countries FOR DELETE
  USING (public.is_admin(auth.uid()));

-- =====================================================
-- RLS POLICIES - VISA TYPES (Public read, Admin write)
-- =====================================================
CREATE POLICY "Anyone can view active visa types"
  ON public.visa_types FOR SELECT
  USING (is_active = true OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert visa types"
  ON public.visa_types FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update visa types"
  ON public.visa_types FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete visa types"
  ON public.visa_types FOR DELETE
  USING (public.is_admin(auth.uid()));

-- =====================================================
-- RLS POLICIES - APPLICATIONS
-- =====================================================
CREATE POLICY "Users can view own applications"
  ON public.applications FOR SELECT
  USING (public.is_application_owner(id, auth.uid()));

CREATE POLICY "Agents can view assigned applications"
  ON public.applications FOR SELECT
  USING (public.is_assigned_agent(id, auth.uid()));

CREATE POLICY "Admins can view all applications"
  ON public.applications FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Customers can create applications"
  ON public.applications FOR INSERT
  WITH CHECK (user_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Users can update own draft applications"
  ON public.applications FOR UPDATE
  USING (
    public.is_application_owner(id, auth.uid()) AND
    status IN ('draft', 'documents_required')
  );

CREATE POLICY "Agents can update assigned applications"
  ON public.applications FOR UPDATE
  USING (public.is_assigned_agent(id, auth.uid()));

CREATE POLICY "Admins can update all applications"
  ON public.applications FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can delete own draft applications"
  ON public.applications FOR DELETE
  USING (
    public.is_application_owner(id, auth.uid()) AND
    status = 'draft'
  );

CREATE POLICY "Admins can delete any application"
  ON public.applications FOR DELETE
  USING (public.is_admin(auth.uid()));

-- =====================================================
-- RLS POLICIES - APPLICATION DOCUMENTS
-- =====================================================
CREATE POLICY "Users can view own application documents"
  ON public.application_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = application_id AND public.can_access_application(a.id, auth.uid())
    )
  );

CREATE POLICY "Users can insert documents for own applications"
  ON public.application_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = application_id AND public.is_application_owner(a.id, auth.uid())
    )
  );

CREATE POLICY "Users can update own application documents"
  ON public.application_documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = application_id AND public.is_application_owner(a.id, auth.uid())
    )
  );

CREATE POLICY "Agents can update document verification"
  ON public.application_documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = application_id AND public.is_assigned_agent(a.id, auth.uid())
    )
  );

CREATE POLICY "Admins can update any documents"
  ON public.application_documents FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can delete own application documents"
  ON public.application_documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = application_id AND public.is_application_owner(a.id, auth.uid())
    )
  );

-- =====================================================
-- RLS POLICIES - APPLICATION STATUS HISTORY
-- =====================================================
CREATE POLICY "Users can view status history for accessible applications"
  ON public.application_status_history FOR SELECT
  USING (public.can_access_application(application_id, auth.uid()));

CREATE POLICY "System can insert status history"
  ON public.application_status_history FOR INSERT
  WITH CHECK (public.can_access_application(application_id, auth.uid()));

-- =====================================================
-- RLS POLICIES - PAYMENTS
-- =====================================================
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = application_id AND public.is_application_owner(a.id, auth.uid())
    )
  );

CREATE POLICY "Agents can view payments for assigned apps"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = application_id AND public.is_assigned_agent(a.id, auth.uid())
    )
  );

CREATE POLICY "Admins can view all payments"
  ON public.payments FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can create payments for own applications"
  ON public.payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = application_id AND public.is_application_owner(a.id, auth.uid())
    )
  );

CREATE POLICY "Admins can update payments"
  ON public.payments FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- =====================================================
-- RLS POLICIES - WALLET TRANSACTIONS
-- =====================================================
CREATE POLICY "Users can view own wallet transactions"
  ON public.wallet_transactions FOR SELECT
  USING (user_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Admins can view all wallet transactions"
  ON public.wallet_transactions FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can insert wallet transactions"
  ON public.wallet_transactions FOR INSERT
  WITH CHECK (user_id = public.get_profile_id(auth.uid()));

-- =====================================================
-- RLS POLICIES - NOTIFICATIONS
-- =====================================================
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Admins can view all notifications"
  ON public.notifications FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Admins can update all notifications"
  ON public.notifications FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (user_id = public.get_profile_id(auth.uid()));

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_countries_updated_at
  BEFORE UPDATE ON public.countries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_visa_types_updated_at
  BEFORE UPDATE ON public.visa_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_application_documents_updated_at
  BEFORE UPDATE ON public.application_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- TRIGGER FOR APPLICATION STATUS HISTORY
-- =====================================================
CREATE OR REPLACE FUNCTION public.log_application_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.application_status_history (application_id, old_status, new_status)
    VALUES (NEW.id, OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_application_status_change
  AFTER UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.log_application_status_change();

-- =====================================================
-- TRIGGER FOR AUTO-CREATING PROFILE ON SIGNUP
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- STORAGE BUCKET FOR DOCUMENTS
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);

-- Storage policies for documents bucket
CREATE POLICY "Users can upload documents for own applications"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Agents can view assigned application documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents' AND
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.profiles p ON p.user_id = auth.uid()
      JOIN public.profiles owner ON owner.user_id::text = (storage.foldername(name))[1]
      WHERE a.assigned_agent_id = p.id AND a.user_id = owner.id
    )
  );

CREATE POLICY "Admins can view all documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents' AND
    public.is_admin(auth.uid())
  );

CREATE POLICY "Users can delete own documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================
-- SEED DATA - COUNTRIES
-- =====================================================
INSERT INTO public.countries (name, code, flag_url, is_active) VALUES
  ('United States', 'US', 'https://flagcdn.com/w80/us.png', true),
  ('United Kingdom', 'GB', 'https://flagcdn.com/w80/gb.png', true),
  ('Canada', 'CA', 'https://flagcdn.com/w80/ca.png', true),
  ('Australia', 'AU', 'https://flagcdn.com/w80/au.png', true),
  ('Germany', 'DE', 'https://flagcdn.com/w80/de.png', true),
  ('France', 'FR', 'https://flagcdn.com/w80/fr.png', true),
  ('United Arab Emirates', 'AE', 'https://flagcdn.com/w80/ae.png', true),
  ('Saudi Arabia', 'SA', 'https://flagcdn.com/w80/sa.png', true),
  ('Japan', 'JP', 'https://flagcdn.com/w80/jp.png', true),
  ('Singapore', 'SG', 'https://flagcdn.com/w80/sg.png', true);