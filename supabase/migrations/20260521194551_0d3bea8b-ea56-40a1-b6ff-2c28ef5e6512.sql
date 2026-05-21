CREATE OR REPLACE FUNCTION public.generate_event_public_slug(_title text, _date date)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  base_slug text;
  candidate text;
  suffix int := 0;
BEGIN
  base_slug := lower(regexp_replace(
    extensions.unaccent(coalesce(_title, 'marche')),
    '[^a-zA-Z0-9]+', '-', 'g'
  ));
  base_slug := trim(both '-' from base_slug);

  IF base_slug = '' THEN
    base_slug := 'marche';
  END IF;

  base_slug := base_slug || '-' || to_char(_date, 'YYYY-MM-DD');
  candidate := base_slug;

  WHILE EXISTS (
    SELECT 1
    FROM public.marche_events
    WHERE public_slug = candidate
  ) LOOP
    suffix := suffix + 1;
    candidate := base_slug || '-' || suffix;
  END LOOP;

  RETURN candidate;
END;
$$;