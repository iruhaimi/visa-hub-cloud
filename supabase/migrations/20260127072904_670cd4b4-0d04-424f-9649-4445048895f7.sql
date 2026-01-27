-- Create refund requests table
CREATE TABLE public.refund_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_number TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  reason TEXT NOT NULL,
  additional_details TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Anyone can submit a refund request (public form)
CREATE POLICY "Anyone can submit refund requests"
ON public.refund_requests
FOR INSERT
WITH CHECK (true);

-- Users can view their own refund requests by email
CREATE POLICY "Users can view own refund requests"
ON public.refund_requests
FOR SELECT
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR is_admin(auth.uid())
);

-- Admins can update refund requests
CREATE POLICY "Admins can update refund requests"
ON public.refund_requests
FOR UPDATE
USING (is_admin(auth.uid()));

-- Admins can delete refund requests
CREATE POLICY "Admins can delete refund requests"
ON public.refund_requests
FOR DELETE
USING (is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_refund_requests_updated_at
BEFORE UPDATE ON public.refund_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_refund_requests_email ON public.refund_requests(email);
CREATE INDEX idx_refund_requests_status ON public.refund_requests(status);
CREATE INDEX idx_refund_requests_application_number ON public.refund_requests(application_number);