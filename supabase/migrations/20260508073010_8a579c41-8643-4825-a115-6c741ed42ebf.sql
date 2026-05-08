
CREATE OR REPLACE FUNCTION public.match_marcheur_for_event(_name text, _event_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT mp.user_id
  FROM public.marche_participations mp
  JOIN public.community_profiles cp ON cp.user_id = mp.user_id
  WHERE mp.marche_event_id = _event_id
    AND lower(extensions.unaccent(coalesce(cp.prenom,'') || ' ' || coalesce(cp.nom,'')))
        = lower(extensions.unaccent(_name))
  LIMIT 1;
$$;

INSERT INTO public.event_testimonies (event_id, user_id, author_name, quote, display_order)
VALUES
  ('df85910e-82da-4ef7-98d2-d4c827d1d0ec', '0c9a3fbe-20d0-4989-bde9-24678768e85f', 'Laurence Karki',
   '« Ça m''a permis de prendre conscience de tout ce qui m''entoure et que je ne vois plus parce que j''ai l''habitude de le voir. »', 5),
  ('df85910e-82da-4ef7-98d2-d4c827d1d0ec', '7a5cc1a2-301c-4070-ae62-248558ce0eec', 'Victor Boixeda',
   '« C''est une démarche qui résonne beaucoup avec ce que je cherche : ralentir, observer, être en lien avec le vivant autour de soi. »', 6),
  ('df85910e-82da-4ef7-98d2-d4c827d1d0ec', '1f211844-7d66-479c-8e01-4f3180b3ac24', 'Jean-Paul Chiron',
   '« On redécouvre ce qu''on croyait connaître. La marche partagée donne une autre épaisseur au territoire. »', 7),
  ('df85910e-82da-4ef7-98d2-d4c827d1d0ec', '52650e0c-76ec-4aa5-a405-6969a9ec03c6', 'Jean-François Servant',
   '« Marcher ensemble, c''est apprendre à écouter le sol, les arbres, et finalement les autres. »', 8)
ON CONFLICT (event_id, user_id) DO UPDATE
SET quote = EXCLUDED.quote, author_name = EXCLUDED.author_name, display_order = EXCLUDED.display_order;
