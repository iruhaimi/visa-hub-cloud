-- Add view_revenue permission to staff_permission enum
ALTER TYPE public.staff_permission ADD VALUE IF NOT EXISTS 'view_revenue';