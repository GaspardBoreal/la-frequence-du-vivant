
ALTER TABLE public.community_profiles
  ADD COLUMN IF NOT EXISTS types_marches_interets text[] NULL,
  ADD COLUMN IF NOT EXISTS autre_type_marche text NULL,
  ADD COLUMN IF NOT EXISTS recherche_prioritaire text NULL,
  ADD COLUMN IF NOT EXISTS consentement_analyse_at timestamptz NULL;

CREATE OR REPLACE FUNCTION public.create_community_profile(
  _user_id uuid,
  _prenom text,
  _nom text,
  _ville text DEFAULT NULL::text,
  _telephone text DEFAULT NULL::text,
  _date_naissance text DEFAULT NULL::text,
  _motivation text DEFAULT NULL::text,
  _kigo_accueil text DEFAULT NULL::text,
  _superpouvoir_sensoriel text DEFAULT NULL::text,
  _niveau_intimite_vivant text DEFAULT NULL::text,
  _types_marches_interets text[] DEFAULT NULL,
  _autre_type_marche text DEFAULT NULL,
  _recherche_prioritaire text DEFAULT NULL,
  _consentement_analyse boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  INSERT INTO public.community_profiles (
    user_id, prenom, nom, ville, telephone,
    date_naissance, motivation, kigo_accueil,
    superpouvoir_sensoriel, niveau_intimite_vivant,
    types_marches_interets, autre_type_marche, recherche_prioritaire,
    consentement_analyse_at
  ) VALUES (
    _user_id, _prenom, _nom, _ville, _telephone,
    NULLIF(_date_naissance, '')::date, _motivation, _kigo_accueil,
    _superpouvoir_sensoriel, _niveau_intimite_vivant,
    _types_marches_interets, _autre_type_marche, _recherche_prioritaire,
    CASE WHEN _consentement_analyse THEN now() ELSE NULL END
  );
END;
$function$;
