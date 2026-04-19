-- 1. Gaspard reservations: remove public SELECT
DROP POLICY IF EXISTS "Public can view own reservations by email" ON public.gaspard_reservations;

-- 2. Admin users: remove duplicate permissive UPDATE policy
DROP POLICY IF EXISTS "Users can only update their own admin record" ON public.admin_users;

-- 3. Species translations: restrict writes to admins
DROP POLICY IF EXISTS "Authenticated users can insert species translations" ON public.species_translations;
DROP POLICY IF EXISTS "Authenticated users can update species translations" ON public.species_translations;

CREATE POLICY "Admins can insert species translations"
ON public.species_translations
FOR INSERT
TO authenticated
WITH CHECK (public.check_is_admin_user(auth.uid()));

CREATE POLICY "Admins can update species translations"
ON public.species_translations
FOR UPDATE
TO authenticated
USING (public.check_is_admin_user(auth.uid()))
WITH CHECK (public.check_is_admin_user(auth.uid()));