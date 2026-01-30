-- Create notes type enum
CREATE TYPE public.note_type AS ENUM ('agent', 'admin', 'system');

-- Create application notes history table
CREATE TABLE public.application_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  author_name TEXT,
  note_type note_type NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.application_notes ENABLE ROW LEVEL SECURITY;

-- Create index for faster queries
CREATE INDEX idx_application_notes_app_id ON public.application_notes(application_id);
CREATE INDEX idx_application_notes_author ON public.application_notes(author_id);
CREATE INDEX idx_application_notes_created ON public.application_notes(created_at DESC);

-- RLS Policies: Notes can only be INSERTED, never updated or deleted

-- Admins can view all notes
CREATE POLICY "Admins can view all notes"
ON public.application_notes
FOR SELECT
USING (is_admin(auth.uid()));

-- Agents can view notes for assigned applications
CREATE POLICY "Agents can view notes for assigned applications"
ON public.application_notes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = application_notes.application_id
    AND is_assigned_agent(a.id, auth.uid())
  )
);

-- Admins can insert notes
CREATE POLICY "Admins can insert notes"
ON public.application_notes
FOR INSERT
WITH CHECK (
  is_admin(auth.uid()) AND
  author_id = get_profile_id(auth.uid())
);

-- Agents can insert notes for assigned applications
CREATE POLICY "Agents can insert notes for assigned applications"
ON public.application_notes
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = application_notes.application_id
    AND is_assigned_agent(a.id, auth.uid())
  ) AND
  author_id = get_profile_id(auth.uid())
);

-- NO UPDATE OR DELETE POLICIES - Notes are permanent!

-- Add comment explaining the table purpose
COMMENT ON TABLE public.application_notes IS 'Permanent record of all notes - cannot be modified or deleted for audit purposes';
COMMENT ON COLUMN public.application_notes.author_id IS 'Profile ID of the note author';
COMMENT ON COLUMN public.application_notes.note_type IS 'Type of note: agent (by agent), admin (by admin), system (automated)';