-- Fix: transition tables are only allowed on AFTER triggers.
-- This migration enforces that the system can NEVER end up with 0 admins or 0 super-admins.

CREATE OR REPLACE FUNCTION public.enforce_minimum_admins()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  remaining_admins integer;
BEGIN
  IF TG_OP = 'DELETE' THEN
    -- Only run check if an admin role was actually deleted
    IF EXISTS (SELECT 1 FROM old_rows WHERE role = 'admin') THEN
      SELECT count(*) INTO remaining_admins
      FROM public.user_roles
      WHERE role = 'admin';

      IF remaining_admins < 1 THEN
        RAISE EXCEPTION 'cannot_remove_last_admin';
      END IF;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only run check if admin role was changed away from admin
    IF EXISTS (
      SELECT 1
      FROM old_rows o
      JOIN new_rows n ON n.id = o.id
      WHERE o.role = 'admin' AND n.role <> 'admin'
    ) THEN
      SELECT count(*) INTO remaining_admins
      FROM public.user_roles
      WHERE role = 'admin';

      IF remaining_admins < 1 THEN
        RAISE EXCEPTION 'cannot_remove_last_admin';
      END IF;
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_minimum_admins_delete ON public.user_roles;
CREATE TRIGGER trg_enforce_minimum_admins_delete
AFTER DELETE ON public.user_roles
REFERENCING OLD TABLE AS old_rows
FOR EACH STATEMENT
EXECUTE FUNCTION public.enforce_minimum_admins();

DROP TRIGGER IF EXISTS trg_enforce_minimum_admins_update ON public.user_roles;
CREATE TRIGGER trg_enforce_minimum_admins_update
AFTER UPDATE ON public.user_roles
REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows
FOR EACH STATEMENT
EXECUTE FUNCTION public.enforce_minimum_admins();


CREATE OR REPLACE FUNCTION public.enforce_minimum_super_admins()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  remaining_super_admins integer;
BEGIN
  IF TG_OP = 'DELETE' THEN
    -- Only run check if manage_staff permission was actually deleted
    IF EXISTS (SELECT 1 FROM old_rows WHERE permission = 'manage_staff') THEN
      SELECT count(DISTINCT user_id) INTO remaining_super_admins
      FROM public.staff_permissions
      WHERE permission = 'manage_staff';

      IF remaining_super_admins < 1 THEN
        RAISE EXCEPTION 'cannot_remove_last_super_admin';
      END IF;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only run check if manage_staff was changed away
    IF EXISTS (
      SELECT 1
      FROM old_rows o
      JOIN new_rows n ON n.id = o.id
      WHERE o.permission = 'manage_staff' AND n.permission <> 'manage_staff'
    ) THEN
      SELECT count(DISTINCT user_id) INTO remaining_super_admins
      FROM public.staff_permissions
      WHERE permission = 'manage_staff';

      IF remaining_super_admins < 1 THEN
        RAISE EXCEPTION 'cannot_remove_last_super_admin';
      END IF;
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_minimum_super_admins_delete ON public.staff_permissions;
CREATE TRIGGER trg_enforce_minimum_super_admins_delete
AFTER DELETE ON public.staff_permissions
REFERENCING OLD TABLE AS old_rows
FOR EACH STATEMENT
EXECUTE FUNCTION public.enforce_minimum_super_admins();

DROP TRIGGER IF EXISTS trg_enforce_minimum_super_admins_update ON public.staff_permissions;
CREATE TRIGGER trg_enforce_minimum_super_admins_update
AFTER UPDATE ON public.staff_permissions
REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows
FOR EACH STATEMENT
EXECUTE FUNCTION public.enforce_minimum_super_admins();
